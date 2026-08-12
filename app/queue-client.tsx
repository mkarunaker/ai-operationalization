"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppNav } from "./app-nav";
import { VisualFlow } from "./visual-flow";
import type { EditorialRunProgress } from "@/editorial/run-progress";
import { boardRoleStageStatus, derivedShortCreationStageStatus, isBoardReviewIncomplete, primaryDraftCreationStageStatus } from "@/editorial/board-status";

export type Status =
  | "inbox"
  | "developing"
  | "ready_to_review"
  | "drafted"
  | "published"
  | "parked";
export type Theme = { id: string; name: string };
type VisualFormat = "short" | "article" | "derived_short";
type VisualTemplate = "flow" | "vertical_path" | "contrast" | "decision_fork";
type VisualCompanionView = {
  id: string;
  draftVersionId: string;
  visualBriefId?: string;
  type: "flow" | "maturity_path" | "contrast" | "decision_fork";
  colorScheme?: "violet" | "forest" | "copper";
  eyebrow: string;
  title: string;
  subtitle: string;
  steps: Array<{ title: string; detail: string }>;
  altText: string;
  caption: string;
  filePath: string;
  createdAt: string;
};
type VisualBriefView = {
  id: string;
  draftVersionId: string;
  outputFormat: VisualFormat;
  recommendation: "no_visual" | "visual";
  rationale: string;
  status: "recommended" | "approved" | "dismissed" | "rendered";
  template?: VisualTemplate;
  colorScheme: "violet" | "forest" | "copper";
  sourceDraftText: string;
  readerContract: { outputShape: "short" | "long" | "long_with_derived_short"; audienceProfile: "professional" | "executive" | "practitioner" | "general" };
  authorDirection: string;
  claims: string[];
  labels: string[];
  caption: string;
  altText: string;
  placement?: "lead" | "supporting";
  revisionNumber: number;
};

function savedVisualTemplate(
  visual?: VisualCompanionView,
  brief?: VisualBriefView,
): VisualTemplate | undefined {
  if (brief?.template) return brief.template;
  if (visual?.type === "decision_fork") return "decision_fork";
  if (visual?.type === "maturity_path") return "vertical_path";
  if (visual?.type === "flow") return "flow";
  if (visual?.type === "contrast") return "contrast";
  return undefined;
}

function visualTemplateLabel(template?: VisualTemplate) {
  if (template === "decision_fork") return "Decision fork";
  if (template === "contrast") return "Iceberg contrast";
  if (template === "vertical_path") return "Vertical path";
  if (template === "flow") return "Three-step flow";
  return "No supported diagram";
}

