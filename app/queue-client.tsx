"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppNav } from "./app-nav";
import { VisualFlow } from "./visual-flow";
import type { EditorialRunProgress } from "@/editorial/run-progress";

export type Status =
  | "inbox"
  | "developing"
  | "ready_to_review"
  | "drafted"
  | "published"
  | "parked";
export type Theme = { id: string; name: string };
export type Idea = {
  id: string;
  title: string;
  rawNotes: string;
  status: Status;
  priority: number;
  publicationPlan: string | null;
  createdAt: string;
  updatedAt: string;
  themes: Theme[];
};
export type Detail = Idea & {
  notes: Array<{ id: string; body: string; createdAt: string }>;
  questions: string[];
  answers: Array<{ question: string; answer: string; choice: string }>;
  draft?: { id: string; body: string; version: number; createdBy: string };
  canonicalDraft?: { id: string; body: string; version: number; createdBy: string; approved: boolean };
  linkedinCompanion?: { id: string; body: string; version: number; createdBy: string; stale: boolean; approved: boolean; sourceCanonicalVersion: number };
  context: Array<{ headingPath: string; sourceLocation: string; text: string }>;
  editorialBrief?: {
    runId: string;
    executionMode?: string;
    runStatus?: "completed" | "partially_completed";
    thesis: string;
    strongest: string;
    unclear: string;
    counterargument: string;
    evidenceNeeded: string;
    recommendedChanges: string[];
    nextStep: string;
    reviews: Array<{
      role: string;
      status?: string;
      summary: string;
      confidence: number;
      checkStatus?: "pass" | "review" | "needs_revision";
      details: string[];
    }>;
  };
  finalReview?: {
    runId: string;
    draftVersionId: string;
    readiness: "ready" | "revise";
    summary: string;
    initialRecommendations: string[];
    recommendationStatuses: Array<{
      recommendation: string;
      disposition?: "resolved" | "revised" | "superseded" | "still_open";
    }>;
    addressed: string[];
    remaining: string[];
    newConcerns: string[];
    polishSuggestions?: Array<{
      id: string;
      current: string;
      suggested: string;
      reason: string;
    }>;
    nextStep: string;
    reviews: Array<{
      role: string;
      status?: string;
      summary: string;
      confidence: number;
      checkStatus?: "pass" | "review" | "needs_revision";
      details: string[];
    }>;
  };
  linkedinCompanionFinalReview?: Detail["finalReview"];
  publicationIntegrityWarning?: string;
  publications: Array<{
    draftVersionId: string;
    platform: "linkedin" | "medium" | "substack";
    publishedAt: string;
    url?: string;
  }>;
  visualCompanion?: {
    id: string;
    draftVersionId: string;
    type: "flow";
    eyebrow: string;
    title: string;
    subtitle: string;
    steps: Array<{ title: string; detail: string }>;
    altText: string;
    caption: string;
    filePath: string;
    createdAt: string;
  };
  reviewHistory: Array<{
    runId: string;
    reviewType: "editorial" | "final_draft";
    draftVersion: number;
    completedAt: string;
    summary: string;
    reviews: Array<{
      role: string;
      status?: string;
      summary: string;
      confidence: number;
      checkStatus?: "pass" | "review" | "needs_revision";
      details: string[];
    }>;
  }>;
  escalations: Array<{
    modelCallId: string;
    role: string;
    provider: string;
    model: string;
    tier?: string;
    escalationReason: string;
    reviewSummary?: string;
    lowerCost?: {
      modelCallId: string;
      provider: string;
      model: string;
      tier?: string;
      reviewSummary?: string;
    };
    outputAccepted?: boolean;
    influencedFinalDraft?: boolean;
    materiallyImproved?: boolean;
  }>;
  grounding?: {
    runId: string;
    executionMode: "grounded_test" | "live";
    draftVersionId?: string;
    bok: { version: string; checksum: string };
    voice: { version: string; checksum: string };
    sections: Array<{
      headingPath: string;
      sourceLocation: string;
      text: string;
      score: number;
      rank: number;
    }>;
    calls: Array<{
      role: string;
      provider: string;
      model: string;
      promptVersion?: string;
      success: boolean;
      inputTokens?: number;
      outputTokens?: number;
      totalTokens?: number;
      latencyMs?: number;
      estimatedCost: number;
      retryCount: number;
      errorCategory?: string;
    }>;
  };
};

const statusLabels: Record<Status, string> = {
  inbox: "Inbox",
  developing: "Developing",
  ready_to_review: "Ready to review",
  drafted: "Drafted",
  published: "Published",
  parked: "Parked",
};
const plans = [
  { value: "linkedin", label: "LinkedIn only · 1–2 min" },
  { value: "medium", label: "Medium · 3–4 min" },
  { value: "substack", label: "Substack · 3–4 min" },
  { value: "medium_linkedin", label: "Medium + LinkedIn companion" },
  { value: "substack_linkedin", label: "Substack + LinkedIn companion" },
];
type VoiceCheckResult = {
  riskPercent: number;
  label: string;
  findings: Array<{ id: string; severity: string; message: string; suggestion: string }>;
  disclaimer: string;
  draftVersionId: string;
};
const short = (value: string, size = 140) =>
  value.length > size ? `${value.slice(0, size).trim()}…` : value;

