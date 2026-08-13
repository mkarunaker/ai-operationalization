import Link from "next/link";
import { getContentStatus } from "../../src/content/loader";
import { AppNav } from "../app-nav";
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

function IdeaCaptureGuide() {
  return <details className="idea-capture-guide">
    <summary>Idea capture template <small>Reusable writing reference</small></summary>
    <p>Use this when an idea needs more shape. It works for any subject. The four fields carry one narrative arc: fact, tension, discovery, and takeaway. If one is empty or generic, the app returns a focused question before any Editorial Board call is made.</p>
    <ol>
      <li><strong>Situation · required</strong><p>What happened, and where. Use one real situation, not a composite. Name the team, role, setting, or scale when you have it.</p></li>
      <li><strong>Assumption · required</strong><p>The belief that was in the room, stated as someone would actually say it. This supplies the tension and identifies the reader who holds it.</p></li>
      <li><strong>Discovery · required</strong><p>What turned out to be true instead. Push past “it was more complex”: say what had to exist, what changed, what it cost, or what would have gone wrong.</p></li>
      <li><strong>Principle · required</strong><p>What you would plainly tell someone facing the same thing. One line, in your own register. It may inform the close without appearing as a maxim.</p></li>
    </ol>
    <p>Everything in the four fields is eligible to be kept verbatim. Assumption quotes and the Principle are especially likely to survive when used. Use <strong>Add what you know</strong> for #tags, source references, a related line, or material for a future post.</p>
    <section className="capture-guide-example">
      <p className="eyebrow">WORKED EXAMPLE · ONE SUBJECT, NOT A REQUIRED TOPIC</p>
      <h3>Understanding the machinery underneath</h3>
      <p><strong>Situation:</strong> A leader wanted the same AI enablement another company had, because it looked easy from outside.</p>
      <p><strong>Assumption:</strong> “If they can do it in 10 minutes, we should be able to as well.”</p>
      <p><strong>Discovery:</strong> The visible implementation depended on data plumbing, access controls, and a review path that had been built over time.</p>
      <p><strong>Principle:</strong> Don’t copy the visible outcome without understanding the machinery underneath it.</p>
    </section>
  </details>;
}

export default function ContentStatusPage() {
  const status = getContentStatus();
  return <main className="queue-shell"><AppNav /><section className="status-page">
    <header className="status-header"><Link href="/dashboard" className="back-link">← Workspace</Link><p className="eyebrow">Read-only source inspection</p><h1>Content status</h1><p>These source files remain on your machine. Refreshing validates and indexes them; it never edits, uploads, or replaces them.</p></header>
    <div className="source-grid">
      <SourceCard name="Canonical knowledge base" source={status.bok} detail="EAIO_BOK_PATH" />
      <SourceCard name="KK spoken voice" source={status.voiceSkill} detail="KK_VOICE_SKILL_PATH" />
    </div>
    <ContentSearch />
    <IdeaCaptureGuide />
    <section className="refresh-guidance"><div><p className="eyebrow">Refresh from Terminal</p><h2>Update the local index when a source changes.</h2><p>Run <code>npm run content:index</code>. The last valid knowledge index is preserved if a refresh fails.</p></div><Link className="text-action" href="/api/content/status">View source status JSON <span>→</span></Link></section>
  </section></main>;
}
