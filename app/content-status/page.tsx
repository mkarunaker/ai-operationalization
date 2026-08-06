import Link from "next/link";
import { getContentStatus } from "../../src/content/loader";
import { ContentSearch } from "./content-search";

export const dynamic = "force-dynamic";

function SourceCard({ name, source, detail }: { name: string; source: ReturnType<typeof getContentStatus>["bok"]; detail: string }) {
  const ready = source.status === "ready";
  return <article className="source-card">
    <div className="source-card-heading"><div><p className="eyebrow">{detail}</p><h2>{name}</h2></div><span className={`status-pill ${ready ? "ready" : "attention"}`}><i />{ready ? "Ready" : source.status === "missing" ? "Missing" : "Needs attention"}</span></div>
    <dl>
      <div><dt>Configured location</dt><dd className="path-value">{source.path}</dd></div>
      <div><dt>Version</dt><dd>{source.version ?? "Not available"}</dd></div>
      <div><dt>Checksum</dt><dd className="mono">{source.checksum?.slice(0, 16) ?? "Not available"}</dd></div>
      <div><dt>Last loaded</dt><dd>{source.lastIndexedAt ? new Date(source.lastIndexedAt).toLocaleString() : "Not yet loaded"}</dd></div>
      {"indexedSectionCount" in source && <div><dt>Indexed sections</dt><dd>{source.indexedSectionCount ?? 0}</dd></div>}
    </dl>
    {source.error && <p className="source-error">{source.error}</p>}
  </article>;
}

export default function ContentStatusPage() {
  const status = getContentStatus();
  return <main className="status-page">
    <header className="status-header"><Link href="/dashboard" className="back-link">← Workspace</Link><p className="eyebrow">Read-only source inspection</p><h1>Content status</h1><p>These source files remain on your machine. Refreshing validates and indexes them; it never edits, uploads, or replaces them.</p></header>
    <div className="source-grid">
      <SourceCard name="Canonical knowledge base" source={status.bok} detail="EAIO_BOK_PATH" />
      <SourceCard name="KK spoken voice" source={status.voiceSkill} detail="KK_VOICE_SKILL_PATH" />
    </div>
    <ContentSearch />
    <section className="refresh-guidance"><div><p className="eyebrow">Refresh from Terminal</p><h2>Update the local index when a source changes.</h2><p>Run <code>npm run content:index</code>. The last valid knowledge index is preserved if a refresh fails.</p></div><Link className="text-action" href="/api/content/status">View source status JSON <span>→</span></Link></section>
  </main>;
}
