"use client";

import { FormEvent, useState } from "react";

type Result = { headingPath: string; text: string; sourceLocation: string; documentTitle: string; version: string };

export function ContentSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanQuery = query.trim();
    if (!cleanQuery) return;
    setMessage("Searching your local knowledge base…");
    const response = await fetch(`/api/content/status?q=${encodeURIComponent(cleanQuery)}`);
    if (!response.ok) { setMessage("The local search could not be completed."); return; }
    const payload = await response.json() as { results: Result[] };
    setResults(payload.results);
    setMessage(payload.results.length ? `${payload.results.length} relevant section${payload.results.length === 1 ? "" : "s"} found.` : "No matching indexed sections found.");
  }

  return <section className="knowledge-search" aria-labelledby="search-heading">
    <div><p className="eyebrow">Local retrieval</p><h2 id="search-heading">Search the knowledge base</h2><p>Find the exact sections that will later be available as traceable editorial context.</p></div>
    <form onSubmit={submit} className="search-form"><label htmlFor="knowledge-query">Keyword or phrase</label><div><input id="knowledge-query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try a topic or claim" maxLength={180} /><button type="submit">Search</button></div></form>
    {message && <p className="search-message" role="status">{message}</p>}
    {results.length > 0 && <div className="search-results">{results.map((result) => <article key={`${result.headingPath}-${result.sourceLocation}`}><p className="eyebrow">{result.documentTitle} · {result.sourceLocation}</p><h3>{result.headingPath}</h3><p>{result.text.length > 360 ? `${result.text.slice(0, 360)}…` : result.text}</p></article>)}</div>}
  </section>;
}
