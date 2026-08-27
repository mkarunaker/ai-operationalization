import Link from "next/link";
import { getContentStatus } from "../../src/content/loader";
import { AppNav } from "../app-nav";
import { ContentSearch } from "./content-search";
import { KnowledgeLibrary } from "./knowledge-library";

export const dynamic = "force-dynamic";

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
  const voice = (({ status: voiceStatus, version, checksum, lastIndexedAt, error }) => ({ status: voiceStatus, version, checksum, lastIndexedAt, error }))(status.voiceSkill);
  return <main className="queue-shell"><AppNav /><section className="status-page">
    <header className="status-header"><Link href="/dashboard" className="back-link">← Workspace</Link><p className="eyebrow">Local source controls</p><h1>Content status</h1><p>These source files remain on your machine. Refreshing validates and indexes them; it never edits, uploads, or replaces them.</p></header>
    <KnowledgeLibrary documents={status.knowledgeDocuments.map(({ name, selected, status: documentStatus, version, checksum, indexedSectionCount, lastIndexedAt, error }) => ({ name, selected, status: documentStatus, version, checksum, indexedSectionCount, lastIndexedAt, error }))} voice={voice} />
    <ContentSearch />
    <IdeaCaptureGuide />
    <section className="refresh-guidance"><div><p className="eyebrow">Refresh from Terminal</p><h2>Update the local index when a source changes.</h2><p>Use Index selected above, or run <code>npm run content:index</code>. The last valid knowledge index is preserved if a refresh fails.</p></div><Link className="text-action" href="/api/content/status">View source status JSON <span>→</span></Link></section>
  </section></main>;
}