export function QueueClient() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [capture, setCapture] = useState("");
  const [captureThemes, setCaptureThemes] = useState<string[]>([]);
  const [newTheme, setNewTheme] = useState("");
  const [filter, setFilter] = useState<Status | "all">("all");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const visible = useMemo(
    () => ideas.filter((idea) => filter === "all" || idea.status === filter),
    [ideas, filter],
  );
  async function refresh() {
    const response = await fetch("/api/ideas");
    const data = (await response.json()) as { ideas: Idea[]; themes: Theme[] };
    setIdeas(data.ideas);
    setThemes(data.themes);
  }
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timer); // Initial local-data load only.
  }, []);
  async function createIdea(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawNotes: capture, themeIds: captureThemes }),
      });
      const data = (await response.json()) as { idea?: Detail; error?: string };
      if (!response.ok || !data.idea)
        throw new Error(data.error ?? "Could not save the idea.");
      setCapture("");
      setCaptureThemes([]);
      setMessage("Saved to Inbox. Pick it up whenever you are ready.");
      await refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not save the idea.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function addTheme() {
    if (!newTheme.trim()) return;
    setBusy(true);
    try {
      const response = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_theme", name: newTheme }),
      });
      const data = (await response.json()) as { theme?: Theme; error?: string };
      if (!response.ok || !data.theme)
        throw new Error(data.error ?? "Could not add theme.");
      setThemes((current) =>
        [...current, data.theme!].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setCaptureThemes((current) => [...current, data.theme!.id]);
      setNewTheme("");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not add theme.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="queue-shell">
      <AppNav>
        <p className="sidebar-label">IDEA QUEUE</p>
        <nav className="queue-filters">
          {(["all", ...Object.keys(statusLabels)] as Array<Status | "all">).map(
            (status) => (
              <button
                key={status}
                className={filter === status ? "filter active" : "filter"}
                onClick={() => setFilter(status)}
              >
                {status === "all" ? "All ideas" : statusLabels[status]}{" "}
                <small>
                  {status === "all"
                    ? ideas.length
                    : ideas.filter((idea) => idea.status === status).length}
                </small>
              </button>
            ),
          )}
        </nav>
      </AppNav>
      <section className="queue-main">
        <header className="queue-header">
          <div>
            <p className="eyebrow">Personal thinking and writing workspace</p>
            <h1>Capture the thought. Develop it when it matters.</h1>
          </div>
          <span className="local-badge">Local-only</span>
        </header>
        {message && (
          <p className="notice" role="status">
            {message}
          </p>
        )}
        <form className="capture-card" onSubmit={createIdea}>
          <label htmlFor="capture">
            <strong>What are you thinking about?</strong>
            <span>
              A sentence, bullets, rough notes, a question, or an early possible
              post.
            </span>
          </label>
          <textarea
            id="capture"
            value={capture}
            onChange={(event) => setCapture(event.target.value)}
            placeholder="Write freely. Nothing needs to be polished."
            minLength={2}
            maxLength={50_000}
            required
          />
          <div className="capture-footer">
            <div className="theme-pills">
              {themes.map((theme) => (
                <label key={theme.id}>
                  <input
                    type="checkbox"
                    checked={captureThemes.includes(theme.id)}
                    onChange={() =>
                      setCaptureThemes((current) =>
                        current.includes(theme.id)
                          ? current.filter((id) => id !== theme.id)
                          : [...current, theme.id],
                      )
                    }
                  />
                  {theme.name}
                </label>
              ))}
              <div className="new-theme">
                <input
                  value={newTheme}
                  onChange={(event) => setNewTheme(event.target.value)}
                  placeholder="Add a theme"
                  maxLength={100}
                />
                <button
                  type="button"
                  className="quiet-button"
                  disabled={busy}
                  onClick={addTheme}
                  aria-label="Add theme"
                >
                  +
                </button>
              </div>
            </div>
            <div className="capture-actions">
              <button disabled={busy} type="submit">
                {busy ? "Saving…" : "Save to Inbox"}
              </button>
            </div>
          </div>
        </form>
        <section className="queue-list-only" aria-label="Idea queue">
          <div className="section-heading">
            <h2>{filter === "all" ? "Your ideas" : statusLabels[filter]}</h2>
            <span>{visible.length} items</span>
          </div>
          {visible.length ? (
            visible.map((idea) => (
              <Link
                className="idea-card"
                key={idea.id}
                href={`/ideas/${idea.id}`}
              >
                <div>
                  <span className={`status ${idea.status}`}>
                    {statusLabels[idea.status]}
                  </span>
                  <h3>{idea.title}</h3>
                  <p>{short(idea.rawNotes)}</p>
                  <div className="card-meta">
                    {idea.themes.map((theme) => (
                      <span key={theme.id}>{theme.name}</span>
                    ))}
                  </div>
                </div>
                <b>›</b>
              </Link>
            ))
          ) : (
            <p className="empty">No ideas here yet. Capture one above.</p>
          )}
        </section>
      </section>
    </main>
  );
}

