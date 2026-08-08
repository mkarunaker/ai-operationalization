import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { getAppConfig, type AppConfig } from "../config/env";
import { openInitializedDatabase, openReadOnlyDatabase } from "../persistence/database";
import { parseMarkdownSections, type ParsedSection } from "./markdown";

type Database = ReturnType<typeof openInitializedDatabase>;
type SourceState = "ready" | "missing" | "error";

export type ContentSourceStatus = {
  path: string;
  status: SourceState;
  checksum?: string;
  version?: string;
  indexedSectionCount?: number;
  lastIndexedAt?: string;
  error?: string;
};

export type ContentIndexReport = {
  bok: ContentSourceStatus;
  voiceSkill: ContentSourceStatus;
  changed: number;
  skipped: number;
  retired: number;
  failed: number;
};

export type KnowledgeSearchResult = ParsedSection & {
  documentTitle: string;
  score: number;
  version: string;
  retrievalMethod: "fts5";
};

const checksum = (value: string | Buffer) => crypto.createHash("sha256").update(value).digest("hex");
const stableId = (prefix: string, value: string) => `${prefix}_${checksum(value).slice(0, 28)}`;
const now = () => new Date().toISOString();

function prepareDatabase(config: AppConfig): Database {
  return openInitializedDatabase(config.databasePath);
}

function voiceSkillFile(config: AppConfig): string {
  const configured = config.voiceSkillPath;
  if (fs.existsSync(/* turbopackIgnore: true */ configured) && fs.statSync(/* turbopackIgnore: true */ configured).isFile()) return configured;
  return path.join(configured, "SKILL.md");
}

function getDocumentStatus(database: Database, sourcePath: string): ContentSourceStatus | undefined {
  const document = database.prepare(`
    SELECT checksum, version, status, updated_at
    FROM knowledge_documents WHERE source_path = ?
  `).get(sourcePath) as { checksum: string; version: string; status: SourceState; updated_at: string } | undefined;
  if (!document) return undefined;
  const count = database.prepare(`
    SELECT COUNT(*) AS count FROM knowledge_sections section
    JOIN knowledge_documents document ON document.id = section.document_id
    WHERE document.source_path = ? AND section.source_version = document.version
  `).get(sourcePath) as { count: number };
  return {
    path: sourcePath,
    status: document.status,
    checksum: document.checksum,
    version: document.version,
    indexedSectionCount: count.count,
    lastIndexedAt: document.updated_at,
  };
}

