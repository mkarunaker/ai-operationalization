import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { getAppConfig, type AppConfig } from "../config/env";
import { openInitializedDatabase, openReadOnlyDatabase } from "../persistence/database";
import { parseMarkdownSections, type ParsedSection } from "./markdown";

type Database = ReturnType<typeof openInitializedDatabase>;
type SourceState = "ready" | "missing" | "error";

export type ContentSourceStatus = {
  name?: string;
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
  knowledgeDocuments: KnowledgeLibraryDocument[];
  voiceSkill: ContentSourceStatus;
  changed: number;
  skipped: number;
  retired: number;
  failed: number;
};

export type KnowledgeLibraryDocument = ContentSourceStatus & { name: string; selected: boolean };
export type PublicContentStatus = {
  bok: Omit<ContentSourceStatus, "path">;
  knowledgeDocuments: Array<Omit<KnowledgeLibraryDocument, "path">>;
  voiceSkill: Omit<ContentSourceStatus, "path">;
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

function markKnowledgeDocumentUnavailable(database: Database, sourcePath: string, status: "missing" | "error") {
  database
    .prepare("UPDATE knowledge_documents SET status = ?, updated_at = ? WHERE source_path = ?")
    .run(status, now(), sourcePath);
}

function syncKnowledgeDocument(database: Database, sourcePath: string): { status: ContentSourceStatus; changed: number; skipped: number; retired: number } {
  if (!fs.existsSync(/* turbopackIgnore: true */ sourcePath)) {
    markKnowledgeDocumentUnavailable(database, sourcePath, "missing");
    const previous = getDocumentStatus(database, sourcePath);
    return { status: { ...previous, name: path.basename(sourcePath), path: sourcePath, status: "missing", error: "Selected knowledge document was not found." }, changed: 0, skipped: 0, retired: 0 };
  }

  const source = fs.readFileSync(/* turbopackIgnore: true */ sourcePath, "utf8");
  const sourceChecksum = checksum(source);
  const prior = getDocumentStatus(database, sourcePath);
  const parsed = parseMarkdownSections(source);
  if (parsed.length === 0) throw new Error("The selected knowledge document does not contain indexable Markdown sections.");
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
      VALUES (?, ?, ?, 'knowledge_library', ?, ?, 'ready', ?, ?, ?)
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
    status: { name: path.basename(sourcePath), path: sourcePath, status: "ready", checksum: sourceChecksum, version, indexedSectionCount: parsed.length, lastIndexedAt: indexedAt },
    changed: parsed.length,
    skipped: 0,
    retired: existing.count,
  };
}

function libraryEntries(config: AppConfig): Array<{ name: string; sourcePath: string }> {
  const directory = config.knowledgeLibraryPath;
  if (!fs.existsSync(/* turbopackIgnore: true */ directory) || !fs.statSync(/* turbopackIgnore: true */ directory).isDirectory()) return [];
  const legacy = path.resolve(config.bokPath);
  return fs.readdirSync(/* turbopackIgnore: true */ directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && !entry.isSymbolicLink() && !entry.name.startsWith(".") && entry.name.endsWith(".md") && entry.name.length <= 180)
    .map((entry) => ({ name: entry.name, sourcePath: path.resolve(directory, entry.name) }))
    .filter((entry) => entry.sourcePath !== legacy && entry.sourcePath.startsWith(`${path.resolve(directory)}${path.sep}`))
    .sort((left, right) => left.name.localeCompare(right.name));
}

function selectedPaths(database: Database): string[] {
  return (database.prepare("SELECT source_path FROM knowledge_library_selections ORDER BY source_path").all() as Array<{ source_path: string }>).map((row) => row.source_path);
}

function libraryStatus(config: AppConfig, documents: ContentSourceStatus[]): ContentSourceStatus {
  const selected = documents.filter((document) => (document as KnowledgeLibraryDocument).selected);
  const ready = selected.length > 0 && selected.every((document) => document.status === "ready");
  return {
    name: "Knowledge library",
    path: config.knowledgeLibraryPath,
    status: ready ? "ready" : selected.length === 0 ? "missing" : "error",
    indexedSectionCount: selected.reduce((sum, document) => sum + (document.indexedSectionCount ?? 0), 0),
    error: ready ? undefined : selected.length === 0 ? "Select one or more knowledge documents, then index them." : "One or more selected knowledge documents need attention.",
  };
}