export function IdeaDetailView({
  idea,
  themes,
  note,
  setNote,
  setSelected,
  busy,
  startDeveloping,
  deleteIdea,
  saveDetails,
  answers,
  setAnswers,
  finishDevelopment,
  createGroundedDraft,
  board,
  livePreview,
  liveBoard,
  executionStatus,
  executionProgress,
  rerunReviewer,
  finalReview,
  setRecommendationDisposition,
  setEscalationOutcome,
  draft,
  setDraft,
  saveDraft,
  publish,
  request,
  showDevelopment = true,
  showBoard = true,
  showDraft = true,
  showPublish = false,
  showProvenance = false,
  compactCapture = false,
  showPriority = true,
  reviewHref,
  voiceChecks,
  checkVoice,
  createVisual,
  createLinkedinCompanion,
  companionDraft,
  setCompanionDraft,
  saveLinkedinCompanion,
  draftDirty = false,
  onDraftChange,
  companionDirty = false,
  onCompanionChange,
}: {
  idea: Detail;
  themes: Theme[];
  note: string;
  setNote: (value: string) => void;
  setSelected: (idea: Detail) => void;
  busy: boolean;
  startDeveloping: () => Promise<void>;
  deleteIdea?: () => Promise<void>;
  saveDetails: (event: FormEvent) => Promise<void>;
  answers: Record<string, string>;
  setAnswers: (value: Record<string, string>) => void;
  finishDevelopment: (best: boolean) => Promise<void>;
  createGroundedDraft: () => Promise<void>;
  board: () => Promise<void>;
  livePreview?: {
    provider: string;
    model: string;
    tier: "low" | "medium" | "high";
    budgetCap: number;
    maximumBudgetCap: number;
    pricingAssumption: string;
    available: boolean;
    estimatedCost: number;
    planned: Array<{ role: string; provider: string; model: string; tier: "low" | "medium" | "high" }>;
    reviewerReruns: {
      medium: { provider: string; model: string; tier: "medium"; estimatedCost: number; available: boolean };
      high: { provider: string; model: string; tier: "high"; estimatedCost: number; available: boolean };
    };
  };
  liveBoard?: (budgetCap: number) => Promise<void>;
  executionStatus?: string;
  executionProgress?: EditorialRunProgress;
  rerunReviewer?: (role: "strategist" | "skeptic" | "editor", budgetCap: number, tier: "medium" | "high") => Promise<void>;
  finalReview: (format: "linkedin" | "canonical" | "linkedin_companion") => Promise<void>;
  setRecommendationDisposition: (recommendation: string, disposition: "resolved" | "revised" | "superseded" | "still_open") => Promise<void>;
  setEscalationOutcome?: (modelCallId: string, outcome: { outputAccepted?: boolean; influencedFinalDraft?: boolean; materiallyImproved?: boolean }) => Promise<void>;
  draft: string;
  setDraft: (value: string) => void;
  saveDraft: () => Promise<void>;
  publish: (
    event: FormEvent<HTMLFormElement>,
    format: "linkedin" | "canonical" | "linkedin_companion",
    platform: "linkedin" | "medium" | "substack",
    output: { id: string; body: string; version: number },
  ) => Promise<void>;
  request: (body: unknown) => Promise<Detail>;
  showDevelopment?: boolean;
  showBoard?: boolean;
  showDraft?: boolean;
  showPublish?: boolean;
  showProvenance?: boolean;
  compactCapture?: boolean;
  showPriority?: boolean;
  reviewHref?: string;
  voiceChecks?: Partial<Record<"linkedin" | "canonical" | "linkedin_companion", VoiceCheckResult>>;
  checkVoice?: (format: "linkedin" | "canonical" | "linkedin_companion") => Promise<void>;
  createVisual?: () => Promise<void>;
  createLinkedinCompanion?: () => Promise<void>;
  companionDraft?: string;
  setCompanionDraft?: (value: string) => void;
  saveLinkedinCompanion?: () => Promise<void>;
  draftDirty?: boolean;
  onDraftChange?: (value: string) => void;
  companionDirty?: boolean;
  onCompanionChange?: (value: string) => void;
}) {
  const toggleTheme = (id: string) =>
    setSelected({
      ...idea,
      themes: idea.themes.some((theme) => theme.id === id)
        ? idea.themes.filter((theme) => theme.id !== id)
        : [...idea.themes, themes.find((theme) => theme.id === id)!],
    });
  const [editingTitle, setEditingTitle] = useState(false);
  const [liveBudgetOverride, setLiveBudgetOverride] = useState<number>();
  const [confirmedHighTierRole, setConfirmedHighTierRole] = useState<string>();
  const liveBudget = liveBudgetOverride ?? livePreview?.budgetCap ?? 0.5;
  const reviewIncomplete = idea.editorialBrief?.runStatus === "partially_completed";
  const primaryPublished = Boolean(
    idea.draft && idea.publications.some((publication) => publication.draftVersionId === idea.draft!.id),
  );
  const companionPublished = Boolean(
    idea.linkedinCompanion && idea.publications.some((publication) => publication.draftVersionId === idea.linkedinCompanion!.id),
  );
  const hasPublishedOutput = idea.publications.length > 0;
  const liveRunDisabledReason = hasPublishedOutput
    ? "Editorial Board runs are locked after publication. Create a new revision to develop fresh content."
    : busy
      ? "The current Editorial Board run is still finishing."
    : !livePreview?.available
      ? "The configured provider or model route is unavailable."
      : !Number.isFinite(liveBudget) || liveBudget <= 0
        ? "Enter a valid run budget greater than $0."
        : liveBudget > livePreview.maximumBudgetCap
          ? `The run budget cannot exceed $${livePreview.maximumBudgetCap.toFixed(2)}.`
          : livePreview.estimatedCost > liveBudget
            ? `Raise the cap to at least the $${livePreview.estimatedCost.toFixed(4)} upper-bound reservation.`
            : undefined;
  const applyPolishSuggestion = (current: string, suggested: string) => {
    const start = draft.indexOf(current);
    if (start < 0) return;
    const nextDraft = `${draft.slice(0, start)}${suggested}${draft.slice(start + current.length)}`;
    setDraft(nextDraft);
    onDraftChange?.(nextDraft);
  };
  const draftReviewLabel = (
    checkStatus?: "pass" | "review" | "needs_revision",
    details: string[] = [],
  ) =>
    checkStatus === "pass"
      ? "Pass"
      : checkStatus === "needs_revision"
        ? "Needs revision"
        : checkStatus === "review"
          ? "Review"
          : details[0]?.startsWith("Keep")
            ? "Pass"
            : details[0]?.startsWith("Do one")
              ? "Review"
              : "Needs revision";
  const visibleStatus = showBoard && reviewIncomplete
    ? "Review incomplete"
    : showPublish && idea.status !== "published"
      ? "Final check"
      : statusLabels[idea.status];
  const visibleStatusClass = showBoard && reviewIncomplete
    ? "review-incomplete"
    : showPublish && idea.status !== "published"
      ? "final-check"
      : idea.status;
  const isDualOutputPlan = idea.publicationPlan === "medium_linkedin" || idea.publicationPlan === "substack_linkedin";
  const primaryFormat: "linkedin" | "canonical" =
    idea.publicationPlan?.startsWith("medium") || idea.publicationPlan?.startsWith("substack")
      ? "canonical"
      : "linkedin";
  const primaryPlatform: "linkedin" | "medium" | "substack" =
    primaryFormat === "linkedin"
      ? "linkedin"
      : idea.publicationPlan?.startsWith("substack")
        ? "substack"
        : "medium";
  const canonicalArticlePublished = Boolean(
    idea.canonicalDraft && idea.publications.some((publication) => publication.draftVersionId === idea.canonicalDraft!.id),
  );
  const isCurrentVoiceCheck = (check: VoiceCheckResult | undefined, draftId?: string) =>
    Boolean(check && draftId && check.draftVersionId === draftId);
  const outputsReadyForFinalize = idea.draft && !draftDirty && (
    !isDualOutputPlan || Boolean(idea.linkedinCompanion && !idea.linkedinCompanion.stale && !companionDirty)
  );
  const renderFinalizeOutput = (
    label: string,
    format: "linkedin" | "canonical" | "linkedin_companion",
    platform: "linkedin" | "medium" | "substack",
    output: { id: string; body: string; version: number },
    sourceNote?: string,
  ) => {
    const voiceCheck = voiceChecks?.[format];
    const currentVoiceCheck = isCurrentVoiceCheck(voiceCheck, output.id);
    const publication = idea.publications.find((item) => item.draftVersionId === output.id);
    const requiresCurrentCompanion = format === "canonical" && isDualOutputPlan && (
      !idea.linkedinCompanion || idea.linkedinCompanion.stale
    );
    const requiresCanonicalPublication = format === "linkedin_companion" && isDualOutputPlan && !canonicalArticlePublished;
    return (
      <article className="finalize-output" key={output.id}>
        <div className="finalize-output-heading">
          <div>
            <p className="eyebrow">{label.toUpperCase()} · VERSION {output.version}</p>
            <h3>{idea.title}</h3>
            {sourceNote && <p>{sourceNote}</p>}
          </div>
          {publication && <span className="status published">Published</span>}
        </div>
        <div className="publication-draft-preview"><p>{output.body}</p></div>
        {publication ? (
          <p className="published-output-record">
            Published {new Date(publication.publishedAt).toLocaleDateString()}{publication.url ? ` · ${publication.url}` : ""}
          </p>
        ) : (
          <div className="finalize-actions">
            <section className="voice-check">
              <p className="eyebrow">FINAL HUMAN-VOICE CHECK</p>
              <div>
                <div>
                  <h4>Check this exact version before publishing.</h4>
                  <p>It flags common AI-like patterns for your judgment. A low result does not require another revision.</p>
                </div>
                <button disabled={busy} onClick={() => void checkVoice?.(format)}>Check final voice</button>
              </div>
              {currentVoiceCheck && (
                <div className={`voice-result ${voiceCheck?.label}`}>
                  <strong>{voiceCheck!.riskPercent}% AI-pattern risk · {voiceCheck!.label}{voiceCheck!.label === "low" ? " · no revision required" : " · review before publishing"}</strong>
                  {voiceCheck!.findings.length ? (
                    <ul>{voiceCheck!.findings.map((finding) => <li key={finding.id}><b>{finding.message}</b> {finding.suggestion}</li>)}</ul>
                  ) : <p>No common AI-like patterns were found in this version.</p>}
                  <small>{voiceCheck!.disclaimer}</small>
                </div>
              )}
            </section>
            <form className="publish" onSubmit={(event) => void publish(event, format, platform, output)}>
              <p className="eyebrow">PUBLICATION RECORD</p>
              <h4>Record this {platform === "linkedin" ? "LinkedIn post" : `${platform === "medium" ? "Medium" : "Substack"} article`} when it is live.</h4>
              <p className="publication-platform">Platform: {platform === "linkedin" ? "LinkedIn" : platform === "medium" ? "Medium" : "Substack"}</p>
              {requiresCurrentCompanion && <p className="stale-output">Create a current LinkedIn companion in Write before recording this article publication.</p>}
              {requiresCanonicalPublication && <p className="stale-output">Record the exact {idea.publicationPlan?.startsWith("substack") ? "Substack" : "Medium"} article publication first. The LinkedIn companion remains editable and can be published after that record is saved.</p>}
              <label>Publication URL <input name="url" type="url" placeholder="https://… (optional)" /></label>
              <label>Published date <input name="publishedAt" type="datetime-local" /></label>
              <button disabled={busy || !currentVoiceCheck || requiresCurrentCompanion || requiresCanonicalPublication} type="submit">Mark this version as published</button>
            </form>
          </div>
        )}
      </article>
    );
  };
  return (
    <div className="detail">
      <div className="detail-top">
        <div>
          <span className={`status ${visibleStatusClass}`}>
            {visibleStatus}
          </span>
          {editingTitle ? (
            <div className="title-editor">
              <textarea
                className="title-input"
                rows={2}
                value={idea.title}
                disabled={hasPublishedOutput}
                onChange={(event) =>
                  setSelected({ ...idea, title: event.target.value })
                }
                aria-label="Working title"
                maxLength={300}
              />
              <div>
                <button
                  disabled={busy || hasPublishedOutput}
                  onClick={() =>
                    void request({ title: idea.title }).then(() =>
                      setEditingTitle(false),
                    )
                  }
                >
                  Save title
                </button>
                <button
                  className="quiet-button"
                  disabled={busy}
                  onClick={() => setEditingTitle(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="title-display">
              <h2>{idea.title}</h2>
              <button
                className="title-edit-button"
                disabled={hasPublishedOutput}
                onClick={() => setEditingTitle(true)}
              >
                Edit title
              </button>
            </div>
          )}
        </div>
        {showPriority && (
          <div className="priority">
            <span>Move in queue</span>
            <button
              disabled={busy || hasPublishedOutput}
              aria-label="Move idea up in queue"
              title="Move up in queue"
              onClick={() => void request({ action: "move_up" })}
            >
              ↑
            </button>
            <button
              disabled={busy || hasPublishedOutput}
              aria-label="Move idea down in queue"
              title="Move down in queue"
              onClick={() => void request({ action: "move_down" })}
            >
              ↓
            </button>
          </div>
        )}
      </div>
      {compactCapture ? (
        <details className="original original-collapsed">
          <summary>View original idea</summary>
          <p>{idea.rawNotes}</p>
        </details>
      ) : (
        <article className="original">
          <p className="eyebrow">ORIGINAL CAPTURE</p>
          <p>{idea.rawNotes}</p>
        </article>
      )}
      {showDevelopment && idea.status !== "published" && idea.status !== "parked" && (
        <div className="lifecycle-actions">
          {idea.status === "inbox" && (
            <button
              disabled={busy}
              className="primary-wide"
              onClick={() => void startDeveloping()}
            >
              Develop this idea →
            </button>
          )}
          <button
            className="park-idea"
            disabled={busy}
            onClick={() => void request({ status: "parked" })}
          >
            Park this idea
          </button>
        </div>
      )}
      {showDevelopment && idea.status !== "published" && deleteIdea && (
        <button className="quiet-button delete-idea" disabled={busy} onClick={() => void deleteIdea()}>
          Delete this idea
        </button>
      )}
      {showDevelopment &&
        ["developing", "ready_to_review", "drafted"].includes(idea.status) && (
          <form className="development" onSubmit={saveDetails}>
            <p className="eyebrow">DEVELOPMENT</p>
            <label>
              Publication plan
              <select
                value={idea.publicationPlan ?? "linkedin"}
                onChange={(event) =>
                  setSelected({ ...idea, publicationPlan: event.target.value })
                }
              >
                {plans.map((plan) => (
                  <option key={plan.value} value={plan.value}>
                    {plan.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Theme(s)
              <details className="theme-dropdown">
                <summary>
                  {idea.themes.length
                    ? `${idea.themes.length} theme${idea.themes.length === 1 ? "" : "s"} selected`
                    : "No theme selected"}
                </summary>
                <div>
                  {themes.map((theme) => (
                    <label key={theme.id}>
                      <input
                        type="checkbox"
                        checked={idea.themes.some(
                          (selectedTheme) => theme.id === selectedTheme.id,
                        )}
                        onChange={() => toggleTheme(theme.id)}
                      />
                      {theme.name}
                    </label>
                  ))}
                </div>
              </details>
            </label>
            <label>
              Add what you know
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Notes, a source link, research you found, an example, or an early draft."
                maxLength={20_000}
              />
            </label>
            <button disabled={busy} type="submit">
              Save development notes
            </button>
          </form>
        )}
      {showDevelopment && idea.status === "developing" && (
        <section className="fast-draft-path">
          <div>
            <p className="eyebrow">READY WHEN YOU ARE</p>
            <h3>Use this idea, your notes, and the BOK to prepare the editorial review.</h3>
            <p>
              You do not need to answer more questions first. The next screen
              shows the assigned live model and cost cap before any paid run.
            </p>
          </div>
          <button disabled={busy} onClick={() => void createGroundedDraft()}>
            Continue to editorial review →
          </button>
        </section>
      )}
      {showDevelopment && idea.status === "developing" && idea.questions.length > 0 && (
        <details className="questions optional-questions">
          <summary>Optional questions, only if they help</summary>
          <p>Answer any that would materially improve your point, then continue.</p>
          {idea.questions.map((question) => (
            <label key={question}>
              {question}
              <textarea
                value={answers[question] ?? ""}
                onChange={(event) =>
                  setAnswers({ ...answers, [question]: event.target.value })
                }
                maxLength={5_000}
              />
            </label>
          ))}
          <div>
            <button
              disabled={busy}
              onClick={() => void finishDevelopment(false)}
            >
              Continue with these answers
            </button>
          </div>
        </details>
      )}
      {showDevelopment && idea.status === "parked" && (
        <section className="parked-note">
          <p>This idea is parked. Return it to Inbox when you are ready to pick it up again.</p>
          <button disabled={busy} onClick={() => void request({ status: "inbox" })}>
            Return to Inbox
          </button>
        </section>
      )}
      {reviewHref && ["ready_to_review", "drafted"].includes(idea.status) && (
        <Link className="review-link" href={reviewHref}>
          Open Editorial Board →
        </Link>
      )}
      {showBoard && livePreview && liveBoard && (
        <details
          className="live-board-cta"
          open={!idea.editorialBrief || reviewIncomplete || Boolean(executionStatus)}
        >
          <summary>
            <div>
              <p className="eyebrow">EDITORIAL BOARD RUN</p>
              <h3>
                {reviewIncomplete
                  ? "Retry the complete Editorial Board"
                  : idea.editorialBrief
                    ? "Run the Editorial Board again"
                    : "Run the Editorial Board"}
              </h3>
              <p>
                Upper-bound reservation ${livePreview.estimatedCost.toFixed(4)} · cap ${liveBudget.toFixed(2)} · {livePreview.planned[0]?.model}
              </p>
            </div>
            <span>{idea.editorialBrief && !reviewIncomplete ? "Run again" : "Review setup"}</span>
          </summary>
          <div className="live-board-controls">
            {!livePreview.available && (
              <p className="warning">
                One or more planned provider routes are not configured in the local server environment. Add the required key and model IDs, then restart the app.
              </p>
            )}
            <div className="run-actions">
              <label>
                Run budget cap (USD)
                <input
                  aria-label="Live run budget cap"
                  type="number"
                  min="0.01"
                  max={livePreview.maximumBudgetCap}
                  step="0.01"
                  value={liveBudget}
                  onChange={(event) => setLiveBudgetOverride(Number(event.target.value))}
                />
              </label>
              <button disabled={Boolean(liveRunDisabledReason)} onClick={() => void liveBoard(liveBudget)}>
                {reviewIncomplete
                  ? "Retry complete review"
                  : idea.editorialBrief
                    ? "Run Editorial Board again"
                    : "Run live editorial review"}
              </button>
            </div>
            {liveRunDisabledReason && (
              <p className="run-disabled-reason"><strong>Live provider run only:</strong> {liveRunDisabledReason}</p>
            )}
            {executionStatus && (
              <details className="editorial-progress" open>
                <summary>{executionStatus}</summary>
                <p>These are persisted workflow events, not the models’ private reasoning.</p>
                <ol className="run-stage-list">
                  {(executionProgress?.stages ?? [
                    { id: "context", label: "Prepare bounded idea and BOK context", status: "running" },
                    { id: "strategist", label: "Strategist review", status: "waiting" },
                    { id: "skeptic", label: "Skeptic review", status: "waiting" },
                    { id: "editor", label: "Editor review", status: "waiting" },
                    { id: "synthesizer", label: "Synthesize the editorial brief", status: "waiting" },
                    { id: "draft", label: "Create the voice-aligned working draft", status: "waiting" },
                    { id: "provenance", label: "Save provenance, usage, latency, and cost", status: "waiting" },
                  ]).map((stage) => (
                    <li key={stage.id} className={stage.status}>
                      <span aria-hidden="true">
                        {stage.status === "completed" ? "✓" : stage.status === "failed" ? "!" : stage.status === "running" ? "●" : "○"}
                      </span>
                      <strong>{stage.label}</strong>
                      <small>{stage.status}</small>
                    </li>
                  ))}
                </ol>
              </details>
            )}
            <details className="advanced-run-settings">
              <summary>Advanced run settings</summary>
              <p>{livePreview.pricingAssumption}</p>
              <ul className="model-plan">
                {livePreview.planned.map((assignment) => (
                  <li key={assignment.role}>{assignment.role.replace("_", " ")} · {assignment.tier} · {assignment.provider} / {assignment.model}</li>
                ))}
              </ul>
              <div className="deterministic-test-action">
                <p>Free local test · $0.00 · no provider call. It does not use or validate the live-run budget cap.</p>
                <button disabled={busy || hasPublishedOutput} onClick={() => void board()}>
                  Run free deterministic editorial test
                </button>
              </div>
            </details>
          </div>
        </details>
      )}
      {showBoard && idea.editorialBrief && (
        <section className="brief">
          <div className="brief-heading">
            <div>
              <p className="eyebrow">EDITORIAL BRIEF</p>
              <p className="brief-run-label">
                {idea.editorialBrief.executionMode === "live" ? "Live provider run" : idea.editorialBrief.executionMode === "grounded_test" ? "Grounded deterministic test run" : "Simulated local output"}
              </p>
            </div>
            <span className={reviewIncomplete ? "brief-state incomplete" : "brief-state complete"}>
              {reviewIncomplete ? "Review incomplete" : "Review complete"}
            </span>
          </div>
          {reviewIncomplete && (
            <p className="review-recovery-note">
              This historical run did not produce a complete Board review. Retry the complete Board above before relying on its draft.
            </p>
          )}
          <h3>{idea.editorialBrief.thesis}</h3>
          <p className="brief-intro">
            This is a short edit guide, not a second assignment. Use it to decide what to preserve, qualify, or improve in the working draft.
          </p>
          <dl className="brief-signals">
            <div>
              <dt>Keep this</dt>
              <dd>{idea.editorialBrief.strongest}</dd>
            </div>
            <div>
              <dt>Clarify this</dt>
              <dd>{idea.editorialBrief.unclear}</dd>
            </div>
            <div>
              <dt>Acknowledge this</dt>
              <dd>{idea.editorialBrief.counterargument}</dd>
            </div>
            <div>
              <dt>Evidence decision</dt>
              <dd>{idea.editorialBrief.evidenceNeeded}</dd>
            </div>
          </dl>
          <section className="brief-recommendations">
            <p className="eyebrow">SUGGESTED CHANGES FOR THIS DRAFT</p>
            <p>Apply the changes that strengthen your point. They are recommendations, not publication requirements.</p>
            <ul>
              {idea.editorialBrief.recommendedChanges.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          {!reviewIncomplete && (
            <section className="brief-next-action">
              <p className="eyebrow">YOUR NEXT ACTION</p>
              <p>Open the working draft and use the suggested changes as a focused editing guide.</p>
              <Link className="stage-primary-link" href={`/ideas/${idea.id}/draft`}>
                Continue to Write →
              </Link>
              <details>
                <summary>View the Board’s full next-step note</summary>
                <p>{idea.editorialBrief.nextStep}</p>
              </details>
            </section>
          )}
          <details className="agent-review-details">
            <summary>Why the Board suggested this</summary>
            <p className="agent-review-explainer">
              Optional supporting detail. The concise guide above is the action to take; these reviews show the reasoning behind it.
            </p>
            {idea.editorialBrief.reviews.map((review) => (
              <article key={review.role}>
                <b>
                  {review.role} · {review.status === "failed" ? "failed" : `${Math.round(review.confidence * 100)}%`}
                </b>
                <p>{review.summary}</p>
                {review.details.map((item) => (
                  <p key={item}>• {item}</p>
                ))}
                {livePreview?.available && rerunReviewer && ["strategist", "skeptic", "editor"].includes(review.role) && (
                  <details className="reviewer-rerun-menu">
                    <summary>Need another opinion from this reviewer?</summary>
                    <p>Optional. Use this only when you want a fresh, stronger review of one role.</p>
                    <button
                      className="reviewer-rerun"
                      disabled={busy || hasPublishedOutput || !livePreview.reviewerReruns.medium.available}
                      onClick={() => void rerunReviewer(review.role as "strategist" | "skeptic" | "editor", liveBudget, "medium")}
                    >
                      Rerun {review.role} · {livePreview.reviewerReruns.medium.model} · est. ${livePreview.reviewerReruns.medium.estimatedCost.toFixed(4)}
                    </button>
                    <label className="high-tier-confirmation">
                      <input
                        type="checkbox"
                        checked={confirmedHighTierRole === review.role}
                        disabled={busy || hasPublishedOutput}
                        onChange={(event) => setConfirmedHighTierRole(event.target.checked ? review.role : undefined)}
                      />
                      I explicitly want a higher-cost review of this one role.
                    </label>
                    <button
                      className="reviewer-rerun quiet-button"
                      disabled={busy || hasPublishedOutput || !livePreview.reviewerReruns.high.available || confirmedHighTierRole !== review.role}
                      onClick={() => void rerunReviewer(review.role as "strategist" | "skeptic" | "editor", liveBudget, "high")}
                    >
                      High-tier rerun · {livePreview.reviewerReruns.high.model} · est. ${livePreview.reviewerReruns.high.estimatedCost.toFixed(4)}
                    </button>
                  </details>
                )}
              </article>
            ))}
          </details>
          {idea.escalations.length > 0 && setEscalationOutcome && (
            <details className="escalation-outcomes">
              <summary>Compare and assess reviewer escalations</summary>
              <p>These are your judgments about whether the stronger single-reviewer rerun added value. They never rerun the Board automatically.</p>
              {idea.escalations.map((escalation) => (
                <article key={escalation.modelCallId}>
                  <b>{escalation.role} · {escalation.tier ?? "escalated"} · {escalation.provider}/{escalation.model}</b>
                  <p><strong>Reason:</strong> {escalation.escalationReason}</p>
                  {escalation.lowerCost && <p><strong>Lower-cost comparison:</strong> {escalation.lowerCost.provider}/{escalation.lowerCost.model}{escalation.lowerCost.reviewSummary ? ` — ${escalation.lowerCost.reviewSummary}` : " — historical output was not linked for comparison."}</p>}
                  {escalation.reviewSummary && <p><strong>Escalated review:</strong> {escalation.reviewSummary}</p>}
                  <label>
                    Did you accept this reviewer output?
                    <select value={escalation.outputAccepted === undefined ? "" : String(escalation.outputAccepted)} disabled={busy || hasPublishedOutput} onChange={(event) => event.target.value && void setEscalationOutcome(escalation.modelCallId, { outputAccepted: event.target.value === "true" })}>
                      <option value="">Not recorded</option><option value="true">Accepted</option><option value="false">Not accepted</option>
                    </select>
                  </label>
                  <label>
                    Did it influence the final draft?
                    <select value={escalation.influencedFinalDraft === undefined ? "" : String(escalation.influencedFinalDraft)} disabled={busy || hasPublishedOutput} onChange={(event) => event.target.value && void setEscalationOutcome(escalation.modelCallId, { influencedFinalDraft: event.target.value === "true" })}>
                      <option value="">Not recorded</option><option value="true">Yes</option><option value="false">No</option>
                    </select>
                  </label>
                  <label>
                    Did the escalation materially improve the accepted output?
                    <select value={escalation.materiallyImproved === undefined ? "" : String(escalation.materiallyImproved)} disabled={busy || hasPublishedOutput} onChange={(event) => event.target.value && void setEscalationOutcome(escalation.modelCallId, { materiallyImproved: event.target.value === "true" })}>
                      <option value="">Not recorded</option><option value="true">Yes</option><option value="false">No</option>
                    </select>
                  </label>
                </article>
              ))}
            </details>
          )}
        </section>
      )}
      {showDraft && idea.editorialBrief && (
        <details className="draft-brief-reference">
          <summary>Editorial brief reference</summary>
          <p>{idea.editorialBrief.thesis}</p>
          <ul>
            {idea.editorialBrief.recommendedChanges.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </details>
      )}
      {(showDraft || showPublish) && idea.publicationIntegrityWarning && (
        <p className="stale-output">{idea.publicationIntegrityWarning}</p>
      )}
      {showDraft && reviewIncomplete && (
        <p className="review-recovery-note">
          This draft came from an incomplete historical Board run. Return to Editorial Board and complete the review before treating it as validated.
        </p>
      )}
      {showDraft && !idea.draft && (
        <section className="stage-empty-state">
          <h3>No working draft yet.</h3>
          <p>Run the Editorial Board first. A validated brief will create the working draft for this stage.</p>
          <Link className="stage-primary-link" href={`/ideas/${idea.id}/board`}>Open Editorial Board →</Link>
        </section>
      )}
      {showDraft && idea.draft && (
        <section className="draft-editor">
          <p className="eyebrow">
            {idea.draft.createdBy === "initial_drafter"
              ? idea.grounding?.draftVersionId === idea.draft.id
                ? "GROUNDED WORKING DRAFT"
                : "SIMULATED WORKING DRAFT"
              : "WORKING DRAFT"} · VERSION {idea.draft.version}
          </p>
          {idea.draft.createdBy === "initial_drafter" && idea.grounding?.draftVersionId === idea.draft.id && (
            <p className="grounded-note">
              {idea.grounding.executionMode === "live"
                ? "Live grounded output. The selected BOK passages, configured voice skill, provider, model, usage, and pricing assumption are recorded below."
                : "Grounded deterministic test output. The selected BOK passages and configured voice skill are recorded below; no paid model was called."}
            </p>
          )}
          {idea.draft.createdBy === "initial_drafter" && !idea.grounding && (
            <p className="simulation-note">
              This starter text is deterministic test content. BOK and kk-spoken-voice have not been applied.
            </p>
          )}
          <textarea
            value={draft}
            disabled={primaryPublished}
            onChange={(event) => {
              setDraft(event.target.value);
              onDraftChange?.(event.target.value);
            }}
            aria-label="Working draft"
            maxLength={80_000}
          />
          <div>
            <button disabled={busy || primaryPublished} onClick={() => void saveDraft()}>
              Save draft version
            </button>
            {primaryPublished && <p className="published-lock-note">This exact version is published and now read-only. Its text, reviews, and visual are retained as publication history.</p>}
          </div>
        </section>
      )}
      {showDraft && (idea.publicationPlan === "medium_linkedin" || idea.publicationPlan === "substack_linkedin") && idea.canonicalDraft && (
        <section className="publication-outputs">
          <p className="eyebrow">PUBLICATION OUTPUTS</p>
          <h3>Article first, then its LinkedIn companion.</h3>
          <p className="publication-output-intro">The {idea.publicationPlan.startsWith("medium") ? "Medium" : "Substack"} article is version {idea.canonicalDraft.version}. Create the LinkedIn version when this saved article is ready to be its source.</p>
          {!idea.linkedinCompanion || idea.linkedinCompanion.stale ? (
            <button disabled={busy || draftDirty || primaryPublished} onClick={() => void createLinkedinCompanion?.()}>
              {idea.linkedinCompanion
                ? `Create a replacement LinkedIn version from Article v${idea.canonicalDraft.version}`
                : `Create LinkedIn version from Article v${idea.canonicalDraft.version}`}
            </button>
          ) : (
            <article className="companion-ready">
              <div className="companion-heading">
                <div>
                  <p className="eyebrow">LINKEDIN COMPANION · VERSION {idea.linkedinCompanion.version}</p>
                  <h4>Shape the short post in its own voice.</h4>
                  <p>Based on article version {idea.linkedinCompanion.sourceCanonicalVersion}. Its edits and review stay separate from the article.</p>
                </div>
                <span className={companionDirty ? "output-state stale" : "output-state"}>
                  {companionDirty ? "Unsaved changes" : `Saved as version ${idea.linkedinCompanion.version}`}
                </span>
              </div>
              <label>
                <span>LinkedIn post</span>
                <textarea className="companion-editor" aria-label="LinkedIn companion draft" disabled={companionPublished} value={companionDraft ?? idea.linkedinCompanion.body} onChange={(event) => {
                  setCompanionDraft?.(event.target.value);
                  onCompanionChange?.(event.target.value);
                }} maxLength={80_000} />
              </label>
              <div className="companion-actions">
                <button disabled={busy || companionPublished} onClick={() => void saveLinkedinCompanion?.()}>Save LinkedIn version</button>
                <p>Save when you complete a meaningful edit. Reviews and final checks apply only to saved versions.</p>
                {companionPublished && <p className="published-lock-note">This exact LinkedIn version is published and now read-only.</p>}
              </div>
            </article>
          )}
          {idea.linkedinCompanion?.stale && <p className="stale-output">The LinkedIn companion is stale because article version {idea.canonicalDraft.version} changed. Create a replacement when you are ready.</p>}
        </section>
      )}
      {showDraft && idea.draft && (
        <section className="draft-review">
          <p className="eyebrow">REVIEW THIS DRAFT · VERSION {idea.draft.version}</p>
          <div className="draft-review-heading">
            <div>
              <h3>One focused review before you publish.</h3>
              <p>
                The latest memo stays connected to this exact draft version.
              </p>
            </div>
            <button disabled={busy || draftDirty || primaryPublished} onClick={() => void finalReview(primaryFormat)}>
              Run draft review
            </button>
          </div>
          {draftDirty && (
            <p className="stale-review-notice">
              Unsaved edits are not covered by the current draft review or voice check. Save this output, then review it when useful.
            </p>
          )}
          {idea.finalReview && (
            <details className={`final-review-result ${idea.finalReview.readiness}${draftDirty ? " stale" : ""}`}>
              <summary>
                {draftDirty
                  ? "Previous review · draft has unsaved changes"
                  : idea.finalReview.readiness === "ready"
                    ? "Ready for your final judgment"
                    : "Revise before publishing"}
              </summary>
              <p>{idea.finalReview.summary}</p>
              <div className="review-columns">
                <div>
                  <b>Original recommendations</b>
                  <ul>
                    {idea.finalReview.recommendationStatuses.map((item) => (
                      <li key={item.recommendation}>
                        {item.recommendation}
                        <small className="recommendation-disposition">{item.disposition?.replace("_", " ") ?? "not yet recorded"}</small>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <b>Addressed</b>
                  <ul>
                    {idea.finalReview.addressed.length ? (
                      idea.finalReview.addressed.map((item) => (
                        <li key={item}>{item}</li>
                      ))
                    ) : (
                      <li>None confirmed yet.</li>
                    )}
                  </ul>
                </div>
                <div>
                  <b>Still open</b>
                  <ul>
                    {idea.finalReview.remaining.length ? (
                      idea.finalReview.remaining.map((item) => (
                        <li key={item}>{item}</li>
                      ))
                    ) : (
                      <li>No open editorial items identified.</li>
                    )}
                  </ul>
                </div>
              </div>
              <p>
                <strong>Next step:</strong> {idea.finalReview.nextStep}
              </p>
              {idea.editorialBrief && idea.finalReview.recommendationStatuses.length > 0 && (
                <details className="recommendation-decisions">
                  <summary>Record your decision on the original recommendations</summary>
                  <p>This is optional. It records your judgment; it does not claim the checklist inferred what you changed.</p>
                  {idea.finalReview.recommendationStatuses.map((item) => (
                    <label key={item.recommendation}>
                      <span>{item.recommendation}</span>
                      <select
                        value={item.disposition ?? ""}
                        disabled={busy || hasPublishedOutput}
                        onChange={(event) => {
                          if (event.target.value) void setRecommendationDisposition(item.recommendation, event.target.value as "resolved" | "revised" | "superseded" | "still_open");
                        }}
                      >
                        <option value="">Not yet recorded</option>
                        <option value="resolved">Resolved</option>
                        <option value="revised">Revised</option>
                        <option value="superseded">Superseded</option>
                        <option value="still_open">Still open</option>
                      </select>
                    </label>
                  ))}
                </details>
              )}
              {idea.finalReview.readiness === "ready" && Boolean(idea.finalReview.polishSuggestions?.length) && (
                <div className="polish-suggestions">
                  <div>
                    <b>Optional final polish</b>
                    <p>These are not publication blockers. Apply only the changes that still sound like you.</p>
                  </div>
                  {idea.finalReview.polishSuggestions!.map((suggestion) => (
                    <article key={suggestion.id}>
                      <div className="polish-comparison">
                        <p><span>Current</span>{suggestion.current}</p>
                        <p><span>Suggested</span>{suggestion.suggested}</p>
                      </div>
                      <p className="polish-reason">{suggestion.reason}</p>
                      <button
                        type="button"
                        disabled={busy || primaryPublished || !draft.includes(suggestion.current)}
                        onClick={() => applyPolishSuggestion(suggestion.current, suggestion.suggested)}
                      >
                        Apply this edit
                      </button>
                    </article>
                  ))}
                </div>
              )}
              <details>
                <summary>View this review’s checklist details</summary>
                <p className="local-checklist-explainer">
                  This is a local structural checklist, not a second live-model score. Pass means no change was identified; Review is optional judgment; Needs revision identifies a specific open item.
                </p>
                {idea.finalReview.reviews.map((review) => (
                  <article key={review.role}>
                    <b>
                      {review.role} · {review.status === "failed" ? "failed" : draftReviewLabel(review.checkStatus, review.details)}
                    </b>
                    <p>{review.summary}</p>
                    {review.details.map((item) => (
                      <p key={item}>• {item}</p>
                    ))}
                  </article>
                ))}
              </details>
            </details>
          )}
        </section>
      )}
      {showDraft && isDualOutputPlan && idea.linkedinCompanion && !idea.linkedinCompanion.stale && (
        <section className="draft-review companion-draft-review">
          <p className="eyebrow">REVIEW LINKEDIN VERSION · VERSION {idea.linkedinCompanion.version}</p>
          <div className="draft-review-heading">
            <div>
              <h3>Check the companion as its own post.</h3>
              <p>Its review stays attached to this exact LinkedIn version.</p>
            </div>
            <button disabled={busy || companionDirty || companionPublished} onClick={() => void finalReview("linkedin_companion")}>
              Run LinkedIn review
            </button>
          </div>
          {companionDirty && (
            <p className="stale-review-notice">
              Unsaved LinkedIn edits are not covered by its review or voice check. Save this version first.
            </p>
          )}
          {idea.linkedinCompanionFinalReview && (
            <details className={`final-review-result ${idea.linkedinCompanionFinalReview.readiness}${companionDirty ? " stale" : ""}`}>
              <summary>
                {companionDirty
                  ? "Previous LinkedIn review · draft has unsaved changes"
                  : idea.linkedinCompanionFinalReview.readiness === "ready"
                    ? "LinkedIn version ready for final judgment"
                    : "Revise LinkedIn version before finalizing"}
              </summary>
              <p>{idea.linkedinCompanionFinalReview.summary}</p>
              {idea.linkedinCompanionFinalReview.remaining.length > 0 && (
                <div>
                  <b>Still open</b>
                  <ul>{idea.linkedinCompanionFinalReview.remaining.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
              )}
              {idea.linkedinCompanionFinalReview.polishSuggestions?.length ? (
                <details>
                  <summary>Optional final polish</summary>
                  {idea.linkedinCompanionFinalReview.polishSuggestions.map((suggestion) => (
                    <article key={suggestion.id}>
                      <p><b>Consider:</b> {suggestion.suggested}</p>
                      <p>{suggestion.reason}</p>
                    </article>
                  ))}
                </details>
              ) : null}
              <details>
                <summary>View this review’s checklist details</summary>
                {idea.linkedinCompanionFinalReview.reviews.map((review) => (
                  <article key={review.role}>
                    <b>{review.role} · {draftReviewLabel(review.checkStatus, review.details)}</b>
                    <p>{review.summary}</p>
                    {review.details.map((item) => <p key={item}>• {item}</p>)}
                  </article>
                ))}
              </details>
            </details>
          )}
        </section>
      )}
      {showDraft && idea.draft && createVisual && (
        <details className="visual-companion" open={Boolean(idea.visualCompanion)}>
          <summary>
            <span>Visual companion</span>
            <small>Optional framework graphic</small>
          </summary>
          <div className="visual-companion-content">
            {!idea.visualCompanion ? (
              <>
                <p>Create a calm, memorable framework visual for this exact saved article. It does not change the post text.</p>
                <button disabled={busy || draftDirty || primaryPublished} onClick={() => void createVisual()}>
                  Create visual companion
                </button>
              </>
            ) : (
              <>
                <VisualFlow visual={idea.visualCompanion} />
                <button className="refresh-visual" disabled={busy || draftDirty || primaryPublished} onClick={() => void createVisual()}>
                  Refresh saved SVG
                </button>
              </>
            )}
          </div>
        </details>
      )}
      {showDraft && (() => {
        const priorReviews = idea.reviewHistory.filter(
          (entry) =>
            entry.runId !== idea.finalReview?.runId &&
            entry.runId !== idea.linkedinCompanionFinalReview?.runId &&
            entry.runId !== idea.editorialBrief?.runId,
        );
        return priorReviews.length > 0 ? (
          <details className="review-history">
            <summary>
              Prior review history · {priorReviews.length} saved{" "}
              {priorReviews.length === 1 ? "memo" : "memos"}
            </summary>
            <p>Each memo is permanently tied to the draft version it reviewed.</p>
            {priorReviews.map((entry) => (
              <details key={entry.runId}>
                <summary>
                  {entry.reviewType === "editorial"
                    ? "Editorial Board"
                    : "Draft review"}{" "}
                  · draft version {entry.draftVersion}
                </summary>
                <p>{entry.summary}</p>
                {entry.reviews.map((review) => (
                  <article key={review.role}>
                    <b>
                      {review.role} · {review.status === "failed"
                        ? "failed"
                        : entry.reviewType === "final_draft"
                          ? draftReviewLabel(review.checkStatus, review.details)
                          : `${Math.round(review.confidence * 100)}%`}
                    </b>
                    <p>{review.summary}</p>
                    {review.details.map((item) => (
                      <p key={item}>• {item}</p>
                    ))}
                  </article>
                ))}
              </details>
            ))}
          </details>
        ) : null;
      })()}
      {showDraft && idea.draft && (
        outputsReadyForFinalize ? (
          <Link className="stage-primary-link" href={`/ideas/${idea.id}/publish`}>
            Continue to Finalize →
          </Link>
        ) : (
          <p className="stale-review-notice">
            Save the current output{isDualOutputPlan ? "s and refresh any stale LinkedIn companion" : ""} before finalizing.
          </p>
        )
      )}
      {showPublish && !idea.draft && (
        <section className="stage-empty-state">
          <h3>There is no saved draft to publish.</h3>
          <p>Create and save a draft before completing the final voice check.</p>
          <Link className="stage-primary-link" href={`/ideas/${idea.id}/draft`}>Open Write →</Link>
        </section>
      )}
      {showPublish && idea.draft && (
        <section className="finalize-panel">
          <div className="finalize-intro">
            <p className="eyebrow">FINALIZE</p>
            <h3>Preview the exact saved version, then record it when it is live.</h3>
            <p>To change the words, return to Write. A saved revision makes this output’s review and voice check outdated.</p>
            <Link className="quiet-button" href={`/ideas/${idea.id}/draft`}>Return to Write</Link>
          </div>
          {renderFinalizeOutput(
            primaryPlatform === "linkedin" ? "LinkedIn post" : `${primaryPlatform === "medium" ? "Medium" : "Substack"} article`,
            primaryFormat,
            primaryPlatform,
            idea.draft,
          )}
          {isDualOutputPlan && idea.linkedinCompanion && !idea.linkedinCompanion.stale && renderFinalizeOutput(
            "LinkedIn companion",
            "linkedin_companion",
            "linkedin",
            idea.linkedinCompanion,
            `Derived from article version ${idea.linkedinCompanion.sourceCanonicalVersion}.`,
          )}
          {isDualOutputPlan && (!idea.linkedinCompanion || idea.linkedinCompanion.stale) && (
            <p className="stale-output">The LinkedIn companion is not current. Return to Write to create a version from the current article.</p>
          )}
          {idea.visualCompanion && (
            <details className="visual-companion" open>
              <summary><span>Visual companion</span><small>Saved with this article version</small></summary>
              <div className="visual-companion-content"><VisualFlow visual={idea.visualCompanion} /></div>
            </details>
          )}
        </section>
      )}
      {showProvenance && idea.grounding && (
        <details className="bok-context">
          <summary>
            Grounded with {idea.grounding.sections.length} BOK passages · {idea.grounding.calls.length} recorded calls · est. ${idea.grounding.calls.reduce((total, call) => total + call.estimatedCost, 0).toFixed(4)}
          </summary>
          <p className="grounded-note">
            BOK version {idea.grounding.bok.version} · voice skill version {idea.grounding.voice.version} · {idea.grounding.executionMode === "live" ? "live provider run; per-call usage and pricing assumptions are recorded" : "local deterministic provider · $0.00"}
          </p>
          <p className="provenance-label">Selected BOK passages</p>
          {idea.grounding.sections.map((section) => (
            <article key={`${section.headingPath}-${section.sourceLocation}`}>
              <b>{section.rank}. {section.headingPath} · relevance {section.score.toFixed(2)}</b>
              <p>{short(section.text, 500)}</p>
            </article>
          ))}
          <details className="provenance-calls">
            <summary>Role and model assignments</summary>
            {idea.grounding.calls.map((call, index) => (
              <p key={`${call.role}-${index}`}>
                <b>{call.role}</b> · {call.provider}/{call.model} · {call.success ? "completed" : "failed"} · {call.totalTokens ?? "usage unavailable"} tokens · est. ${call.estimatedCost.toFixed(4)}{call.latencyMs !== undefined ? ` · ${call.latencyMs} ms` : ""}{call.retryCount > 0 ? ` · attempt ${call.retryCount + 1}` : ""}
              </p>
            ))}
          </details>
        </details>
      )}
      {showProvenance && !idea.grounding && idea.context.length > 0 && (
        <details className="bok-context">
          <summary>Potentially related BOK sections</summary>
          <p className="simulation-note">
            These are a local search preview only. The current simulated review did not use them.
          </p>
          {idea.context.map((section) => (
            <article key={`${section.headingPath}-${section.sourceLocation}`}>
              <b>{section.headingPath}</b>
              <p>{short(section.text, 500)}</p>
            </article>
          ))}
        </details>
      )}
    </div>
  );
}