function syncBookOfKnowledge(database: Database, config: AppConfig): { status: ContentSourceStatus; changed: number; skipped: number; retired: number } {
  const sourcePath = config.bokPath;
  if (!fs.existsSync(/* turbopackIgnore: true */ sourcePath)) return { status: { path: sourcePath, status: "missing", error: "Configured Book of Knowledge file was not found." }, changed: 0, skipped: 0, retired: 0 };

  const source = fs.readFileSync(/* turbopackIgnore: true */ sourcePath, "utf8");
  const sourceChecksum = checksum(source);
  const prior = getDocumentStatus(database, sourcePath);
  const parsed = parseMarkdownSections(source);
  if (parsed.length === 0) throw new Error("The Book of Knowledge does not contain indexable Markdown sections.");
  if (prior?.checksum === sourceChecksum && prior.status === "ready") {
    const priorVersion = prior.version ?? "";
    database
      .prepare(
        "UPDATE knowledge_sections SET source_version = ? WHERE document_id = (SELECT id FROM knowledge_documents WHERE source_path = ?) AND source_version IS NULL",
      )
      .run(priorVersion, sourcePath);
    const current = getDocumentStatus(database, sourcePath) ?? prior;
    return { status: current, changed: 0, skipped: current.indexedSectionCount ?? 0, retired: 0 };
  }

  const documentId = stableId("bok", sourcePath);
  const version = sourceChecksum.slice(0, 12);
  const indexedAt = now();
  const existing = database.prepare("SELECT COUNT(*) AS count FROM knowledge_sections WHERE document_id = ? AND source_version = ?").get(documentId, prior?.version ?? "") as { count: number };

  database.exec("BEGIN IMMEDIATE;");
  try {
    database.prepare(`
      INSERT INTO knowledge_documents (id, title, source_path, source_type, version, checksum, status, metadata, created_at, updated_at)
      VALUES (?, ?, ?, 'book_of_knowledge', ?, ?, 'ready', ?, ?, ?)
      ON CONFLICT(source_path) DO UPDATE SET title = excluded.title, version = excluded.version,
        checksum = excluded.checksum, status = 'ready', metadata = excluded.metadata, updated_at = excluded.updated_at
    `).run(documentId, path.basename(sourcePath), sourcePath, version, sourceChecksum, JSON.stringify({ indexedAt }), indexedAt, indexedAt);
    if (prior?.version)
      database
        .prepare("UPDATE knowledge_sections SET source_version = ? WHERE document_id = ? AND source_version IS NULL")
        .run(prior.version, documentId);
    database.prepare("DELETE FROM knowledge_search WHERE section_id IN (SELECT id FROM knowledge_sections WHERE document_id = ?)").run(documentId);
    const maxSequence = database.prepare("SELECT COALESCE(MAX(sequence), 0) AS value FROM knowledge_sections WHERE document_id = ?").get(documentId) as { value: number };
    const sectionInsert = database.prepare(`
      INSERT INTO knowledge_sections (id, document_id, heading_path, text, sequence, source_version, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        document_id = excluded.document_id,
        heading_path = excluded.heading_path,
        text = excluded.text,
        sequence = excluded.sequence,
        source_version = excluded.source_version,
        metadata = excluded.metadata
    `);
    const searchInsert = database.prepare("INSERT INTO knowledge_search (section_id, heading_path, text) VALUES (?, ?, ?)");
    for (const section of parsed) {
      const sectionId = stableId("section", `${sourcePath}:${version}:${section.headingPath}:${section.sequence}:${checksum(section.text)}`);
      sectionInsert.run(sectionId, documentId, section.headingPath, section.text, maxSequence.value + section.sequence, version, JSON.stringify({ sourceLocation: section.sourceLocation, checksum: checksum(section.text) }));
      searchInsert.run(sectionId, section.headingPath, section.text);
    }
    database.exec("COMMIT;");
  } catch (error) {
    database.exec("ROLLBACK;");
    throw error;
  }
  return {
    status: { path: sourcePath, status: "ready", checksum: sourceChecksum, version, indexedSectionCount: parsed.length, lastIndexedAt: indexedAt },
    changed: parsed.length,
    skipped: 0,
    retired: existing.count,
  };
}

function syncVoiceSkill(database: Database, config: AppConfig): ContentSourceStatus {
  const sourcePath = voiceSkillFile(config);
  if (!fs.existsSync(/* turbopackIgnore: true */ sourcePath)) return { path: sourcePath, status: "missing", error: "Configured voice skill file was not found." };
  const source = fs.readFileSync(/* turbopackIgnore: true */ sourcePath, "utf8");
  const sourceChecksum = checksum(source);
  const version = sourceChecksum.slice(0, 12);
  const indexedAt = now();
  database.prepare(`
    INSERT INTO voice_skill_versions (id, name, source_path, version, checksum, status, loaded_at, metadata)
    VALUES (?, 'kk-spoken-voice', ?, ?, ?, 'ready', ?, ?)
    ON CONFLICT(source_path, checksum) DO UPDATE SET status = 'ready', loaded_at = excluded.loaded_at
  `).run(stableId("voice", `${sourcePath}:${sourceChecksum}`), sourcePath, version, sourceChecksum, indexedAt, JSON.stringify({ configuredPath: config.voiceSkillPath }));
  return { path: sourcePath, status: "ready", checksum: sourceChecksum, version, lastIndexedAt: indexedAt };
}