/** Safe directory inventory only; document text is never returned from this API. */
export function setSelectedKnowledgeDocuments(names: unknown, config = getAppConfig()) {
  if (!Array.isArray(names) || names.length > 60 || names.some((name) => typeof name !== "string"))
    throw new Error("Select up to sixty knowledge documents.");
  const available = new Map(libraryEntries(config).map((entry) => [entry.name, entry.sourcePath]));
  const uniqueNames = [...new Set(names)];
  if (uniqueNames.length !== names.length || uniqueNames.some((name) => !available.has(name)))
    throw new Error("Choose only documents currently available in the configured knowledge library folder.");
  const database = prepareDatabase(config);
  try {
    database.exec("BEGIN IMMEDIATE;");
    try {
      database.prepare("DELETE FROM knowledge_library_selections").run();
      const insert = database.prepare("INSERT INTO knowledge_library_selections (source_path, selected_at) VALUES (?, ?)");
      for (const name of uniqueNames) insert.run(available.get(name)!, now());
      database.prepare("UPDATE knowledge_documents SET status = 'retired', updated_at = ? WHERE source_type = 'knowledge_library' AND source_path NOT IN (SELECT source_path FROM knowledge_library_selections)").run(now());
      database.exec("COMMIT;");
    } catch (error) { database.exec("ROLLBACK;"); throw error; }
  } finally { database.close(); }
  return getContentStatus(config);
}

export function readyKnowledgeDocuments(config = getAppConfig()): Array<{ id: string; version: string; checksum: string; title: string }> {
  const database = openReadOnlyDatabase(config.databasePath);
  try {
    return database.prepare("SELECT id, version, checksum, title FROM knowledge_documents WHERE source_type = 'knowledge_library' AND status = 'ready' AND source_path IN (SELECT source_path FROM knowledge_library_selections) ORDER BY source_path").all() as Array<{ id: string; version: string; checksum: string; title: string }>;
  } finally { database.close(); }
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
    const selected = new Set(selectedPaths(database));
    const available = libraryEntries(config);
    const known = new Map(available.map((entry) => [entry.sourcePath, entry.name]));
    const documents: KnowledgeLibraryDocument[] = [];
    let changed = 0; let skipped = 0; let retired = 0;
    for (const sourcePath of selected) {
      let result: ReturnType<typeof syncKnowledgeDocument>;
      try { result = syncKnowledgeDocument(database, sourcePath); }
      catch {
        markKnowledgeDocumentUnavailable(database, sourcePath, "error");
        const previous = getDocumentStatus(database, sourcePath);
        result = { status: { ...(previous ?? { path: sourcePath, status: "error" as const }), name: known.get(sourcePath) ?? path.basename(sourcePath), status: "error", error: "Unable to index selected knowledge document. The last valid index was preserved." }, changed: 0, skipped: 0, retired: 0 };
      }
      documents.push({ ...result.status, name: result.status.name ?? known.get(sourcePath) ?? path.basename(sourcePath), selected: true });
      changed += result.changed; skipped += result.skipped; retired += result.retired;
    }
    for (const entry of available) if (!selected.has(entry.sourcePath)) {
      const prior = getDocumentStatus(database, entry.sourcePath);
      documents.push({ ...(prior ?? { name: entry.name, path: entry.sourcePath, status: "missing" as const, error: "Not selected for indexing." }), name: entry.name, selected: false });
    }
    const bok = libraryStatus(config, documents);
    let voiceSkill: ContentSourceStatus;
    try {
      voiceSkill = syncVoiceSkill(database, config);
    } catch (error) {
      voiceSkill = { path: voiceSkillFile(config), status: "error", error: error instanceof Error ? error.message : "Unable to refresh voice skill." };
    }
    return { bok, knowledgeDocuments: documents.sort((left, right) => left.name.localeCompare(right.name)), voiceSkill, changed, skipped, retired, failed: Number(bok.status === "error") + Number(voiceSkill.status === "error") };
  } finally {
    database.close();
  }
}

