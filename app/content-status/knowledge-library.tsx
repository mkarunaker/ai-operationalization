"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Document = { name: string; selected: boolean; status: "ready" | "missing" | "error"; version?: string; checksum?: string; indexedSectionCount?: number; lastIndexedAt?: string; error?: string };
type Voice = { status: "ready" | "missing" | "error"; version?: string; checksum?: string; lastIndexedAt?: string; error?: string };

function sourceState(status: Document["status"]) { return status === "ready" ? "Indexed" : status === "missing" ? "Not indexed" : "Needs attention"; }
function displayDate(value?: string) { return value ? new Date(value).toLocaleString() : "—"; }

export function KnowledgeLibrary({ documents, voice }: { documents: Document[]; voice: Voice }) {
  const router = useRouter();
  const [selected, setSelected] = useState(() => new Set(documents.filter((document) => document.selected).map((document) => document.name)));
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const selectedDocuments = useMemo(() => documents.filter((document) => selected.has(document.name)), [documents, selected]);
  const availableDocuments = useMemo(() => documents.filter((document) => !selected.has(document.name)), [documents, selected]);
  async function request(body: unknown, success: string) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/content/status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "The source library could not be updated.");
      setMessage(success); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "The source library could not be updated."); }
    finally { setBusy(false); }
  }
  function saveSelection(next: Set<string>, success: string) {
    setSelected(next);
    void request({ action: "select", documents: [...next] }, success);
  }
  return <section className="source-library" aria-labelledby="library-heading">
    <header className="source-library-heading"><div><p className="eyebrow">Local source records</p><h2 id="library-heading">Source library</h2><p>Only selected documents are indexed and available to future Board runs. Removing a source never deletes its local file.</p></div><div className="source-library-actions"><button type="button" onClick={() => request({ action: "index" }, "Selected knowledge documents and the voice reference were refreshed locally.")} disabled={busy || selectedDocuments.length === 0}>Index selected</button><button type="button" onClick={() => setAdding((open) => !open)} disabled={busy}>+ Add documents</button></div></header>
    {adding && <div className="source-library-add"><p>Select files already present in the configured folder.</p>{availableDocuments.length === 0 ? <p>All eligible files are already in the library.</p> : availableDocuments.map((document) => <label key={document.name}><input type="checkbox" checked={selected.has(document.name)} onChange={(event) => setSelected((current) => { const next = new Set(current); if (event.target.checked) next.add(document.name); else next.delete(document.name); return next; })} disabled={busy} /> {document.name}</label>)}<button type="button" onClick={() => saveSelection(new Set(selected), "Selection saved. Use Index to load the new documents.")} disabled={busy}>Save selection</button></div>}
    <div className="source-library-table-wrap"><table className="source-library-table"><thead><tr><th>Source</th><th>Type</th><th>Indexed</th><th>Sections</th><th>Version</th><th>Checksum</th><th>Last indexed</th><th>Actions</th></tr></thead><tbody>
      {selectedDocuments.map((document) => <tr key={document.name}><td>{document.name}{document.error && <small>{document.error}</small>}</td><td>Knowledge</td><td><span className={`status-pill ${document.status === "ready" ? "ready" : "attention"}`}><i />{sourceState(document.status)}</span></td><td>{document.indexedSectionCount ?? "—"}</td><td className="mono">{document.version ?? "—"}</td><td className="mono">{document.checksum?.slice(0, 16) ?? "—"}</td><td>{displayDate(document.lastIndexedAt)}</td><td><button type="button" className="quiet-action" onClick={() => saveSelection(new Set([...selected].filter((name) => name !== document.name)), `${document.name} was removed from the app library.`)} disabled={busy}>Remove</button></td></tr>)}
      <tr><td>KK spoken voice{voice.error && <small>{voice.error}</small>}</td><td>Voice</td><td><span className={`status-pill ${voice.status === "ready" ? "ready" : "attention"}`}><i />{sourceState(voice.status)}</span></td><td>—</td><td className="mono">{voice.version ?? "—"}</td><td className="mono">{voice.checksum?.slice(0, 16) ?? "—"}</td><td>{displayDate(voice.lastIndexedAt)}</td><td>Included in source refresh</td></tr>
      {selectedDocuments.length === 0 && <tr><td colSpan={8} className="source-library-empty">No knowledge documents are selected. Use Add documents to choose files from the configured folder.</td></tr>}
    </tbody></table></div>
    {message && <p className="search-message" role="status">{message}</p>}
  </section>;
}