export function refreshContent(config = getAppConfig()): ContentIndexReport {
  const database = prepareDatabase(config);
  try {
    let bok: ReturnType<typeof syncBookOfKnowledge>;
    try {
      bok = syncBookOfKnowledge(database, config);
    } catch (error) {
      const previous = getDocumentStatus(database, config.bokPath);
      bok = { status: { ...(previous ?? { path: config.bokPath, status: "error" as const }), status: "error", error: error instanceof Error ? error.message : "Unable to refresh Book of Knowledge." }, changed: 0, skipped: 0, retired: 0 };
    }
    let voiceSkill: ContentSourceStatus;
    try {
      voiceSkill = syncVoiceSkill(database, config);
    } catch (error) {
      voiceSkill = { path: voiceSkillFile(config), status: "error", error: error instanceof Error ? error.message : "Unable to refresh voice skill." };
    }
    return { bok: bok.status, voiceSkill, changed: bok.changed, skipped: bok.skipped, retired: bok.retired, failed: Number(bok.status.status === "error") + Number(voiceSkill.status === "error") };
  } finally {
    database.close();
  }
}

export function getContentStatus(config = getAppConfig()): { bok: ContentSourceStatus; voiceSkill: ContentSourceStatus } {
  let database: Database;
  try {
    database = openReadOnlyDatabase(config.databasePath);
  } catch {
    return {
      bok: { path: config.bokPath, status: "error", error: "The local content index is unavailable. Run npm run db:migrate, then npm run content:index." },
      voiceSkill: { path: voiceSkillFile(config), status: "error", error: "The local content index is unavailable. Run npm run db:migrate, then npm run content:index." },
    };
  }
  try {
    const bok = getDocumentStatus(database, config.bokPath) ?? { path: config.bokPath, status: fs.existsSync(/* turbopackIgnore: true */ config.bokPath) ? "error" : "missing", error: "Not indexed yet. Run npm run content:index." };
    const skillPath = voiceSkillFile(config);
    const voice = database.prepare(`SELECT checksum, version, status, loaded_at FROM voice_skill_versions WHERE source_path = ? ORDER BY loaded_at DESC LIMIT 1`).get(skillPath) as { checksum: string; version: string; status: SourceState; loaded_at: string } | undefined;
    return { bok, voiceSkill: voice ? { path: skillPath, status: voice.status, checksum: voice.checksum, version: voice.version, lastIndexedAt: voice.loaded_at } : { path: skillPath, status: fs.existsSync(/* turbopackIgnore: true */ skillPath) ? "error" : "missing", error: "Not loaded yet. Run npm run content:index." } };
  } finally { database.close(); }
}

export function searchKnowledge(query: string, limit = 12, config = getAppConfig()): KnowledgeSearchResult[] {
  const cleanQuery = query.trim().replace(/[^\p{L}\p{N}_ -]/gu, " ").trim();
  if (!cleanQuery) return [];
  let database: Database;
  try {
    database = openReadOnlyDatabase(config.databasePath);
  } catch {
    return [];
  }
  try {
    const rows = database.prepare(`
      SELECT section.heading_path, section.text, section.sequence, section.metadata, document.title, document.version,
        bm25(knowledge_search, 8.0, 1.0) AS score
      FROM knowledge_search
      JOIN knowledge_sections section ON section.id = knowledge_search.section_id
      JOIN knowledge_documents document ON document.id = section.document_id
      WHERE knowledge_search MATCH ? AND document.status = 'ready' AND section.source_version = document.version
      ORDER BY score LIMIT ?
    `).all(cleanQuery.split(/\s+/).map((term) => `"${term}"`).join(" OR "), Math.min(Math.max(limit, 1), 30)) as Array<{ heading_path: string; text: string; sequence: number; metadata: string; title: string; version: string; score: number }>;
    return rows.map((row) => ({ headingPath: row.heading_path, text: row.text, sequence: row.sequence, sourceLocation: (JSON.parse(row.metadata) as { sourceLocation: string }).sourceLocation, documentTitle: row.title, version: row.version, score: Math.abs(row.score), retrievalMethod: "fts5" }));
  } finally { database.close(); }
}