export function publicContentStatus(status: ReturnType<typeof getContentStatus>): PublicContentStatus {
  const withoutPath = (source: ContentSourceStatus) => Object.fromEntries(Object.entries(source).filter(([key]) => key !== "path")) as Omit<ContentSourceStatus, "path">;
  return {
    bok: withoutPath(status.bok),
    knowledgeDocuments: status.knowledgeDocuments.map((document) => Object.fromEntries(Object.entries(document).filter(([key]) => key !== "path")) as Omit<KnowledgeLibraryDocument, "path">),
    voiceSkill: withoutPath(status.voiceSkill),
  };
}

export function getContentStatus(config = getAppConfig()): { bok: ContentSourceStatus; knowledgeDocuments: KnowledgeLibraryDocument[]; voiceSkill: ContentSourceStatus } {
  let database: Database;
  try {
    database = openReadOnlyDatabase(config.databasePath);
  } catch {
    return {
      bok: { name: "Knowledge library", path: config.knowledgeLibraryPath, status: "error", error: "The local content index is unavailable. Run npm run db:migrate, then select and index knowledge documents." },
      knowledgeDocuments: [],
      voiceSkill: { path: voiceSkillFile(config), status: "error", error: "The local content index is unavailable. Run npm run db:migrate, then npm run content:index." },
    };
  }
  try {
    const selected = new Set(selectedPaths(database));
    const documents = libraryEntries(config).map((entry) => ({
      ...(getDocumentStatus(database, entry.sourcePath) ?? { name: entry.name, path: entry.sourcePath, status: "missing" as const, error: selected.has(entry.sourcePath) ? "Selected but not indexed yet." : "Not selected for indexing." }),
      name: entry.name,
      selected: selected.has(entry.sourcePath),
    }));
    for (const sourcePath of selected) if (!documents.some((document) => document.path === sourcePath)) {
      const previous = getDocumentStatus(database, sourcePath);
      documents.push({ ...previous, name: path.basename(sourcePath), path: sourcePath, status: "missing", selected: true, error: "Selected knowledge document was not found." });
    }
    const bok = libraryStatus(config, documents);
    const skillPath = voiceSkillFile(config);
    const voice = database.prepare(`SELECT checksum, version, status, loaded_at FROM voice_skill_versions WHERE source_path = ? ORDER BY loaded_at DESC LIMIT 1`).get(skillPath) as { checksum: string; version: string; status: SourceState; loaded_at: string } | undefined;
    return { bok, knowledgeDocuments: documents.sort((left, right) => left.name.localeCompare(right.name)), voiceSkill: voice ? { path: skillPath, status: voice.status, checksum: voice.checksum, version: voice.version, lastIndexedAt: voice.loaded_at } : { path: skillPath, status: fs.existsSync(/* turbopackIgnore: true */ skillPath) ? "error" : "missing", error: "Not loaded yet. Run npm run content:index." } };
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
      JOIN knowledge_library_selections selection ON selection.source_path = document.source_path
      WHERE knowledge_search MATCH ?
        AND document.source_type = 'knowledge_library'
        AND document.status IN ('ready', 'error')
        AND section.source_version = document.version
      ORDER BY score LIMIT ?
    `).all(cleanQuery.split(/\s+/).map((term) => `"${term}"`).join(" OR "), Math.min(Math.max(limit, 1), 30)) as Array<{ heading_path: string; text: string; sequence: number; metadata: string; title: string; version: string; score: number }>;
    return rows.map((row) => ({ headingPath: row.heading_path, text: row.text, sequence: row.sequence, sourceLocation: (JSON.parse(row.metadata) as { sourceLocation: string }).sourceLocation, documentTitle: row.title, version: row.version, score: Math.abs(row.score), retrievalMethod: "fts5" }));
  } finally { database.close(); }
}