type VisualAction = {
  operation: "recommend" | "approve" | "render" | "start_revision" | "select_revision" | "dismiss";
  format: VisualFormat;
  placement?: "lead" | "supporting";
  template?: VisualTemplate;
  authorDirection?: string;
  briefId?: string;
};
export type Idea = {
  id: string;
  title: string;
  rawNotes: string;
  status: Status;
  priority: number;
  outputShape: "short" | "long" | "long_with_derived_short";
  createdAt: string;
  updatedAt: string;
  themes: Theme[];
  audienceProfileKey?: "professional" | "executive" | "practitioner" | "general";
  audienceNotes?: string;
  outputPreferences?: {
    longFormEnabled: boolean; longFormMinWords: number; longFormMaxWords: number;
    shortFormEnabled: boolean; shortFormMinWords: number; shortFormMaxWords: number;
    shortFormSource: "standalone" | "derived_from_long"; deliveryHint?: string;
  };
  runLedger: {
    attempts: number;
    totalTokens: number;
    estimatedCost: number;
  };
};
function outputPreferencesForShape(shape: Idea["outputShape"]): NonNullable<Idea["outputPreferences"]> {
  const longForm = shape !== "short";
  const shortForm = shape !== "long";
  return { longFormEnabled: longForm, longFormMinWords: 800, longFormMaxWords: 1100, shortFormEnabled: shortForm, shortFormMinWords: 180, shortFormMaxWords: 300, shortFormSource: longForm && shortForm ? "derived_from_long" : "standalone" };
}
export type Detail = Idea & {
  notes: Array<{ id: string; body: string; createdAt: string }>;
  research: Array<{
    id: string;
    mode: "provided" | "application";
    executionMode: "manual" | "application_brief";
    question: string;
    timeWindow?: string;
    evidenceSummary?: string;
    interpretation?: string;
    toolName?: string;
    estimatedCost: number;
    actualCost: number;
    injectionSignals: string[];
    createdAt: string;
    sources: Array<{ title: string; sourceUrl?: string; publishedAt?: string; excerpt?: string; label: string }>;
  }>;
  questions: string[];
  answers: Array<{ question: string; answer: string; choice: string }>;
  shortPost?: { id: string; body: string; version: number; createdBy: string };
  article?: { id: string; body: string; version: number; createdBy: string; approved: boolean };
  derivedShortPost?: { id: string; body: string; version: number; createdBy: string; stale: boolean; approved: boolean; sourceArticleVersion: number };
  context: Array<{ headingPath: string; sourceLocation: string; text: string }>;
  editorialBrief?: {
    runId: string;
    executionMode?: string;
    runStatus?: "completed" | "partially_completed" | "failed";
    generatedDraftVersionId?: string;
    generatedDerivedShortDraftVersionId?: string;
    runFailures: Array<{ role: string; summary: string; category?: "output_limit" | "reader_range_contract_failed" | "reader_prose_scaffolding_failed" | "execution_failure" }>;
    reviewerRecoveries: Array<{ role: "strategist" | "skeptic" | "editor"; runId: string; provider: string; model: string; tier?: string }>;
    attemptedRoles: string[];
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
  shortPostFinalReview?: {
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
    proofreadFindings: Array<{ id: string; category: "spelling" | "grammar" | "punctuation" | "clarity"; severity: "material" | "optional"; current: string; suggestion: string; rationale: string; disposition?: "accepted" | "dismissed" | "revised" | "still_open" }>;
    proofreadCompleted: boolean;
    proofreadStatus?: "completed" | "failed" | "not_run";
    proofreadFailure?: { category: "provider_failure" | "refusal" | "truncation" | "repair_exhausted" | "cap_rejected" | "execution_failure"; message: string };
  };
  articleFinalReview?: Detail["shortPostFinalReview"];
  derivedShortPostFinalReview?: Detail["shortPostFinalReview"];
  publicationIntegrityWarning?: string;
  publications: Array<{
    draftVersionId: string;
    draftFormat: "short" | "article" | "derived_short";
    channel: "linkedin" | "medium" | "substack";
    publishedAt: string;
    url?: string;
  }>;
  visualCompanion?: VisualCompanionView;
  supportingVisualCompanions: VisualCompanionView[];
  visualBrief?: VisualBriefView;
  visualBriefs: VisualBriefView[];
  visualCandidateBrief?: VisualBriefView;
  visualRevisionHistory: VisualBriefView[];
  derivedShortVisualCompanion?: VisualCompanionView;
  derivedShortSupportingVisualCompanions: VisualCompanionView[];
  derivedShortVisualBrief?: VisualBriefView;
  derivedShortVisualBriefs: VisualBriefView[];
  derivedShortVisualCandidateBrief?: VisualBriefView;
  derivedShortVisualRevisionHistory: VisualBriefView[];
  derivedShortRecovery?: {
    id: string;
    status: "completed" | "failed";
    kind: "refresh" | "retry" | "escalation";
    provider: string;
    model: string;
    tier?: string;
    estimatedCost: number;
    error?: string;
    escalationReason?: string;
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
    readerContract?: { outputShape: "short" | "long" | "long_with_derived_short"; audienceProfile: string; audienceNotes?: string; longForm?: { min: number; max: number }; shortForm?: { min: number; max: number; derived: boolean } };
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
const outputShapes = [
  { value: "short", label: "Short post" },
  { value: "long", label: "Article" },
  { value: "long_with_derived_short", label: "Article + derived short post" },
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
const localCost = (ledger: Idea["runLedger"]) =>
  ledger.estimatedCost > 0 ? `est. $${ledger.estimatedCost.toFixed(4)}` : "$0.00 local";

export function QueueClient() {
  const router = useRouter();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [capture, setCapture] = useState("");
  const [captureTitle, setCaptureTitle] = useState("");
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
        body: JSON.stringify({ rawNotes: capture, title: captureTitle || undefined, themeIds: captureThemes }),
      });
      const data = (await response.json()) as { idea?: Detail; error?: string };
      if (!response.ok || !data.idea)
        throw new Error(data.error ?? "Could not save the idea.");
      setCapture("");
      setCaptureTitle("");
      setCaptureThemes([]);
      router.push(`/ideas/${data.idea.id}`);
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
  async function deleteFromQueue(idea: Idea) {
    if (!window.confirm(`Delete “${idea.title}” and its local drafts, reviews, and notes? This cannot be undone.`)) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/ideas/${idea.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_idea" }),
      });
      const data = (await response.json()) as { deleted?: boolean; error?: string };
      if (!response.ok || !data.deleted)
        throw new Error(data.error ?? "The idea could not be deleted.");
      setIdeas((current) => current.filter((currentIdea) => currentIdea.id !== idea.id));
      setMessage(`Deleted “${idea.title}” from this local workspace.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The idea could not be deleted.");
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
          <label htmlFor="capture-title" className="capture-title-field">
            <strong>Working title <span>Optional</span></strong>
            <input
              id="capture-title"
              value={captureTitle}
              onChange={(event) => setCaptureTitle(event.target.value)}
              placeholder="Add one, or let the app suggest it"
              maxLength={300}
            />
          </label>
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
              <article className="idea-card" key={idea.id}>
                <Link className="idea-card-link" href={`/ideas/${idea.id}`}>
                <div>
                  <span className={`status ${idea.status}`}>
                    {statusLabels[idea.status]}
                  </span>
                  <h3>{idea.title}</h3>
                  <p>{short(idea.rawNotes)}</p>
                  <p className="card-ledger">
                    {idea.runLedger.attempts
                      ? `${idea.runLedger.attempts} model ${idea.runLedger.attempts === 1 ? "attempt" : "attempts"} · ${idea.runLedger.totalTokens.toLocaleString()} tokens · ${localCost(idea.runLedger)}`
                      : "No model attempts yet"}
                  </p>
                  <div className="card-meta">
                    {idea.themes.map((theme) => (
                      <span key={theme.id}>{theme.name}</span>
                    ))}
                  </div>
                </div>
                  <b aria-hidden="true">›</b>
              </Link>
                {idea.status !== "published" && (
                  <button
                    className="idea-delete"
                    type="button"
                    disabled={busy}
                    aria-label={`Delete ${idea.title}`}
                    onClick={() => void deleteFromQueue(idea)}
                  >
                    Delete
                  </button>
                )}
              </article>
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
  retryDerivedShort,
  retryInitialDrafter,
  executionStatus,
  executionProgress,
  rerunReviewer,
  finalReview,
  setReviewFindingDisposition,
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
  updateVisualBrief,
  derivedShortDraft,
  setDerivedShortDraft,
  saveDerivedShort,
  draftDirty = false,
  onDraftChange,
  derivedShortDirty = false,
  onDerivedShortChange,
  saveProvidedResearch,
  createApplicationResearchBrief,
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
    source: { boardReady: boolean; unavailableReason?: string };
    estimatedCost: number;
    planned: Array<{ role: string; provider: string; model: string; tier: "low" | "medium" | "high" }>;
    reviewerReruns: {
      medium: { provider: string; model: string; tier: "medium"; estimatedCost: number; available: boolean };
      high: { provider: string; model: string; tier: "high"; estimatedCost: number; available: boolean };
    };
    initialDrafterRecovery: { provider: string; model: string; tier: "low" | "medium" | "high"; estimatedCost: number; available: boolean; unavailableReason?: string };
    derivedShortRefresh: { provider: string; model: string; tier: "low" | "medium" | "high"; estimatedCost: number; available: boolean };
    derivedShortEscalation: { provider: string; model: string; tier: "low" | "medium" | "high"; estimatedCost: number; available: boolean };
    proofreader?: { provider: string; model: string; tier: "low" | "medium" | "high"; estimates: { short: number; article: number; derived_short: number }; available: boolean };
  };
  liveBoard?: (budgetCap: number) => Promise<void>;
  retryDerivedShort?: (budgetCap: number, mode: "refresh" | "retry" | "escalation") => Promise<void>;
  retryInitialDrafter?: (budgetCap: number) => Promise<void>;
  executionStatus?: string;
  executionProgress?: EditorialRunProgress;
  rerunReviewer?: (role: "strategist" | "skeptic" | "editor", budgetCap: number, tier: "medium" | "high") => Promise<void>;
  finalReview: (format: "short" | "article" | "derived_short") => Promise<void>;
  setReviewFindingDisposition?: (reviewRunId: string, findingId: string, disposition: "accepted" | "dismissed" | "revised" | "still_open") => Promise<void>;
  setRecommendationDisposition: (recommendation: string, disposition: "resolved" | "revised" | "superseded" | "still_open") => Promise<void>;
  setEscalationOutcome?: (modelCallId: string, outcome: { outputAccepted?: boolean; influencedFinalDraft?: boolean; materiallyImproved?: boolean }) => Promise<void>;
  draft: string;
  setDraft: (value: string) => void;
  saveDraft: () => Promise<void>;
  publish: (
    event: FormEvent<HTMLFormElement>,
    format: "short" | "article" | "derived_short",
    channel: "linkedin" | "medium" | "substack",
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
  voiceChecks?: Partial<Record<"short" | "article" | "derived_short", VoiceCheckResult>>;
  checkVoice?: (format: "short" | "article" | "derived_short") => Promise<void>;
  createVisual?: (action: VisualAction) => Promise<void>;
  updateVisualBrief?: (input: { briefId: string; claims: string[]; labels: string[]; caption: string; altText: string; authorDirection?: string; template: VisualTemplate; colorScheme?: "violet" | "forest" | "copper"; placement?: "lead" | "supporting" }) => Promise<void>;
  derivedShortDraft?: string;
  setDerivedShortDraft?: (value: string) => void;
  saveDerivedShort?: () => Promise<void>;
  draftDirty?: boolean;
  onDraftChange?: (value: string) => void;
  derivedShortDirty?: boolean;
  onDerivedShortChange?: (value: string) => void;
  saveProvidedResearch?: (input: { question: string; timeWindow?: string; evidenceSummary: string; interpretation?: string; sources: Array<{ title: string; sourceUrl?: string; publishedAt?: string; excerpt?: string; label: "fact" | "evidence" | "observation" | "pattern" | "opinion" | "hypothesis" | "recommended_default" }> }) => Promise<void>;
  createApplicationResearchBrief?: (input: { question: string; timeWindow: string }) => Promise<void>;
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
  const [researchMode, setResearchMode] = useState<"provided" | "application">("provided");
  const [researchQuestion, setResearchQuestion] = useState("");
  const [researchWindow, setResearchWindow] = useState("Last 30 days");
  const [researchEvidence, setResearchEvidence] = useState("");
  const [researchInterpretation, setResearchInterpretation] = useState("");
  const [researchSources, setResearchSources] = useState("");
  const [visualTemplate, setVisualTemplate] = useState<VisualTemplate | undefined>(() => savedVisualTemplate(idea.visualCompanion, idea.visualBrief));
  // A derived short output has its own brief and grammar. It must never borrow
  // the article selector merely because both outputs appear on one Write page.
  const [derivedVisualTemplate, setDerivedVisualTemplate] = useState<VisualTemplate | undefined>(() => savedVisualTemplate(idea.derivedShortVisualCompanion, idea.derivedShortVisualBrief));
  const [derivedVisualDirection, setDerivedVisualDirection] = useState("");
  const [visualClaim, setVisualClaim] = useState("");
  const [visualLabel, setVisualLabel] = useState("");
  const [visualCaption, setVisualCaption] = useState("");
  const [visualAltText, setVisualAltText] = useState("");
  const [visualDirection, setVisualDirection] = useState("");
  const [visualColorScheme, setVisualColorScheme] = useState<"violet" | "forest" | "copper">();
  const visualBriefEditor = (brief: VisualBriefView, selectedTemplate?: VisualTemplate) => {
    const template = selectedTemplate ?? brief.template ?? visualTemplate;
    return (
      <div className="visual-brief-editor">
        <label>What should this visual help the reader see?<textarea value={visualDirection} placeholder={brief.authorDirection || "For example: make the trade-off between speed and operating discipline clear."} onChange={(event) => setVisualDirection(event.target.value)} /></label>
        <label>Color treatment<select value={visualColorScheme ?? brief.colorScheme} onChange={(event) => setVisualColorScheme(event.target.value as "violet" | "forest" | "copper")}><option value="violet">Violet</option><option value="forest">Forest</option><option value="copper">Copper</option></select></label>
        <label>Claim from this exact saved output<textarea value={visualClaim} placeholder={brief.sourceDraftText.slice(0, 180) || "Enter an exact claim from the saved output"} onChange={(event) => setVisualClaim(event.target.value)} /></label>
        <label>Label<input value={visualLabel} placeholder="A concise phrase from that saved output" onChange={(event) => setVisualLabel(event.target.value)} /></label>
        <label>Caption<textarea value={visualCaption} placeholder={brief.caption} onChange={(event) => setVisualCaption(event.target.value)} /></label>
        <label>Alt text<textarea value={visualAltText} placeholder={brief.altText} onChange={(event) => setVisualAltText(event.target.value)} /></label>
        <button disabled={busy || !template} onClick={() => {
          if (!template) return;
          const claim = visualClaim.trim() || brief.claims[0] || brief.sourceDraftText.slice(0, 500);
          const label = visualLabel.trim() || brief.labels[0] || claim;
          void updateVisualBrief?.({ briefId: brief.id, claims: [claim], labels: [label], caption: visualCaption.trim() || brief.caption, altText: visualAltText.trim() || brief.altText, authorDirection: visualDirection.trim() || brief.authorDirection, template, colorScheme: visualColorScheme, placement: brief.placement });
        }}>Save visual brief edits</button>
      </div>
    );
  };
  const liveBudget = liveBudgetOverride ?? livePreview?.budgetCap ?? 0.5;
  const includesDerivedShort = idea.outputShape === "long_with_derived_short";
  const failedBoardRoles = idea.editorialBrief?.runFailures ?? [];
  const initialDrafterFailure = failedBoardRoles.find((failure) => failure.role === "initial_drafter");
  const initialDrafterFailureCategory = initialDrafterFailure?.category
    ?? (/output limit/i.test(initialDrafterFailure?.summary ?? "") ? "output_limit" : "execution_failure");
  const finalDrafterFailed = failedBoardRoles.some((failure) => failure.role === "final_drafter");
  const synthesizerFailed = failedBoardRoles.some((failure) => failure.role === "synthesizer");
  const initialDrafterFailed = failedBoardRoles.some((failure) => failure.role === "initial_drafter");
  // A scoped retry deliberately preserves the original failed model-call and
  // review record for provenance. Once it has created a current derived short
  // post for the exact article, that historical failure must not keep the
  // current workflow labelled incomplete after a reload.
  const derivedShortFailureRecovered = Boolean(
    includesDerivedShort
      && finalDrafterFailed
      && idea.derivedShortPost
      && !idea.derivedShortPost.stale
      && idea.derivedShortRecovery?.status === "completed",
  );
  // A derived-short recovery only resolves the Final Drafter output. It must
  // never turn an independently failed review/synthesis role into success.
  const reviewIncomplete = Boolean(idea.editorialBrief && isBoardReviewIncomplete({
    runStatus: idea.editorialBrief.runStatus,
    failures: failedBoardRoles,
    finalDrafterRecovered: derivedShortFailureRecovered,
    reviewerRecoveredRoles: idea.editorialBrief.reviewerRecoveries.map((recovery) => recovery.role),
  }));
  const primaryPublished = Boolean(
    (idea.shortPost ?? idea.article) && idea.publications.some((publication) => publication.draftVersionId === (idea.shortPost ?? idea.article)!.id),
  );
  const derivedShortPublished = Boolean(
    idea.derivedShortPost && idea.publications.some((publication) => publication.draftVersionId === idea.derivedShortPost!.id),
  );
  const hasPublishedOutput = idea.publications.length > 0;
  const liveRunDisabledReason = hasPublishedOutput
    ? "Editorial Board runs are locked after publication. Create a new revision to develop fresh content."
    : busy
      ? "The current Editorial Board run is still finishing."
    : !livePreview?.source.boardReady
      ? livePreview?.source.unavailableReason ?? "The Editorial Board source index is unavailable."
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
  const proofreaderDisclosure = (format: "short" | "article" | "derived_short") => {
    const proofreader = livePreview?.proofreader;
    if (!proofreader) return null;
    if (!proofreader.available) {
      return <p className="proofreader-disclosure">Editorial assessment + local deterministic proofread · $0.00 · no provider call</p>;
    }
    return <p className="proofreader-disclosure">Editorial assessment + {proofreader.model} proofread · upper-bound reservation est. ${proofreader.estimates[format].toFixed(4)}</p>;
  };
  const applyDerivedShortPolishSuggestion = (current: string, suggested: string) => {
    const activeDerivedShort = derivedShortDraft ?? idea.derivedShortPost?.body ?? "";
    const start = activeDerivedShort.indexOf(current);
    if (start < 0) return;
    const nextDraft = `${activeDerivedShort.slice(0, start)}${suggested}${activeDerivedShort.slice(start + current.length)}`;
    setDerivedShortDraft?.(nextDraft);
    onDerivedShortChange?.(nextDraft);
  };
  const derivedShortNextEdit = (item: string) => {
    if (/expand the middle/i.test(item))
      return "Add one short sentence after the opening that explains the practical consequence for the reader. Keep it specific to this post rather than repeating the full article framework.";
    if (/example|evidence|uncertainty|boundary/i.test(item))
      return "Add one concrete, clearly labelled example or state the boundary in plain language. Do not turn the derived short post into a list of unsupported claims.";
    return "Make this one change in the derived short post, save it as a new version, then rerun only its review.";
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
  const reviewStatusBadge = (
    checkStatus?: "pass" | "review" | "needs_revision",
    details: string[] = [],
  ) => {
    const label = draftReviewLabel(checkStatus, details);
    const state = label === "Pass" ? "pass" : label === "Review" ? "review" : "needs-revision";
    return <span className={`review-status-badge ${state}`}>{label}</span>;
  };
  const executionSummary = () => {
    if (executionStatus) return executionStatus;
    if (executionProgress?.kind === "derived_short_recovery") {
      if (executionProgress.status === "completed") return "Derived-short recovery complete";
      return executionProgress.recoveryFailure === "persisted_provider_failure"
        ? "Derived-short recovery failed after provider dispatch"
        : "Derived-short recovery rejected before provider dispatch";
    }
    if (executionProgress?.kind === "initial_drafter_recovery") {
      if (executionProgress.status === "completed") return "Working-draft recovery complete";
      return executionProgress.recoveryFailure === "persisted_provider_failure"
        ? "Working-draft recovery failed after provider dispatch"
        : executionProgress.recoveryFailure === "outcome_unconfirmed"
          ? "Working-draft recovery outcome could not be confirmed"
        : "Working-draft recovery rejected before provider dispatch";
    }
    return executionProgress?.status === "completed"
      ? "Live Editorial Board complete"
      : executionProgress?.status === "partially_completed"
        ? "Live Editorial Board incomplete"
        : "Live Editorial Board stopped";
  };
  const executionProgressNote = executionProgress?.kind === "initial_drafter_recovery"
    && executionProgress.recoveryFailure === "outcome_unconfirmed"
    ? "The retry claim prevents another attempt, but no persisted provider outcome is available. Start a new Board run before attempting another working draft."
    : (executionProgress?.kind === "derived_short_recovery" || executionProgress?.kind === "initial_drafter_recovery")
    && executionProgress.recoveryFailure === "pre_dispatch_rejection"
    ? "This recovery was rejected before a provider attempt. No provider failure provenance was created."
    : "These are persisted workflow events, not the models’ private reasoning.";
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
  const latestFinalDrafterFailure = idea.derivedShortRecovery?.status === "failed"
    ? idea.derivedShortRecovery.error
    : idea.grounding?.calls
    .filter((call) => call.role === "final_drafter" && !call.success && call.errorCategory)
    .at(-1)?.errorCategory;
  const persistedRunStages = !executionProgress && idea.editorialBrief
    ? [
        { id: "context", label: "Prepare bounded idea and BOK context", status: "completed" as const },
        ...(["strategist", "skeptic", "editor"] as const).map((role) => ({
          id: role,
          label: `${role[0]!.toUpperCase()}${role.slice(1)} review`,
          status: boardRoleStageStatus({
            role,
            attemptedRoles: idea.editorialBrief!.attemptedRoles,
            failedRoles: idea.editorialBrief!.runFailures.map((failure) => failure.role),
          }),
        })),
        {
          id: "synthesizer",
          label: "Synthesize the editorial brief",
          status: boardRoleStageStatus({
            role: "synthesizer",
            attemptedRoles: idea.editorialBrief!.attemptedRoles,
            failedRoles: idea.editorialBrief!.runFailures.map((failure) => failure.role),
          }),
        },
        {
          id: "draft",
          label: "Create the voice-aligned working draft",
          status: primaryDraftCreationStageStatus({
            generatedDraftVersionId: idea.editorialBrief.generatedDraftVersionId,
            synthesizerFailed,
            initialDrafterFailed,
          }),
        },
        ...(includesDerivedShort ? [{
          id: "derived_short",
          label: idea.derivedShortPost?.stale
            ? "Create derived short post (created; now stale after article revision)"
            : "Create derived short post",
          status: derivedShortCreationStageStatus({
            includesDerivedShort,
            generatedDraftVersionId: idea.editorialBrief.generatedDraftVersionId,
            generatedDerivedShortDraftVersionId: idea.editorialBrief.generatedDerivedShortDraftVersionId,
            finalDrafterFailed,
          })!,
        }] : []),
        { id: "provenance", label: "Save provenance, usage, latency, and cost", status: "completed" as const },
      ]
    : undefined;
  const primaryFormat: "short" | "article" = idea.outputShape === "short" ? "short" : "article";
  const primaryOutput = idea.shortPost ?? idea.article;
  const primaryOutputLabel = primaryFormat === "short" ? "Short post" : "Article";
  const primaryOutputVersionLabel = primaryFormat === "short" ? "short-post" : "article";
  const primaryVisualHasLinkedLead = Boolean(
    idea.visualCompanion?.visualBriefId
      && idea.visualCompanion.visualBriefId === idea.visualBrief?.id,
  );
  const derivedShortVisualHasLinkedLead = Boolean(
    idea.derivedShortVisualCompanion?.visualBriefId
      && idea.derivedShortVisualCompanion.visualBriefId === idea.derivedShortVisualBrief?.id,
  );
  const primaryReview = primaryFormat === "short" ? idea.shortPostFinalReview : idea.articleFinalReview;
  const visualCostDisclosure = (outputLabel: string) => (
    <p className="visual-cost-disclosure">
      <b>Rendering cost:</b> $0.00 local for this exact {outputLabel.toLowerCase()} deterministic diagram. No provider call is made.
    </p>
  );
  const articlePublished = Boolean(
    idea.article && idea.publications.some((publication) => publication.draftVersionId === idea.article!.id),
  );
  const isCurrentVoiceCheck = (check: VoiceCheckResult | undefined, draftId?: string) =>
    Boolean(check && draftId && check.draftVersionId === draftId);
  const outputsReadyForFinalize = primaryOutput && !draftDirty && (
    !includesDerivedShort || Boolean(idea.derivedShortPost && !idea.derivedShortPost.stale && !derivedShortDirty)
  );
  const finalizeBlockedMessage = draftDirty && includesDerivedShort && derivedShortDirty
    ? "Save the article and derived short-post edits before finalizing."
    : draftDirty
      ? "Save the article edit before finalizing."
      : derivedShortDirty
        ? "Save the derived short-post edit before finalizing."
          : includesDerivedShort && !idea.derivedShortPost
          ? "The derived short post is missing. Refresh it from the saved article before finalizing."
          : includesDerivedShort && idea.derivedShortPost?.stale
            ? "The derived short post belongs to an earlier article version. Refresh it from the saved article before finalizing."
            : "Save the current output before finalizing.";
  const renderFinalizeOutput = (
    label: string,
    format: "short" | "article" | "derived_short",
    output: { id: string; body: string; version: number },
    sourceNote?: string,
  ) => {
    const voiceCheck = voiceChecks?.[format];
    const currentVoiceCheck = isCurrentVoiceCheck(voiceCheck, output.id);
    const publication = idea.publications.find((item) => item.draftVersionId === output.id);
    const requiresCurrentDerivedShort = format === "article" && includesDerivedShort && (
      !idea.derivedShortPost || idea.derivedShortPost.stale
    );
    const requiresArticlePublication = format === "derived_short" && includesDerivedShort && !articlePublished;
    const review = format === "derived_short" ? idea.derivedShortPostFinalReview : format === "article" ? idea.articleFinalReview : idea.shortPostFinalReview;
    const unresolvedMaterial = review?.proofreadFindings.some((finding) => finding.severity === "material" && !["accepted", "dismissed", "revised"].includes(finding.disposition ?? ""));
    const proofreadStatus = review?.proofreadStatus ?? (review?.proofreadCompleted ? "completed" : "not_run");
    const needsReview = !review || proofreadStatus !== "completed";
    const proofreadBlocker = !review
      ? "Run this saved-output review in Write before publishing."
      : proofreadStatus === "failed"
        ? review.proofreadFailure?.message ?? "Proofread failed for this saved output. Retry its review in Write."
        : "Live proofread is not complete for this saved output. Retry its review in Write.";
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
          <section className="publication-record published-record" aria-label={`${label} publication record`}>
            <p className="eyebrow">PUBLICATION RECORD</p>
            <h4>Recorded for this exact output</h4>
            <dl>
              <div><dt>Delivery channel</dt><dd>{publication.channel === "linkedin" ? "LinkedIn" : publication.channel === "medium" ? "Medium" : "Substack"}</dd></div>
              <div><dt>Publication URL</dt><dd>{publication.url || "No URL recorded"}</dd></div>
              <div><dt>Published date</dt><dd>{new Date(publication.publishedAt).toLocaleString()}</dd></div>
            </dl>
          </section>
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
            <form className="publication-record publish" aria-label={`${label} publication record`} onSubmit={(event) => { const channel = String(new FormData(event.currentTarget).get("channel")); if (channel === "linkedin" || channel === "medium" || channel === "substack") void publish(event, format, channel, output); }}>
              <p className="eyebrow">PUBLICATION RECORD</p>
              <h4>Record this exact output when it is live.</h4>
              <label>Delivery channel <select name="channel" defaultValue="linkedin"><option value="linkedin">LinkedIn</option><option value="medium">Medium</option><option value="substack">Substack</option></select></label>
              {requiresCurrentDerivedShort && <p className="stale-output">Refresh the derived short post in Write before recording this article.</p>}
              {requiresArticlePublication && <p className="stale-output">Publish the article before recording this derived short post.</p>}
              {needsReview && <p className="stale-output">{proofreadBlocker}</p>}
              {unresolvedMaterial && <p className="stale-output">Resolve or explicitly dismiss every material Proofread and clarity finding before publishing.</p>}
              <label>Publication URL <input name="url" type="url" placeholder="https://… (optional)" /></label>
              <label>Published date <input name="publishedAt" type="datetime-local" /></label>
              <button disabled={busy || !currentVoiceCheck || requiresCurrentDerivedShort || requiresArticlePublication || needsReview || unresolvedMaterial} type="submit">Mark this version as published</button>
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
      <section className="idea-run-ledger" aria-label="Local run ledger">
        <div>
          <p className="eyebrow">LOCAL RUN LEDGER</p>
          <p>Recorded usage across this idea. Cost is a local estimate, not a provider invoice.</p>
        </div>
        <dl>
          <div><dt>Attempts</dt><dd>{idea.runLedger.attempts}</dd></div>
          <div><dt>Tokens used</dt><dd>{idea.runLedger.totalTokens.toLocaleString()}</dd></div>
          <div><dt>Recorded cost</dt><dd>{localCost(idea.runLedger)}</dd></div>
        </dl>
      </section>
      {compactCapture ? (
        <details className="original original-collapsed">
          <summary>View original capture</summary>
          <p>{idea.rawNotes}</p>
        </details>
      ) : (
        <article className="original">
          <p className="eyebrow">ORIGINAL CAPTURE</p>
          <p>{idea.rawNotes}</p>
        </article>
      )}
      {showDevelopment && idea.status !== "published" && (
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
          {idea.status !== "parked" && (
            <button
              className="park-idea"
              disabled={busy}
              onClick={() => void request({ status: "parked" })}
            >
              Park this idea
            </button>
          )}
          {deleteIdea && (
            <button className="quiet-button delete-idea lifecycle-delete" disabled={busy} onClick={() => void deleteIdea()}>
              Delete this idea
            </button>
          )}
        </div>
      )}
      {showDevelopment &&
        ["developing", "ready_to_review", "drafted"].includes(idea.status) && (
          <form className="development" onSubmit={saveDetails}>
            <p className="eyebrow">DEVELOPMENT</p>
            <section className="development-section">
              <div className="development-section-heading">
                <p className="eyebrow">READER</p>
                <h3>Who should this help?</h3>
                <p>Choose the reader first. The note adds context without changing the core point.</p>
              </div>
              <div className="development-grid">
                <label>
                  Primary audience
                  <select value={idea.audienceProfileKey ?? "professional"} onChange={(event) => setSelected({ ...idea, audienceProfileKey: event.target.value as Idea["audienceProfileKey"] })}>
                    <option value="professional">Professionals across AI, data, technology, business, and leadership</option>
                    <option value="executive">Executives and organizational leaders</option>
                    <option value="practitioner">Practitioners building or operating AI</option>
                    <option value="general">Curious general readers</option>
                  </select>
                </label>
                <label className="audience-note-field">
                  <span>Audience note <small>Optional</small></span>
                  <input value={idea.audienceNotes ?? ""} maxLength={1_000} onChange={(event) => setSelected({ ...idea, audienceNotes: event.target.value })} placeholder="What should this reader already understand?" />
                </label>
              </div>
            </section>
            {(() => {
              const preference = idea.outputPreferences ?? { longFormEnabled: false, longFormMinWords: 800, longFormMaxWords: 1100, shortFormEnabled: true, shortFormMinWords: 180, shortFormMaxWords: 300, shortFormSource: "standalone" as const };
              const setPreference = (next: typeof preference) => {
                const outputShape = next.longFormEnabled
                  ? next.shortFormEnabled && next.shortFormSource === "derived_from_long" ? "long_with_derived_short" : "long"
                  : "short";
                setSelected({ ...idea, outputPreferences: next, outputShape });
              };
              return <section className="development-section">
                <div className="development-section-heading">
                  <p className="eyebrow">OUTPUT</p>
                  <h3>What should this Board run create?</h3>
                  <p>Set the shape once, then tune only the ranges that apply.</p>
                </div>
                <fieldset className="output-shape-picker">
                  <div className="output-shape-and-ranges">
                    <label>
                      Output shape
                      <select
                        value={idea.outputShape}
                        onChange={(event) => {
                          const outputShape = event.target.value as Idea["outputShape"];
                          setSelected({ ...idea, outputShape, outputPreferences: outputPreferencesForShape(outputShape) });
                        }}
                      >
                        {outputShapes.map((shape) => (
                          <option key={shape.value} value={shape.value}>{shape.label}</option>
                        ))}
                      </select>
                    </label>
                    <div className="output-range-grid">
                      {preference.longFormEnabled && <label>Article target range <span><input aria-label="Long minimum words" type="number" min="100" max="10000" value={preference.longFormMinWords} onChange={(event) => setPreference({ ...preference, longFormMinWords: Number(event.target.value) })} /> to <input aria-label="Long maximum words" type="number" min="100" max="10000" value={preference.longFormMaxWords} onChange={(event) => setPreference({ ...preference, longFormMaxWords: Number(event.target.value) })} /> words</span></label>}
                      {preference.shortFormEnabled && <label>Short-post target range <span><input aria-label="Short minimum words" type="number" min="40" max="5000" value={preference.shortFormMinWords} onChange={(event) => setPreference({ ...preference, shortFormMinWords: Number(event.target.value) })} /> to <input aria-label="Short maximum words" type="number" min="40" max="5000" value={preference.shortFormMaxWords} onChange={(event) => setPreference({ ...preference, shortFormMaxWords: Number(event.target.value) })} /> words</span></label>}
                    </div>
                  </div>
                  {idea.outputShape === "long_with_derived_short" && <p>When both are selected, the short output is derived from the exact long-form version.</p>}
                </fieldset>
              </section>;
            })()}
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
      {showDevelopment && ["developing", "ready_to_review", "drafted"].includes(idea.status) && (
        <details className="research-workspace">
          <summary>Optional research and evidence</summary>
          <p>Use this only to preserve what you already found or to frame what you want to investigate. It never searches the web or writes the post for you.</p>
          <fieldset className="research-mode-picker">
            <legend>Choose one path</legend>
            <label>
              <input type="radio" name="research-mode" value="provided" checked={researchMode === "provided"} onChange={() => setResearchMode("provided")} />
              <span><b>Record sources I already have</b><small>Keep evidence and your interpretation separate.</small></span>
            </label>
            <label>
              <input type="radio" name="research-mode" value="application" checked={researchMode === "application"} onChange={() => setResearchMode("application")} />
              <span><b>Prepare a local research brief</b><small>Save a bounded question and time window; no search is run.</small></span>
            </label>
          </fieldset>
          <fieldset className="research-field-group">
            <legend>1. Frame the question</legend>
            <p>State what the evidence should help you understand. This question is stored with the research, not answered automatically.</p>
            <div className="research-fields">
              <label>
                Question to guide this research
                <textarea value={researchQuestion} onChange={(event) => setResearchQuestion(event.target.value)} placeholder="What do you want to understand or cross-check?" maxLength={2_000} />
              </label>
              <label>
                Time window <small>Optional for your own sources</small>
                <input value={researchWindow} onChange={(event) => setResearchWindow(event.target.value)} placeholder="For example: Last 30 days" maxLength={200} />
              </label>
            </div>
          </fieldset>
          {researchMode === "provided" ? (
            <fieldset className="research-field-group">
              <legend>2. Preserve what you found</legend>
              <p>Keep source-backed evidence separate from the interpretation you may draw from it.</p>
              <label>
                Evidence you found
                <textarea value={researchEvidence} onChange={(event) => setResearchEvidence(event.target.value)} placeholder="Capture facts, quotations, findings, or uncertainty. Do not add your conclusion here." maxLength={12_000} />
              </label>
              <label>
                Your takeaway <span>Optional</span>
                <textarea value={researchInterpretation} onChange={(event) => setResearchInterpretation(event.target.value)} placeholder="What this may mean for your point of view. Keep it separate from evidence." maxLength={8_000} />
              </label>
              <label>
                Source notes <span>Optional</span>
                <textarea value={researchSources} onChange={(event) => setResearchSources(event.target.value)} placeholder="One per line: Title | https://source.example | date | short excerpt" maxLength={20_000} />
              </label>
              <button disabled={busy || !researchQuestion.trim() || !researchEvidence.trim()} onClick={() => void saveProvidedResearch?.({
                question: researchQuestion,
                timeWindow: researchWindow || undefined,
                evidenceSummary: researchEvidence,
                interpretation: researchInterpretation || undefined,
                sources: researchSources.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
                  const [title, sourceUrl, publishedAt, excerpt] = line.split("|").map((part) => part.trim());
                  return { title, sourceUrl: sourceUrl || undefined, publishedAt: publishedAt || undefined, excerpt: excerpt || undefined, label: "evidence" as const };
                }).filter((source) => source.title),
              })}>Save research and evidence</button>
            </fieldset>
          ) : (
            <fieldset className="research-field-group">
              <legend>2. Save the planning brief</legend>
              <p className="research-disclosure">This saves a zero-cost local planning brief. It does not browse the web, claim comprehensive awareness, or add sources automatically.</p>
              <button disabled={busy || !researchQuestion.trim() || !researchWindow.trim()} onClick={() => void createApplicationResearchBrief?.({ question: researchQuestion, timeWindow: researchWindow })}>Prepare research brief</button>
            </fieldset>
          )}
          {idea.research.length > 0 && (
            <div className="research-history">
              <p className="eyebrow">SAVED RESEARCH</p>
              {idea.research.map((entry) => <article key={entry.id}>
                <b>{entry.mode === "provided" ? "Author-provided evidence" : "Application research brief"}</b>
                <p>{entry.question}{entry.timeWindow ? ` · ${entry.timeWindow}` : ""}</p>
                {entry.evidenceSummary && <p>{entry.evidenceSummary}</p>}
                {entry.interpretation && <p><strong>Interpretation:</strong> {entry.interpretation}</p>}
                {entry.sources.map((source) => <p key={`${entry.id}-${source.title}`}><strong>{source.label}:</strong> {source.title}{source.sourceUrl ? ` · ${source.sourceUrl}` : ""}{source.excerpt ? ` — ${source.excerpt}` : ""}</p>)}
                <small>{entry.toolName ?? "author-provided"} · ${entry.actualCost.toFixed(2)} · {entry.injectionSignals.length ? "instruction-like content flagged" : "no instruction-like content detected"}</small>
              </article>)}
            </div>
          )}
        </details>
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
                {livePreview.source.boardReady
                  ? `Upper-bound reservation $${livePreview.estimatedCost.toFixed(4)} · cap $${liveBudget.toFixed(2)} · ${livePreview.planned[0]?.model}`
                  : livePreview.source.unavailableReason}
              </p>
            </div>
            <span>{idea.editorialBrief && !reviewIncomplete ? "Run again" : "Review setup"}</span>
          </summary>
          <div className="live-board-controls">
            {!livePreview.source.boardReady && (
              <p className="warning" role="status">
                {livePreview.source.unavailableReason} The free deterministic test uses the same local sources and remains unavailable until they are ready.
              </p>
            )}
            {!livePreview.available && (
              <p className="warning">
                {livePreview.source.boardReady
                  ? "One or more planned provider routes are not configured in the local server environment. Add the required key and model IDs, then restart the app."
                  : "Live provider routing is not evaluated until the required local sources are ready."}
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
            {(executionStatus || (executionProgress && executionProgress.status !== "waiting")) && (
              <details className="editorial-progress" open={Boolean(executionStatus)}>
                <summary>{executionSummary()}</summary>
                <p>{executionProgressNote}</p>
                <ol className="run-stage-list">
                  {(executionProgress?.stages ?? [
                    { id: "context", label: "Prepare bounded idea and BOK context", status: "running" },
                    { id: "strategist", label: "Strategist review", status: "waiting" },
                    { id: "skeptic", label: "Skeptic review", status: "waiting" },
                    { id: "editor", label: "Editor review", status: "waiting" },
                    { id: "synthesizer", label: "Synthesize the editorial brief", status: "waiting" },
                    { id: "draft", label: "Create the voice-aligned working draft", status: "waiting" },
                    ...(includesDerivedShort ? [{ id: "derived_short", label: "Create derived short post", status: "waiting" as const }] : []),
                    { id: "provenance", label: "Save provenance, usage, latency, and cost", status: "waiting" },
                  ]).map((stage) => (
                    <li key={stage.id} className={stage.status}>
                      <span aria-hidden="true">
                        {stage.status === "completed" ? "✓" : stage.status === "failed" ? "!" : stage.status === "not_run" ? "–" : stage.status === "running" ? "●" : "○"}
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
                <button disabled={busy || hasPublishedOutput || !livePreview.source.boardReady} onClick={() => void board()}>
                  Run free deterministic editorial test
                </button>
              </div>
            </details>
          </div>
        </details>
      )}
      {!showBoard && executionProgress && ["derived_short_recovery", "initial_drafter_recovery"].includes(executionProgress.kind ?? "") && executionProgress.status !== "waiting" && (
        <details className="editorial-progress" open>
          <summary>{executionSummary()}</summary>
          <p>{executionProgressNote}</p>
          <ol className="run-stage-list">
            {executionProgress.stages.map((stage) => (
              <li key={stage.id} className={stage.status}>
                <span aria-hidden="true">
                  {stage.status === "completed" ? "✓" : stage.status === "failed" ? "!" : stage.status === "not_run" ? "–" : stage.status === "running" ? "●" : "○"}
                </span>
                <strong>{stage.label}</strong>
                <small>{stage.status}</small>
              </li>
            ))}
          </ol>
        </details>
      )}
      {showBoard && idea.editorialBrief && (
        <>
          {persistedRunStages && (
            <details className="editorial-progress saved-run-status">
              <summary>Saved run status · {reviewIncomplete ? "incomplete" : "complete"}</summary>
              <p>Saved workflow results, not the model’s private reasoning.</p>
              {derivedShortFailureRecovered && (
                <p>A later derived-short recovery completed successfully. The original Board history remains unchanged; this recovery is recorded separately.</p>
              )}
              {idea.editorialBrief.reviewerRecoveries.length > 0 && (
                <p>A later scoped reviewer recovery completed for {idea.editorialBrief.reviewerRecoveries.map((recovery) => recovery.role).join(", ")}. The original Board history remains unchanged.</p>
              )}
              <ol className="run-stage-list">
                {persistedRunStages.map((stage) => (
                  <li key={stage.id} className={stage.status}>
                      <span aria-hidden="true">{stage.status === "completed" ? "✓" : stage.status === "not_run" ? "–" : "!"}</span>
                    <strong>{stage.label}</strong>
                    <small>{stage.status}</small>
                  </li>
                ))}
              </ol>
              {idea.derivedShortRecovery && (
                <p className="grounded-note">
                  Latest derived-short {idea.derivedShortRecovery.kind} · {idea.derivedShortRecovery.status} · {idea.derivedShortRecovery.provider}/{idea.derivedShortRecovery.model}
                  {idea.derivedShortRecovery.tier ? ` · ${idea.derivedShortRecovery.tier}` : ""} · est. ${idea.derivedShortRecovery.estimatedCost.toFixed(4)}
                  {idea.derivedShortRecovery.escalationReason ? ` · reason: ${idea.derivedShortRecovery.escalationReason}` : ""}
                </p>
              )}
            </details>
          )}
          {reviewIncomplete && (
            <section className="review-recovery-note" aria-label="Run status">
              <p className="eyebrow">RUN STATUS · INCOMPLETE</p>
              <p>This run completed incompletely. Completed outputs are preserved; retry only the failed stage when available.</p>
              <b>Failed or incomplete calls</b>
              {failedBoardRoles.length > 0 ? (
                <ul>
                  {failedBoardRoles.map((failure) => (
                    <li key={failure.role}><strong>{failure.role}:</strong> {failure.role === "final_drafter" && latestFinalDrafterFailure ? latestFinalDrafterFailure : failure.summary}</li>
                  ))}
                </ul>
              ) : <p>The Board review completed, but a later drafting output did not.</p>}
              {finalDrafterFailed && !derivedShortFailureRecovered && retryDerivedShort && livePreview?.derivedShortRefresh && (
                <>
                  <button className="reviewer-rerun" disabled={busy || !livePreview.derivedShortRefresh.available || liveBudget < livePreview.derivedShortRefresh.estimatedCost} onClick={() => void retryDerivedShort(liveBudget, "retry")}>
                    Retry derived short post with the configured low-cost route · {livePreview.derivedShortRefresh.model} · conservative est. ${livePreview.derivedShortRefresh.estimatedCost.toFixed(4)}
                  </button>
                  {livePreview.derivedShortEscalation.available && (
                    <button className="quiet-button" disabled={busy || liveBudget < livePreview.derivedShortEscalation.estimatedCost} onClick={() => {
                      if (window.confirm(`Escalate only the derived-short drafter to ${livePreview.derivedShortEscalation.model}? This is a separate, explicitly recorded higher-cost retry.`))
                        void retryDerivedShort(liveBudget, "escalation");
                    }}>
                      Escalate derived-short drafter · {livePreview.derivedShortEscalation.model} · conservative est. ${livePreview.derivedShortEscalation.estimatedCost.toFixed(4)}
                    </button>
                  )}
                </>
              )}
              {initialDrafterFailed && !idea.editorialBrief.generatedDraftVersionId && retryInitialDrafter && livePreview?.initialDrafterRecovery?.available && (
                <>
                  <p>{initialDrafterFailureCategory === "reader_range_contract_failed"
                    ? "The generated working draft fell outside its saved reader range. Completed reviews and synthesis are saved; retry only this stage after confirming the selected range or start a new Board run."
                    : initialDrafterFailureCategory === "reader_prose_scaffolding_failed"
                      ? "The generated working draft exposed internal source or capture scaffolding. Completed reviews and synthesis are saved; retry only this stage or start a new Board run."
                      : initialDrafterFailureCategory === "output_limit"
                        ? "The model reached its output limit before a complete working draft was validated. Completed reviews and synthesis are saved. This retry uses the same configured route and bounded output allowance; it does not rerun or alter the Board assessment. If the same limit occurs again, an administrator must adjust that route or allowance before you start a new Board run."
                        : "The working draft did not pass its saved output validation. Completed reviews and synthesis are saved; retry only this stage or start a new Board run."}</p>
                  <button className="reviewer-rerun" disabled={busy || !livePreview.initialDrafterRecovery.available || liveBudget < livePreview.initialDrafterRecovery.estimatedCost} onClick={() => void retryInitialDrafter(liveBudget)}>
                    Retry working draft with the configured {livePreview.initialDrafterRecovery.tier}-tier route · {livePreview.initialDrafterRecovery.model} · conservative est. ${livePreview.initialDrafterRecovery.estimatedCost.toFixed(4)}
                  </button>
                  {liveBudget < livePreview.initialDrafterRecovery.estimatedCost && (
                    <p>Increase the run cap to at least the conservative reservation of ${livePreview.initialDrafterRecovery.estimatedCost.toFixed(4)} to retry this working draft.</p>
                  )}
                </>
              )}
              {initialDrafterFailed && !idea.editorialBrief.generatedDraftVersionId && retryInitialDrafter && livePreview?.initialDrafterRecovery && !livePreview.initialDrafterRecovery.available && (
                <p className="stale-review-notice">{livePreview.initialDrafterRecovery.unavailableReason ?? "Working-draft retry is unavailable until the configured Initial Drafter route and the saved Board sources are available."}</p>
              )}
              {failedBoardRoles.filter((failure) => ["strategist", "skeptic", "editor"].includes(failure.role) && !idea.editorialBrief!.reviewerRecoveries.some((recovery) => recovery.role === failure.role)).map((failure) => (
                <div className="reviewer-recovery-action" key={`retry-${failure.role}`}>
                  <p>The {failure.role} review did not complete. Its original failed attempt is saved. Retry only this reviewer; the Board run and current draft will not be replaced.</p>
                  {rerunReviewer && livePreview?.reviewerReruns.medium && (
                    <button className="reviewer-rerun" disabled={busy || !livePreview.reviewerReruns.medium.available || liveBudget < livePreview.reviewerReruns.medium.estimatedCost} onClick={() => void rerunReviewer(failure.role as "strategist" | "skeptic" | "editor", liveBudget, "medium")}>
                      Retry {failure.role} review · {livePreview.reviewerReruns.medium.model} · conservative est. ${livePreview.reviewerReruns.medium.estimatedCost.toFixed(4)}
                    </button>
                  )}
                </div>
              ))}
            </section>
          )}
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
        </>
      )}
      {showDraft && (
        <section className="write-context" aria-label="Writing setup">
          <div className="write-context-heading">
            <p className="eyebrow">WRITING SETUP</p>
            <p>Keep the saved Board contract distinct from the preferences you can still change in Develop.</p>
          </div>
          <div className="write-context-grid">
            {idea.editorialBrief && (
              <section className="reader-contract" aria-label="Reader contract">
                <p className="eyebrow">SAVED FOR THIS BOARD RUN</p>
                <h2>Saved Board-run contract</h2>
                {idea.grounding?.readerContract ? <p>{idea.grounding.readerContract.audienceProfile === "executive" ? "Executives and organizational leaders" : idea.grounding.readerContract.audienceProfile === "practitioner" ? "Practitioners building or operating AI" : idea.grounding.readerContract.audienceProfile === "general" ? "Curious general readers" : "Professionals across AI, data, technology, business, and leadership"}{idea.grounding.readerContract.audienceNotes ? ` · ${idea.grounding.readerContract.audienceNotes}` : ""} · {idea.grounding.readerContract.longForm && `Long ${idea.grounding.readerContract.longForm.min}–${idea.grounding.readerContract.longForm.max} words. `}{idea.grounding.readerContract.shortForm && `Short ${idea.grounding.readerContract.shortForm.min}–${idea.grounding.readerContract.shortForm.max} words.`}</p> : <p>No immutable Board contract is available for this historical run.</p>}
              </section>
            )}
            <section className="reader-contract-panel" aria-label="Current reader preferences">
              <p className="eyebrow">CURRENTLY EDITABLE</p>
              <h2>Current Develop preferences</h2>
              <p><strong>Audience:</strong> {idea.audienceProfileKey ?? "professional"}{idea.audienceNotes ? ` · ${idea.audienceNotes}` : ""}</p>
              <p><strong>Output shape:</strong> {idea.outputShape.replaceAll("_", " ")}</p>
              <p>
                {idea.outputPreferences?.longFormEnabled && `Article: ${idea.outputPreferences.longFormMinWords}–${idea.outputPreferences.longFormMaxWords} words.`}
                {idea.outputPreferences?.longFormEnabled && idea.outputPreferences?.shortFormEnabled && " "}
                {idea.outputPreferences?.shortFormEnabled && `Short post: ${idea.outputPreferences.shortFormMinWords}–${idea.outputPreferences.shortFormMaxWords} words${idea.outputPreferences.shortFormSource === "derived_from_long" ? ", derived from the article." : "."}`}
              </p>
            </section>
          </div>
          {idea.editorialBrief && (
            <details className="draft-brief-reference">
              <summary>Editorial brief reference</summary>
              <p>{idea.editorialBrief.thesis}</p>
              <ul>{idea.editorialBrief.recommendedChanges.map((item) => <li key={item}>{item}</li>)}</ul>
            </details>
          )}
        </section>
      )}
      {(showDraft || showPublish) && idea.publicationIntegrityWarning && (
        <p className="stale-output">{idea.publicationIntegrityWarning}</p>
      )}
      {showDraft && reviewIncomplete && (
        <p className="review-recovery-note">
          This draft came from an incomplete historical Board run. Return to Editorial Board and complete the review before treating it as validated.
        </p>
      )}
      {showDraft && !primaryOutput && (
        <section className="stage-empty-state">
          <h3>No working draft yet.</h3>
          <p>Run the Editorial Board first. A validated brief will create the working draft for this stage.</p>
          <Link className="stage-primary-link" href={`/ideas/${idea.id}/board`}>Open Editorial Board →</Link>
        </section>
      )}
      {showDraft && primaryOutput && createVisual && (
        <section className="visual-companion-entry" aria-label="Visual companion">
          <div>
            <p className="eyebrow">OPTIONAL READER AID</p>
            <h3>Visual companion</h3>
            <p>Plan or revise one local visual for this exact saved {primaryOutputLabel.toLowerCase()} before reviewing the prose in detail.</p>
          </div>
          <a className="button-link" href="#visual-companion-workspace">Open visual companion</a>
        </section>
      )}
      {showDraft && primaryOutput && (
        <section className="draft-editor output-editor">
          <div className="output-editor-heading">
            <div>
              <p className="eyebrow">{primaryFormat === "article" ? "ARTICLE" : "SHORT POST"} · VERSION {primaryOutput.version}</p>
              <h2>{primaryFormat === "article" ? "Article draft" : "Short post draft"}</h2>
              <p>Edit the exact saved output. Save before running its review or final voice check.</p>
            </div>
            <span className={draftDirty ? "output-state stale" : "output-state"}>{primaryPublished ? "Published" : draftDirty ? "Unsaved changes" : `Saved as version ${primaryOutput.version}`}</span>
          </div>
          {primaryOutput.createdBy === "initial_drafter" && idea.grounding?.draftVersionId === primaryOutput.id && (
            <p className="grounded-note">
              {idea.grounding.executionMode === "live"
                ? "Live grounded output. The selected BOK passages, configured voice skill, provider, model, usage, and pricing assumption are recorded below."
                : "Grounded deterministic test output. The selected BOK passages and configured voice skill are recorded below; no paid model was called."}
            </p>
          )}
          {primaryOutput.createdBy === "initial_drafter" && !idea.grounding && (
            <p className="simulation-note">
              This starter text is deterministic test content. BOK and kk-spoken-voice have not been applied.
            </p>
          )}
          <label className="output-editor-field">
            <span>{primaryFormat === "article" ? "Article" : "Short post"}</span>
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
          </label>
          <div className="output-editor-actions">
            <button disabled={busy || primaryPublished} onClick={() => void saveDraft()}>
              Save draft version
            </button>
            <button disabled={busy || draftDirty || primaryPublished} onClick={() => void finalReview(primaryFormat)}>Run draft review</button>
            {proofreaderDisclosure(primaryFormat)}
            {primaryPublished && <p className="published-lock-note">This exact version is published and now read-only. Its text, reviews, and visual are retained as publication history.</p>}
          </div>
        </section>
      )}
      {showDraft && includesDerivedShort && idea.article && (
        <section className="publication-outputs">
          <p className="eyebrow">PUBLICATION OUTPUTS</p>
          <h3>Article first, then its derived short post.</h3>
          <p className="publication-output-intro">The article is version {idea.article.version}. The Editorial Board generates its derived short post in the same run.</p>
          {!idea.derivedShortPost || idea.derivedShortPost.stale ? (
            <div className="stale-output">
              <p>
                {idea.derivedShortPost
                  ? "The derived short post belongs to an earlier article version. Refresh it from this saved article; the Board brief and article will remain unchanged."
                  : "This older Board run did not create a derived short post. Generate it from this saved article; the Board brief and article will remain unchanged."}
              </p>
              {retryDerivedShort && livePreview?.derivedShortRefresh && (
                <button
                  className="reviewer-rerun"
                  disabled={busy || derivedShortDirty || !livePreview.derivedShortRefresh.available || liveBudget < livePreview.derivedShortRefresh.estimatedCost}
                  onClick={() => void retryDerivedShort(liveBudget, "refresh")}
                >
                  Refresh derived short post from Article v{idea.article.version} · {livePreview.derivedShortRefresh.model} · conservative est. ${livePreview.derivedShortRefresh.estimatedCost.toFixed(4)}
                </button>
              )}
              {derivedShortDirty && <p>Save or discard the unsaved derived short-post edits before replacing this stale version.</p>}
              {livePreview?.derivedShortRefresh && liveBudget < livePreview.derivedShortRefresh.estimatedCost && (
                <p>Increase the run cap to at least the conservative reservation of ${livePreview.derivedShortRefresh.estimatedCost.toFixed(4)} to refresh this derived short post.</p>
              )}
            </div>
          ) : (
            <article className="companion-ready output-editor">
              <div className="companion-heading output-editor-heading">
                <div>
                  <p className="eyebrow">DERIVED SHORT POST · VERSION {idea.derivedShortPost.version}</p>
                  <h2>Derived short post draft</h2>
                  <p>Based on article version {idea.derivedShortPost.sourceArticleVersion}. Its edits and review stay separate from the article.</p>
                </div>
                <span className={derivedShortDirty ? "output-state stale" : "output-state"}>
                  {derivedShortDirty ? "Unsaved changes" : `Saved as version ${idea.derivedShortPost.version}`}
                </span>
              </div>
              <label className="output-editor-field">
                <span>Derived short post</span>
                <textarea className="companion-editor" aria-label="Derived short post draft" disabled={derivedShortPublished} value={derivedShortDraft ?? idea.derivedShortPost.body} onChange={(event) => {
                  setDerivedShortDraft?.(event.target.value);
                  onDerivedShortChange?.(event.target.value);
                }} maxLength={80_000} />
              </label>
              <div className="companion-actions output-editor-actions">
                <button disabled={busy || derivedShortPublished} onClick={() => void saveDerivedShort?.()}>Save derived short version</button>
                <button disabled={busy || derivedShortDirty || derivedShortPublished} onClick={() => void finalReview("derived_short")}>Run derived short-post review</button>
                {proofreaderDisclosure("derived_short")}
                <p>Save when you complete a meaningful edit. Reviews and final checks apply only to saved versions.</p>
                {derivedShortPublished && <p className="published-lock-note">This exact derived short version is published and now read-only.</p>}
              </div>
            </article>
          )}
        </section>
      )}
      {showDraft && primaryOutput && (
        <section className="draft-review">
          <p className="eyebrow">REVIEW THIS OUTPUT · VERSION {primaryOutput.version}</p>
          <div className="draft-review-heading">
            <div>
              <h3>{primaryOutputLabel} review</h3>
              <p>
                The saved assessment stays connected to this exact {primaryOutputVersionLabel} version.
              </p>
            </div>
          </div>
          {draftDirty && (
            <p className="stale-review-notice">
              Unsaved edits are not covered by the current draft review or voice check. Save this output, then review it when useful.
            </p>
          )}
          {primaryReview && (
            <section className={`final-review-result ${primaryReview.readiness}${draftDirty ? " stale" : ""}`}>
              <div className="review-result-heading">
                <p className="eyebrow">SAVED REVIEW RESULT</p>
                <h4>
                {draftDirty
                  ? "Previous review · draft has unsaved changes"
                  : primaryReview.readiness === "ready"
                    ? "Ready for your final judgment"
                    : "Revise before publishing"}
                </h4>
              </div>
              <p>{primaryReview.summary}</p>
              <section className="proofread-findings" aria-label="Proofread and clarity findings">
                <b>Proofread and clarity</b>
                {!primaryReview.proofreadCompleted ? <p>{primaryReview.proofreadStatus === "failed"
                  ? primaryReview.proofreadFailure?.message ?? `The low-cost proofread failed for this exact ${primaryOutputVersionLabel}. Select Run draft review above to retry the combined assessment and proofread.`
                  : "Proofread has not run for this exact saved version. Select Run draft review above to run the combined assessment and proofread."}</p> : primaryReview.proofreadFindings.length ? primaryReview.proofreadFindings.map((finding) => (
                  <article key={finding.id}>
                    <p><strong>{finding.severity === "material" ? "Material correction" : "Optional suggestion"}</strong> · {finding.category}</p>
                    <p>Current: {finding.current}</p><p>Suggested: {finding.suggestion}</p><small>{finding.rationale}</small>
                    {finding.severity === "material" && setReviewFindingDisposition && <label>Decision
                      <select value={finding.disposition ?? ""} disabled={busy || primaryPublished} onChange={(event) => { if (event.target.value) void setReviewFindingDisposition(primaryReview.runId, finding.id, event.target.value as "accepted" | "dismissed" | "revised" | "still_open"); }}>
                        <option value="">Resolve or dismiss before Finalize</option><option value="revised">Revised</option><option value="accepted">Accepted</option><option value="dismissed">Dismissed as not applicable</option><option value="still_open">Still open</option>
                      </select>
                    </label>}
                  </article>
                )) : <p>No proofread or clarity findings for this exact version.</p>}
              </section>
              <div className="review-columns">
                <div>
                  <b>Editorial assessment · original recommendations</b>
                  <ul>
                    {primaryReview.recommendationStatuses.map((item) => (
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
                    {primaryReview.addressed.length ? (
                      primaryReview.addressed.map((item) => (
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
                    {primaryReview.remaining.length ? (
                      primaryReview.remaining.map((item) => (
                        <li key={item}>{item}</li>
                      ))
                    ) : (
                      <li>No open editorial items identified.</li>
                    )}
                  </ul>
                </div>
              </div>
              <p>
                <strong>Next step:</strong> {primaryReview.nextStep}
              </p>
              {idea.editorialBrief && primaryReview.recommendationStatuses.length > 0 && (
                <section className="recommendation-decisions">
                  <h4>Record your decision on the original recommendations</h4>
                  <p>This is optional. It records your judgment; it does not claim the checklist inferred what you changed.</p>
                  {primaryReview.recommendationStatuses.map((item) => (
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
                </section>
              )}
              {primaryReview.readiness === "ready" && Boolean(primaryReview.polishSuggestions?.length) && (
                <div className="polish-suggestions">
                  <div>
                    <b>Optional final polish</b>
                    <p>These are not publication blockers. Apply only the changes that still sound like you.</p>
                  </div>
                  {primaryReview.polishSuggestions!.map((suggestion) => (
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
              <details className="review-checklist">
                <summary>View this review’s checklist details</summary>
                <p className="local-checklist-explainer">
                  This is a local structural checklist, not a second live-model score. Pass means no change was identified; Review is optional judgment; Needs revision identifies a specific open item.
                </p>
                {primaryReview.reviews.map((review) => (
                  <article key={review.role}>
                    <b>
                      {review.role} · {review.status === "failed" ? "failed" : reviewStatusBadge(review.checkStatus, review.details)}
                    </b>
                    <p>{review.summary}</p>
                    {review.details.map((item) => (
                      <p key={item}>• {item}</p>
                    ))}
                  </article>
                ))}
              </details>
            </section>
          )}
        </section>
      )}
      {showDraft && includesDerivedShort && idea.derivedShortPost && !idea.derivedShortPost.stale && (
        <section className="draft-review companion-draft-review">
          <p className="eyebrow">REVIEW DERIVED SHORT POST · VERSION {idea.derivedShortPost.version}</p>
          <div className="draft-review-heading">
            <div>
              <h3>Derived short-post review</h3>
              <p>Its saved assessment stays attached to this exact short-post version.</p>
            </div>
          </div>
          {derivedShortDirty && (
            <p className="stale-review-notice">
              Unsaved derived short-post edits are not covered by its review or voice check. Save this version first.
            </p>
          )}
          {idea.derivedShortPostFinalReview && (
            <section className={`final-review-result ${idea.derivedShortPostFinalReview.readiness}${derivedShortDirty ? " stale" : ""}`}>
              <div className="review-result-heading">
                <p className="eyebrow">SAVED REVIEW RESULT</p>
                <h4>
                {derivedShortDirty
                  ? "Previous derived short-post review · draft has unsaved changes"
                  : idea.derivedShortPostFinalReview.readiness === "ready"
                    ? "Derived short post ready for final judgment"
                    : "Revise derived short post before finalizing"}
                </h4>
              </div>
              <p>{idea.derivedShortPostFinalReview.summary}</p>
              <section className="proofread-findings" aria-label="Derived short-post proofread and clarity findings">
                <b>Proofread and clarity</b>
                {!idea.derivedShortPostFinalReview.proofreadCompleted ? <p>{idea.derivedShortPostFinalReview.proofreadStatus === "failed"
                  ? idea.derivedShortPostFinalReview.proofreadFailure?.message ?? "The low-cost proofread failed for this exact derived short-post version. Select Run derived short-post review above to retry the combined assessment and proofread."
                  : "Proofread has not run for this exact saved derived short-post version. Select Run derived short-post review above to run the combined assessment and proofread."}</p> : idea.derivedShortPostFinalReview.proofreadFindings.length ? idea.derivedShortPostFinalReview.proofreadFindings.map((finding) => (
                  <article key={finding.id}><p><strong>{finding.severity === "material" ? "Material correction" : "Optional suggestion"}</strong> · {finding.category}</p><p>Current: {finding.current}</p><p>Suggested: {finding.suggestion}</p><small>{finding.rationale}</small>
                    {finding.severity === "material" && setReviewFindingDisposition && <label>Decision <select value={finding.disposition ?? ""} disabled={busy || derivedShortPublished} onChange={(event) => { if (event.target.value) void setReviewFindingDisposition(idea.derivedShortPostFinalReview!.runId, finding.id, event.target.value as "accepted" | "dismissed" | "revised" | "still_open"); }}><option value="">Resolve or dismiss before Finalize</option><option value="revised">Revised</option><option value="accepted">Accepted</option><option value="dismissed">Dismissed as not applicable</option><option value="still_open">Still open</option></select></label>}
                  </article>
                )) : <p>No proofread or clarity findings for this exact version.</p>}
              </section>
              {idea.derivedShortPostFinalReview.remaining.length > 0 && (
                <div className="companion-next-edits">
                  <b>Still open</b>
                  <ul>{idea.derivedShortPostFinalReview.remaining.map((item) => <li key={item}>{item}</li>)}</ul>
                  <div>
                    <b>Suggested next edit</b>
                    {idea.derivedShortPostFinalReview.remaining.map((item) => <p key={`next-${item}`}>{derivedShortNextEdit(item)}</p>)}
                  </div>
                </div>
              )}
              {idea.derivedShortPostFinalReview.polishSuggestions?.length ? (
                <div className="polish-suggestions companion-polish-suggestions">
                  <div>
                    <b>Optional final polish</b>
                    <p>These are not blockers. Apply only what still sounds like you.</p>
                  </div>
                  {idea.derivedShortPostFinalReview.polishSuggestions.map((suggestion) => (
                    <article key={suggestion.id}>
                      <div className="polish-comparison">
                        <p><span>Current</span>{suggestion.current}</p>
                        <p><span>Suggested</span>{suggestion.suggested}</p>
                      </div>
                      <p className="polish-reason">{suggestion.reason}</p>
                      <button
                        type="button"
                        disabled={busy || derivedShortPublished || !(derivedShortDraft ?? idea.derivedShortPost?.body ?? "").includes(suggestion.current)}
                        onClick={() => applyDerivedShortPolishSuggestion(suggestion.current, suggestion.suggested)}
                      >
                        Apply this edit
                      </button>
                    </article>
                  ))}
                </div>
              ) : null}
              <details className="review-checklist">
                <summary>View this review’s checklist details</summary>
                {idea.derivedShortPostFinalReview.reviews.map((review) => (
                  <article key={review.role}>
                    <b>{review.role} · {reviewStatusBadge(review.checkStatus, review.details)}</b>
                    <p>{review.summary}</p>
                    {review.details.map((item) => <p key={item}>• {item}</p>)}
                  </article>
                ))}
              </details>
            </section>
          )}
        </section>
      )}
      {showDraft && primaryOutput && createVisual && (
        <details id="visual-companion-workspace" className="visual-companion" open={Boolean(idea.visualCompanion)}>
          <summary>
            <span>Visual companion</span>
            <small>Optional local asset for this exact {primaryOutputLabel.toLowerCase()} version</small>
          </summary>
          <div className="visual-companion-content">
            {!idea.visualCompanion ? (
              <>
                {!idea.visualBrief && <>
                  <label className="visual-direction-field">What visual are you thinking of? <small>Optional. Describe the relationship, object, or scene you want the reader to see. This stays local and does not generate an image.</small><textarea value={visualDirection} maxLength={1000} placeholder="For example: show a building with a reliable foundation beneath visible AI activity." onChange={(event) => setVisualDirection(event.target.value)} /></label>
                  <p>Prepare a local recommendation from this exact saved output. It will select one faithful diagram grammar or say that none fits.</p>
                </>}
                {idea.visualBrief && <p>{idea.visualBrief.rationale}</p>}
                {idea.visualBrief && <p><b>Saved reader contract:</b> {idea.visualBrief.readerContract.audienceProfile} · {idea.visualBrief.readerContract.outputShape.replaceAll("_", " ")}.</p>}
                {idea.visualBrief?.recommendation === "visual" && <p><b>Local visual recommendation:</b> {visualTemplateLabel(idea.visualBrief.template)}. It is based only on this exact saved output; it has not generated anything yet.</p>}
                {idea.visualBrief?.status === "recommended" && idea.visualBrief.recommendation === "visual" && updateVisualBrief && (
                  visualBriefEditor(idea.visualBrief)
                )}
                {idea.visualBrief?.recommendation === "no_visual" ? (
                  <>
                    <p><b>{idea.visualBrief?.authorDirection ? "A custom illustration may help." : "No visual recommended for this exact output."}</b> {idea.visualBrief?.authorDirection ? "This local flow will not substitute a mismatched diagram or create an image. No provider call or price applies. A future custom-image route will require its own explicit model, cost, and approval controls." : "You can still explicitly choose one deterministic diagram if it would materially help the reader."}</p>
                    <details className="visual-template-alternative">
                      <summary>Try a supported deterministic diagram instead</summary>
                      <fieldset className="visual-template-picker" disabled={busy || draftDirty || primaryPublished}>
                        <legend>Choose the explanatory shape</legend>
                        <label><input type="radio" name="visual-template" checked={visualTemplate === "decision_fork"} onChange={() => setVisualTemplate("decision_fork")} /><span><b>Decision fork</b><small>One starting point, then unmanaged activity or disciplined capability.</small></span></label>
                        <label><input type="radio" name="visual-template" checked={visualTemplate === "contrast"} onChange={() => setVisualTemplate("contrast")} /><span><b>Iceberg contrast</b><small>Visible activity above the surface; operating maturity beneath it.</small></span></label>
                        <label><input type="radio" name="visual-template" checked={visualTemplate === "vertical_path"} onChange={() => setVisualTemplate("vertical_path")} /><span><b>Vertical path</b><small>A compact upward progression through three stages.</small></span></label>
                        <label><input type="radio" name="visual-template" checked={visualTemplate === "flow"} onChange={() => setVisualTemplate("flow")} /><span><b>Three-step flow</b><small>Three connected cards; use only when sequence is the actual point.</small></span></label>
                      </fieldset>
                      {visualTemplate && <button disabled={busy || draftDirty || primaryPublished} onClick={() => void createVisual({ operation: "recommend", format: primaryFormat, placement: "lead", template: visualTemplate, authorDirection: idea.visualBrief?.authorDirection })}>Request selected visual</button>}
                    </details>
                  </>
                ) : (
                  <>{visualCostDisclosure(primaryOutputLabel)}<button disabled={busy || draftDirty || primaryPublished} onClick={() => void createVisual(
                    !idea.visualBrief
                      ? { operation: "recommend", format: primaryFormat, placement: "lead", authorDirection: visualDirection.trim() || undefined }
                      : idea.visualBrief.status === "recommended"
                        ? { operation: "approve", format: primaryFormat, briefId: idea.visualBrief.id }
                        : { operation: "render", format: primaryFormat, briefId: idea.visualBrief.id },
                  )}>
                    {!idea.visualBrief ? "Prepare visual brief" : idea.visualBrief.status === "recommended" ? "Approve visual brief" : "Render approved visual"}
                  </button></>
                )}
              </>
            ) : (
              <VisualFlow
                visual={idea.visualCompanion}
                actions={primaryVisualHasLinkedLead
                  ? <>{visualCostDisclosure(primaryOutputLabel)}<button className="refresh-visual" disabled={busy || draftDirty || primaryPublished} onClick={() => void createVisual({ operation: "render", format: primaryFormat, briefId: idea.visualBrief?.id })}>Refresh this visual</button></>
                  : <p className="legacy-visual-note">Saved before visual briefs were introduced. This retained local asset is read-only and can still be downloaded.</p>}
              />
            )}
            {primaryVisualHasLinkedLead && (
              <section className="visual-version-controls" aria-label="Lead visual versions">
                <h3>Lead visual versions</h3>
                <p>The active version is the one shown above. Creating a new version never overwrites this saved local asset.</p>
                {idea.visualCandidateBrief ? (
                  <article className="visual-version-candidate">
                    <b>Version {idea.visualCandidateBrief.revisionNumber} · {idea.visualCandidateBrief.status}</b>
                    <p>{idea.visualCandidateBrief.rationale}</p>
                    {idea.visualCandidateBrief.recommendation === "visual" && updateVisualBrief && visualBriefEditor(idea.visualCandidateBrief)}
                    {idea.visualCandidateBrief.recommendation === "visual" && <>
                      {visualCostDisclosure(`visual version ${idea.visualCandidateBrief.revisionNumber}`)}
                      <button disabled={busy || draftDirty || primaryPublished} onClick={() => void createVisual(idea.visualCandidateBrief?.status === "recommended"
                        ? { operation: "approve", format: primaryFormat, briefId: idea.visualCandidateBrief?.id }
                        : { operation: "render", format: primaryFormat, briefId: idea.visualCandidateBrief?.id },
                      )}>{idea.visualCandidateBrief.status === "recommended" ? "Approve new visual version" : "Generate new visual version"}</button>
                    </>}
                    {idea.visualCandidateBrief.recommendation === "no_visual" && <><p><b>A custom illustration may help.</b> This version is retained as an author concept; no image, provider call, or price was created.</p><button disabled={busy || draftDirty || primaryPublished} onClick={() => void createVisual({ operation: "dismiss", format: primaryFormat, briefId: idea.visualCandidateBrief?.id })}>Keep this concept as history and prepare another version</button></>}
                  </article>
                ) : (
                  <details className="visual-version-request">
                    <summary>Create a new visual version</summary>
                    <label>What should change? <textarea value={visualDirection} maxLength={1000} placeholder="For example: use a calmer contrast, add a foundation metaphor, or make the decision clearer." onChange={(event) => setVisualDirection(event.target.value)} /></label>
                    <fieldset className="visual-template-picker" disabled={busy || draftDirty || primaryPublished}>
                      <legend>Choose a grammar for the new version</legend>
                      <label><input type="radio" name="visual-revision-template" checked={!visualTemplate} onChange={() => setVisualTemplate(undefined)} /><span><b>Custom illustration concept</b><small>Keep a literal object or scene as author direction; this local diagram flow will not render it.</small></span></label>
                      <label><input type="radio" name="visual-revision-template" checked={visualTemplate === "decision_fork"} onChange={() => setVisualTemplate("decision_fork")} /><span><b>Decision fork</b><small>One starting point, then two outcomes.</small></span></label>
                      <label><input type="radio" name="visual-revision-template" checked={visualTemplate === "contrast"} onChange={() => setVisualTemplate("contrast")} /><span><b>Iceberg contrast</b><small>Visible activity above operating maturity.</small></span></label>
                      <label><input type="radio" name="visual-revision-template" checked={visualTemplate === "vertical_path"} onChange={() => setVisualTemplate("vertical_path")} /><span><b>Vertical path</b><small>A compact upward progression.</small></span></label>
                      <label><input type="radio" name="visual-revision-template" checked={visualTemplate === "flow"} onChange={() => setVisualTemplate("flow")} /><span><b>Three-step flow</b><small>Connected stages when sequence is the point.</small></span></label>
                    </fieldset>
                    {visualCostDisclosure(`visual version ${Math.max(...idea.visualRevisionHistory.map((brief) => brief.revisionNumber), 0) + 1}`)}
                    <button disabled={busy || draftDirty || primaryPublished} onClick={() => void createVisual({ operation: "start_revision", format: primaryFormat, template: visualTemplate, authorDirection: visualDirection.trim() || undefined })}>Prepare new visual version</button>
                  </details>
                )}
                {(() => {
                  const completeHistory = idea.visualRevisionHistory;
                  const renderedHistory = idea.visualRevisionHistory.filter((brief) => brief.recommendation === "visual" && brief.status === "rendered");
                  const customConcepts = idea.visualRevisionHistory.filter((brief) => brief.recommendation === "no_visual" && Boolean(brief.authorDirection));
                  const activeIndex = renderedHistory.findIndex((brief) => brief.id === idea.visualBrief?.id);
                  const previous = activeIndex > 0 ? renderedHistory[activeIndex - 1] : undefined;
                  const next = activeIndex >= 0 && activeIndex < renderedHistory.length - 1 ? renderedHistory[activeIndex + 1] : undefined;
                  return <>
                    {completeHistory.length > 1 && <div className="visual-version-arrows"><button disabled={busy || !previous} aria-label="Previous saved visual version" onClick={() => previous && void createVisual({ operation: "select_revision", format: primaryFormat, briefId: previous.id })}>←</button><span>Version {idea.visualBrief?.revisionNumber ?? 1} of {completeHistory.length}</span><button disabled={busy || !next} aria-label="Next saved visual version" onClick={() => next && void createVisual({ operation: "select_revision", format: primaryFormat, briefId: next.id })}>→</button></div>}
                    {customConcepts.length > 0 && <section className="visual-custom-history" aria-label="Saved custom illustration concepts"><h4>Saved custom illustration concepts</h4>{customConcepts.map((brief) => <article key={brief.id}><b>Version {brief.revisionNumber} · author concept</b><p>{brief.authorDirection}</p><small>No image, provider call, or price was created for this saved concept.</small></article>)}</section>}
                  </>;
                })()}
              </section>
            )}
            {idea.supportingVisualCompanions.length > 0 && (
              <section className="supporting-visuals" aria-label="Supporting visuals for this exact output">
                <h3>Earlier supporting visuals</h3>
                <p>New supporting visuals are deferred while this workflow focuses on one versioned lead. Existing local supporting assets remain readable history.</p>
                {idea.supportingVisualCompanions.map((visual) => <VisualFlow key={visual.id} visual={visual} />)}
              </section>
            )}
          </div>
        </details>
      )}
      {showDraft && includesDerivedShort && idea.derivedShortPost && createVisual && (
        <details className="visual-companion derived-short-visual" open={Boolean(idea.derivedShortVisualCompanion)}>
          <summary><span>Derived short-post visual companion</span><small>Separate optional asset for exact derived short-post version {idea.derivedShortPost.version}</small></summary>
          <div className="visual-companion-content">
            <p>{idea.derivedShortVisualBrief?.rationale ?? "This is a separate visual decision for the current derived short post; it does not reuse the article visual."}</p>
            {!idea.derivedShortVisualBrief && <label className="visual-direction-field">What visual are you thinking of? <small>Optional. The local planner will recommend one faithful diagram or say that none fits; it does not generate an image.</small><textarea value={derivedVisualDirection} maxLength={1000} placeholder="For example: show the contrast between a pilot and dependable work." onChange={(event) => setDerivedVisualDirection(event.target.value)} /></label>}
            {idea.derivedShortVisualBrief?.status === "recommended" && idea.derivedShortVisualBrief.recommendation === "visual" && updateVisualBrief && visualBriefEditor(idea.derivedShortVisualBrief, derivedVisualTemplate)}
            {!idea.derivedShortVisualCompanion ? (
              idea.derivedShortVisualBrief?.recommendation === "no_visual" ? (
                <>
                  <p><b>{idea.derivedShortVisualBrief.authorDirection ? "A custom illustration may help." : "No visual recommended for this exact derived short post."}</b> {idea.derivedShortVisualBrief.authorDirection ? "This local flow will not substitute a mismatched diagram or create an image. No provider call or price applies." : "You can still choose a deterministic diagram if it would materially help the reader."}</p>
                  <details className="visual-template-alternative"><summary>Try a supported deterministic diagram instead</summary><fieldset className="visual-template-picker derived-visual-template-picker" disabled={busy || derivedShortDirty || derivedShortPublished}>
                    <legend>Choose the derived short-post explanatory shape</legend>
                    <label><input type="radio" name="derived-visual-template" checked={derivedVisualTemplate === "decision_fork"} onChange={() => setDerivedVisualTemplate("decision_fork")} /><span><b>Decision fork</b><small>One starting point, then two outcomes.</small></span></label>
                    <label><input type="radio" name="derived-visual-template" checked={derivedVisualTemplate === "contrast"} onChange={() => setDerivedVisualTemplate("contrast")} /><span><b>Iceberg contrast</b><small>Visible activity above operating maturity.</small></span></label>
                    <label><input type="radio" name="derived-visual-template" checked={derivedVisualTemplate === "vertical_path"} onChange={() => setDerivedVisualTemplate("vertical_path")} /><span><b>Vertical path</b><small>A compact upward progression.</small></span></label>
                    <label><input type="radio" name="derived-visual-template" checked={derivedVisualTemplate === "flow"} onChange={() => setDerivedVisualTemplate("flow")} /><span><b>Three-step flow</b><small>Connected stages when sequence is the point.</small></span></label>
                  </fieldset>{derivedVisualTemplate && <button disabled={busy || derivedShortDirty || derivedShortPublished} onClick={() => void createVisual({ operation: "recommend", format: "derived_short", placement: "lead", template: derivedVisualTemplate, authorDirection: idea.derivedShortVisualBrief?.authorDirection })}>Request selected derived short visual</button>}</details>
                </>
              ) : (
                <>
                  {visualCostDisclosure("derived short post")}
                  <button disabled={busy || derivedShortDirty || derivedShortPublished} onClick={() => void createVisual(
                    !idea.derivedShortVisualBrief
                      ? { operation: "recommend", format: "derived_short", placement: "lead", authorDirection: derivedVisualDirection.trim() || undefined }
                      : idea.derivedShortVisualBrief.status === "recommended"
                        ? { operation: "approve", format: "derived_short", briefId: idea.derivedShortVisualBrief.id }
                        : { operation: "render", format: "derived_short", briefId: idea.derivedShortVisualBrief.id },
                  )}>{!idea.derivedShortVisualBrief ? "Prepare derived short visual brief" : idea.derivedShortVisualBrief.status === "recommended" ? "Approve derived short visual brief" : "Render approved derived short visual"}</button>
                </>
              )
            ) : (
              <VisualFlow visual={idea.derivedShortVisualCompanion} actions={derivedShortVisualHasLinkedLead
                ? <>{visualCostDisclosure("derived short post")}<button className="refresh-visual" disabled={busy || derivedShortDirty || derivedShortPublished} onClick={() => void createVisual({ operation: "render", format: "derived_short", briefId: idea.derivedShortVisualBrief?.id })}>Refresh this visual</button></>
                : <p className="legacy-visual-note">Saved before visual briefs were introduced. This retained local asset is read-only and can still be downloaded.</p>} />
            )}
          </div>
        </details>
      )}
      {showDraft && (() => {
        const priorReviews = idea.reviewHistory.filter(
          (entry) =>
            entry.runId !== primaryReview?.runId &&
            entry.runId !== idea.derivedShortPostFinalReview?.runId &&
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
      {showDraft && primaryOutput && (
        outputsReadyForFinalize ? (
          <Link className="stage-primary-link" href={`/ideas/${idea.id}/publish`}>
            Continue to Finalize →
          </Link>
        ) : (
          <p className="stale-review-notice">
            {finalizeBlockedMessage}
          </p>
        )
      )}
      {showPublish && !primaryOutput && (
        <section className="stage-empty-state">
          <h3>There is no saved draft to publish.</h3>
          <p>Create and save a draft before completing the final voice check.</p>
          <Link className="stage-primary-link" href={`/ideas/${idea.id}/draft`}>Open Write →</Link>
        </section>
      )}
      {showPublish && primaryOutput && (
        <section className="finalize-panel">
          <div className="finalize-intro">
            <div>
              <p className="eyebrow">FINALIZE</p>
              <h3>Preview the exact saved version, then record it when it is live.</h3>
              <p>To change the words, return to Write. A saved revision makes this output’s review and voice check outdated.</p>
            </div>
            <Link className="return-to-write" href={`/ideas/${idea.id}/draft`}>← Return to Write</Link>
          </div>
          {renderFinalizeOutput(
            primaryFormat === "short" ? "Short post" : "Article",
            primaryFormat,
            primaryOutput,
          )}
          {includesDerivedShort && idea.derivedShortPost && !idea.derivedShortPost.stale && renderFinalizeOutput(
            "Derived short post",
            "derived_short",
            idea.derivedShortPost,
            `Derived from article version ${idea.derivedShortPost.sourceArticleVersion}.`,
          )}
          {includesDerivedShort && (!idea.derivedShortPost || idea.derivedShortPost.stale) && (
            <p className="stale-output">The derived short post is not current. Return to Editorial Board to generate a new matched pair.</p>
          )}
          {idea.visualCompanion && (
            <details className="visual-companion" open>
              <summary><span>Visual companion</span><small>Draft asset for this {primaryOutputLabel.toLowerCase()} version</small></summary>
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
          {idea.grounding.readerContract && <p className="grounded-note">Reader contract used: {idea.grounding.readerContract.outputShape.replaceAll("_", " ")} · {idea.grounding.readerContract.audienceProfile}{idea.grounding.readerContract.audienceNotes ? ` · ${idea.grounding.readerContract.audienceNotes}` : ""} · {idea.grounding.readerContract.longForm && `article ${idea.grounding.readerContract.longForm.min}–${idea.grounding.readerContract.longForm.max} words`} {idea.grounding.readerContract.shortForm && `short ${idea.grounding.readerContract.shortForm.min}–${idea.grounding.readerContract.shortForm.max} words`}</p>}
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
