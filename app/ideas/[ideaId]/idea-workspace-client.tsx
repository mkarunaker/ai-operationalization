"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { IdeaDetailView, type Detail } from "../../queue-client";
import { AppNav } from "../../app-nav";
import type { EditorialRunProgress } from "@/editorial/run-progress";
import { boardRoleStageStatus, derivedShortCreationStageStatus, primaryDraftCreationStageStatus, reconcileDerivedShortEditorState } from "@/editorial/board-status";

type VoiceCheck = {
  riskPercent: number;
  label: string;
  findings: Array<{ id: string; severity: string; message: string; suggestion: string }>;
  disclaimer: string;
  draftVersionId: string;
};
type LiveBoardQualityProfile = "balanced" | "frontier_content";

export function IdeaWorkspaceClient({
  ideaId,
  mode = "develop",
}: {
  ideaId: string;
  mode?: "develop" | "board" | "draft" | "publish";
}) {
  const router = useRouter();
  const [idea, setIdea] = useState<Detail>();
  const [livePreview, setLivePreview] = useState<{
    provider: string;
    model: string;
    tier: "low" | "medium" | "high";
    budgetCap: number;
    maximumBudgetCap: number;
    pricingAssumption: string;
    qualityProfile: { id: LiveBoardQualityProfile; label: string; description: string };
    available: boolean;
    source: { boardReady: boolean; unavailableReason?: string };
    estimatedCost: number;
    planned: Array<{ role: string; provider: string; model: string; tier: "low" | "medium" | "high"; maxOutputTokens?: number; reasoningEffort?: "low" }>;
    reviewerReruns: {
      medium: { provider: string; model: string; tier: "medium"; estimatedCost: number; available: boolean; maxOutputTokens: number; reasoningEffort: "low" };
      high: { provider: string; model: string; tier: "high"; estimatedCost: number; available: boolean; maxOutputTokens: number; reasoningEffort: "low" };
    };
    initialDrafterRecovery: { provider: string; model: string; tier: "low" | "medium" | "high"; estimatedCost: number; available: boolean; unavailableReason?: string; outcome?: "persisted_failure" | "unconfirmed" };
    derivedShortRefresh: { provider: string; model: string; tier: "low" | "medium" | "high"; estimatedCost: number; available: boolean };
    derivedShortEscalation: { provider: string; model: string; tier: "low" | "medium" | "high"; estimatedCost: number; available: boolean };
    proofreader?: { provider: string; model: string; tier: "low" | "medium" | "high"; estimates: { short: number; article: number; derived_short: number }; available: boolean };
  }>();
  const [liveQualityProfile, setLiveQualityProfile] = useState<LiveBoardQualityProfile>("balanced");
  // A response for a previously selected profile must never become the cost
  // disclosure for a newer selection. The Board action stays disabled until
  // the preview itself confirms the currently selected profile.
  const pendingLiveQualityProfile = useRef<LiveBoardQualityProfile>("balanced");
  const [note, setNote] = useState("");
  const [draft, setDraft] = useState("");
  const [derivedShortDraft, setDerivedShortDraft] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [editorialRunLabel, setEditorialRunLabel] = useState<string>();
  const [runStartedAt, setRunStartedAt] = useState<string>();
  const [runProgress, setRunProgress] = useState<EditorialRunProgress>();
  const [draftDirty, setDraftDirty] = useState(false);
  const [derivedShortDirty, setDerivedShortDirty] = useState(false);
  const [voiceChecks, setVoiceChecks] = useState<Partial<Record<"short" | "article" | "derived_short", VoiceCheck>>>({});
  // Develop is intentionally an explicit local save. Keep a compact snapshot
  // of the Board-relevant fields so moving to Board cannot accidentally leave
  // the author looking at a run made from older saved preferences.
  const savedDevelopmentSnapshot = useRef<string | undefined>(undefined);
  const draftEditorRef = useRef({ body: "", dirty: false });
  function developmentSnapshot(value: Detail) {
    return JSON.stringify({
      rawNotes: value.rawNotes,
      audienceProfileKey: value.audienceProfileKey ?? "professional",
      audienceNotes: value.audienceNotes ?? "",
      outputShape: value.outputShape,
      outputPreferences: value.outputPreferences ?? null,
      structuredIdeaBrief: value.structuredIdeaBrief ?? null,
    });
  }
  function hasUnsavedDevelopmentChanges(value: Detail) {
    return savedDevelopmentSnapshot.current !== developmentSnapshot(value) || Boolean(note.trim());
  }
  // A recovery response may arrive after the author begins typing. Refs keep
  // the async request path aligned with the editor's current state rather
  // than the state captured when the request started.
  const derivedShortEditorRef = useRef({ body: "", dirty: false });
  function setDerivedShortEditor(body: string, dirty: boolean) {
    derivedShortEditorRef.current = { body, dirty };
    setDerivedShortDraft(body);
    setDerivedShortDirty(dirty);
  }
  function setDraftEditor(body: string, dirty: boolean) {
    draftEditorRef.current = { body, dirty };
    setDraft(body);
    setDraftDirty(dirty);
  }
  async function load() {
    const [ideaResponse, previewResponse] = await Promise.all([
      fetch(`/api/ideas/${ideaId}`),
      fetch(`/api/ideas/${ideaId}?execution=live_preview&qualityProfile=${liveQualityProfile}`),
    ]);
    const ideaData = (await ideaResponse.json()) as {
      idea?: Detail;
      error?: string;
    };
    if (!ideaResponse.ok || !ideaData.idea)
      throw new Error(ideaData.error ?? "Idea not found.");
    setIdea(ideaData.idea);
    savedDevelopmentSnapshot.current = developmentSnapshot(ideaData.idea);
    if (previewResponse.ok) {
      const previewData = (await previewResponse.json()) as { preview?: typeof livePreview };
      if (previewData.preview?.qualityProfile.id === pendingLiveQualityProfile.current)
        setLivePreview(previewData.preview);
    }
    setDraftEditor((ideaData.idea.shortPost ?? ideaData.idea.article)?.body ?? "", false);
    setDerivedShortEditor(ideaData.idea.derivedShortPost?.body ?? "", false);
    setAnswers(
      Object.fromEntries(
        ideaData.idea.answers.map((answer) => [answer.question, answer.answer]),
      ),
    );
  }
  async function refreshLivePreview(profile: LiveBoardQualityProfile) {
    const response = await fetch(`/api/ideas/${ideaId}?execution=live_preview&qualityProfile=${profile}`);
    if (!response.ok) return;
    const data = (await response.json()) as { preview?: typeof livePreview };
    if (profile === pendingLiveQualityProfile.current && data.preview?.qualityProfile.id === profile)
      setLivePreview(data.preview);
  }
  function chooseLiveQualityProfile(profile: LiveBoardQualityProfile) {
    pendingLiveQualityProfile.current = profile;
    setLiveQualityProfile(profile);
    void refreshLivePreview(profile);
  }
  function terminalBoardProgress(nextIdea: Detail | undefined, stages: EditorialRunProgress["stages"]): EditorialRunProgress {
    const brief = nextIdea?.editorialBrief;
    const failures = new Set(brief?.runFailures.map((failure) => failure.role) ?? []);
    const includesDerivedShort = nextIdea?.outputShape === "long_with_derived_short";
    const interrupted = Boolean(brief?.interruptedAt);
    return {
      status: brief?.runStatus === "partially_completed" ? "partially_completed" : "failed",
      interrupted,
      stages: stages.map((stage) => {
        if (!brief) return { ...stage, status: stage.id === "context" ? "failed" : "not_run" };
        if (["strategist", "skeptic", "editor", "synthesizer"].includes(stage.id))
          return {
            ...stage,
            status: boardRoleStageStatus({
              role: stage.id as "strategist" | "skeptic" | "editor" | "synthesizer",
              attemptedRoles: brief.attemptedRoles,
              failedRoles: [...failures],
            }),
          };
        if (stage.id === "draft")
          return {
            ...stage,
            status: primaryDraftCreationStageStatus({
              generatedDraftVersionId: brief.generatedDraftVersionId,
              synthesizerFailed: failures.has("synthesizer"),
              initialDrafterFailed: failures.has("initial_drafter"),
            }),
          };
        if (stage.id === "derived_short")
          return {
            ...stage,
            status: derivedShortCreationStageStatus({
              includesDerivedShort,
              generatedDraftVersionId: brief.generatedDraftVersionId,
              generatedDerivedShortDraftVersionId: brief.generatedDerivedShortDraftVersionId,
              finalDrafterFailed: failures.has("final_drafter"),
            }) ?? "not_run",
          };
        return { ...stage, status: interrupted ? "failed" : "completed" };
      }),
    };
  }
  async function hydrateTerminalBoardFailure(
    stages: EditorialRunProgress["stages"],
    priorRunId?: string,
  ) {
    setRunProgress(terminalBoardProgress(undefined, stages));
    try {
      const response = await fetch(`/api/ideas/${ideaId}`);
      const data = (await response.json()) as { idea?: Detail };
      const nextBrief = data.idea?.editorialBrief;
      if (!response.ok || !data.idea || !nextBrief || nextBrief.runId === priorRunId || nextBrief.runStatus !== "failed") return;
      setIdea(data.idea);
      setRunProgress(terminalBoardProgress(data.idea, stages));
    } catch {
      // The local fallback above is terminal and intentionally safe if a
      // follow-up read cannot complete.
    }
  }
  async function hydrateRecoveryFailure(
    stages: EditorialRunProgress["stages"],
    priorRecoveryId?: string,
  ) {
    try {
      const response = await fetch(`/api/ideas/${ideaId}`);
      const data = (await response.json()) as { idea?: Detail };
      const recovery = data.idea?.derivedShortRecovery;
      const persistedProviderFailure = Boolean(
        response.ok
          && data.idea
          && recovery?.status === "failed"
          && recovery.id !== priorRecoveryId,
      );
      if (data.idea) setIdea(data.idea);
      if (persistedProviderFailure) {
        setRunProgress({
          kind: "derived_short_recovery",
          recoveryFailure: "persisted_provider_failure",
          status: "failed",
          stages: stages.map((stage) => ({
            ...stage,
            label: stage.id === "provenance" ? "Save failure provenance" : stage.label,
            status: stage.id === "derived_short" ? "failed" : "completed",
          })),
        });
        return;
      }
    } catch {
      // Fall through to the safe, non-persistent rejection state below.
    }
    setRunProgress({
      kind: "derived_short_recovery",
      recoveryFailure: "pre_dispatch_rejection",
      status: "failed",
      stages: stages.map((stage) => ({
        ...stage,
        label: stage.id === "context" ? "Validate recovery route and budget" : stage.label,
        status: stage.id === "context" ? "failed" : "not_run",
      })),
    });
  }
  async function hydrateInitialDrafterRecoveryFailure(
    stages: EditorialRunProgress["stages"],
    error: unknown,
  ) {
    try {
      const [ideaResponse, previewResponse] = await Promise.all([
        fetch(`/api/ideas/${ideaId}`),
        fetch(`/api/ideas/${ideaId}?execution=live_preview`),
      ]);
      const ideaData = (await ideaResponse.json()) as { idea?: Detail };
      const previewData = (await previewResponse.json()) as { preview?: typeof livePreview };
      if (ideaData.idea) setIdea(ideaData.idea);
      if (previewData.preview) setLivePreview(previewData.preview);
      const retryWasConsumed = Boolean(
        ideaResponse.ok
          && ideaData.idea?.editorialBrief?.runStatus === "failed"
          && !ideaData.idea.editorialBrief.generatedDraftVersionId
          && previewData.preview?.initialDrafterRecovery.available === false
          && previewData.preview.initialDrafterRecovery.unavailableReason?.startsWith("Only one working-draft retry"),
      );
      if (retryWasConsumed && previewData.preview?.initialDrafterRecovery.outcome === "persisted_failure") {
        setRunProgress({
          kind: "initial_drafter_recovery",
          recoveryFailure: "persisted_provider_failure",
          status: "failed",
          stages: stages.map((stage) => ({
            ...stage,
            label: stage.id === "provenance" ? "Save failure provenance" : stage.label,
            status: stage.id === "draft" ? "failed" : "completed",
          })),
        });
        return;
      }
      if (retryWasConsumed && previewData.preview?.initialDrafterRecovery.outcome === "unconfirmed") {
        setRunProgress({
          kind: "initial_drafter_recovery",
          recoveryFailure: "outcome_unconfirmed",
          status: "failed",
          stages: stages.map((stage) => ({
            ...stage,
            label: stage.id === "provenance" ? "Confirm saved recovery outcome" : stage.label,
            status: stage.id === "context" ? "completed" : stage.id === "draft" ? "failed" : "not_run",
          })),
        });
        return;
      }
    } catch {
      // Fall through to the safe, non-persistent rejection state below.
    }
    setRunProgress({
      kind: "initial_drafter_recovery",
      recoveryFailure: "pre_dispatch_rejection",
      recoveryRejectionReason: safeInitialDrafterRecoveryRejection(error),
      status: "failed",
      stages: stages.map((stage) => ({
        ...stage,
        label: stage.id === "context" ? "Validate saved recovery inputs, route, and budget" : stage.label,
        status: stage.id === "context" ? "failed" : "not_run",
      })),
    });
  }
  function safeInitialDrafterRecoveryRejection(error: unknown) {
    const message = error instanceof Error ? error.message : "";
    if (/^(A positive per-run budget cap is required for the working-draft retry\.|The working-draft retry cap cannot exceed \$|Working-draft recovery must use the configured Initial Drafter route and pricing assumption\.|Only one working-draft retry is permitted for a saved Editorial Board run\.|The saved voice reference (is unavailable|has changed)|The configured Initial Drafter route has changed since this Board run\.|The saved Editorial Board (recovery snapshot is invalid|synthesis is unavailable)\.)/.test(message))
      return message;
    return "This recovery was rejected before provider dispatch. Confirm the saved Board route, source references, and retry cap before starting a new Board run.";
  }
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load().catch((error: unknown) =>
        setMessage(
          error instanceof Error ? error.message : "Idea could not be loaded.",
        ),
      );
    }, 0);
    return () => window.clearTimeout(timer); // Load the selected local record once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ideaId]);
  useEffect(() => {
    if (!editorialRunLabel || !runStartedAt) return;
    let cancelled = false;
    async function poll() {
      try {
        const response = await fetch(
          `/api/ideas/${ideaId}?execution=live_status&since=${encodeURIComponent(runStartedAt!)}`,
        );
        const data = (await response.json()) as { progress?: EditorialRunProgress };
        if (!cancelled && response.ok && data.progress) setRunProgress(data.progress);
      } catch {
        // The main request remains authoritative; a missed progress poll is non-fatal.
      }
    }
    void poll();
    const interval = window.setInterval(() => void poll(), 900);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [editorialRunLabel, ideaId, runStartedAt]);
  useEffect(() => {
    if (!editorialRunLabel) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    const guardInternalNavigation = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest("a[href]") as HTMLAnchorElement | null;
      if (!link || link.target === "_blank" || !link.href.startsWith(window.location.origin)) return;
      event.preventDefault();
      setMessage("Keep this page open until the active request finishes. Leaving, reloading, or using Back can interrupt this request-bound run.");
    };
    // App Router history transitions need their own guard: they can stay in
    // the document and therefore do not reliably trigger beforeunload.
    const originalState = window.history.state;
    window.history.pushState({ ...originalState, aebActiveRequestGuard: true }, "", window.location.href);
    const guardHistoryNavigation = () => {
      window.history.go(1);
      setMessage("Keep this page open until the active request finishes. Leaving, reloading, or using Back can interrupt this request-bound run.");
    };
    window.addEventListener("beforeunload", warn);
    window.addEventListener("click", guardInternalNavigation, true);
    window.addEventListener("popstate", guardHistoryNavigation);
    return () => {
      window.removeEventListener("beforeunload", warn);
      window.removeEventListener("click", guardInternalNavigation, true);
      window.removeEventListener("popstate", guardHistoryNavigation);
      if (window.history.state?.aebActiveRequestGuard) window.history.back();
    };
  }, [editorialRunLabel]);
  async function request(body: unknown, options: { reconcile?: boolean } = {}) {
    const response = await fetch(`/api/ideas/${ideaId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await response.json()) as { idea?: Detail; error?: string };
    if (!response.ok || !data.idea)
      throw new Error(data.error ?? "The idea could not be saved.");
    if (options.reconcile === false) return data.idea;
    setIdea(data.idea);
    savedDevelopmentSnapshot.current = developmentSnapshot(data.idea);
    const action =
      typeof body === "object" && body !== null && "action" in body
        ? String(body.action)
        : undefined;
    const replacesPrimaryDraft = [
      "run_board",
      "run_grounded_board",
      "run_live_board",
      "save_draft",
    ].includes(action ?? "") ||
      (action === "run_final_review" && body !== null && typeof body === "object" && (body as { format?: string }).format !== "derived_short") ||
      (action === "publish" && body !== null && typeof body === "object" && (body as { draftFormat?: string }).draftFormat !== "derived_short");
    if (!draftDirty || replacesPrimaryDraft) {
      setDraftEditor((data.idea.shortPost ?? data.idea.article)?.body ?? "", false);
    }
    const nextDerivedShortEditor = reconcileDerivedShortEditorState({
      action,
      hasUnsavedEdits: derivedShortEditorRef.current.dirty,
      currentBody: derivedShortEditorRef.current.body,
      returnedBody: data.idea.derivedShortPost?.body,
    });
    if (nextDerivedShortEditor.replaced) {
      setDerivedShortEditor(nextDerivedShortEditor.body, nextDerivedShortEditor.dirty);
    }
    return data.idea;
  }
  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (!idea)
    return (
      <main className="queue-shell">
        <AppNav />
        <section className="idea-workspace-shell">
          <Link className="back-link" href="/">
            ← Idea queue
          </Link>
          <p className="notice">{message || "Loading saved idea…"}</p>
        </section>
      </main>
    );
  const stageLabels = {
    develop: "Develop",
    board: "Editorial Board",
    draft: "Write",
    publish: "Finalize",
  } as const;
  const stageHeadings = {
    develop: "Develop the thinking, then the words.",
    board: "Review the thinking before shaping the draft.",
    draft: "Write, review, and prepare each publication output.",
    publish: "Confirm the exact versions and record publication.",
  } as const;
  const stageLinks = [
    { id: "develop", label: "Develop", href: `/ideas/${ideaId}`, state: "Idea and notes" },
    {
      id: "board",
      label: "Editorial Board",
      href: `/ideas/${ideaId}/board`,
      state: idea.editorialBrief
        ? idea.editorialBrief.runStatus === "failed" || idea.editorialBrief.runStatus === "partially_completed"
          ? "Review incomplete"
          : "Review complete"
        : "Ready to run",
    },
    {
      id: "draft",
      label: "Write",
      href: `/ideas/${ideaId}/draft`,
      state: (idea.shortPost ?? idea.article) ? `Version ${(idea.shortPost ?? idea.article)!.version}` : "Not created",
    },
    {
      id: "publish",
      label: "Finalize",
      href: `/ideas/${ideaId}/publish`,
      state: (() => {
        const outputIds = [idea.shortPost?.id, idea.article?.id, idea.derivedShortPost?.id].filter(Boolean) as string[];
        const published = outputIds.filter((id) => idea.publications.some((publication) => publication.draftVersionId === id)).length;
        return published ? `${published} of ${outputIds.length} published` : "Final check";
      })(),
    },
  ] as const;
  async function checkVoice(format: "short" | "article" | "derived_short") {
    if (!idea) throw new Error("Idea is still loading.");
    const output = format === "derived_short" ? idea.derivedShortPost : format === "article" ? idea.article : idea.shortPost;
    if (!output) throw new Error("Save this output before running the final voice check.");
    if (idea.publications.some((publication) => publication.draftVersionId === output.id))
      throw new Error("This published output is read-only. Create a new revision before running another voice check.");
    await run(async () => {
      const response = await fetch("/api/voice-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaId, draftVersionId: output.id, format }),
      });
      const data = (await response.json()) as Omit<VoiceCheck, "draftVersionId"> & {
        error?: string;
      };
      if (!response.ok || !data)
        throw new Error(data.error ?? "The final voice check failed.");
      setVoiceChecks((current) => ({ ...current, [format]: { ...data, draftVersionId: output.id } }));
      setMessage(
        "Final human-voice check complete. Review the flagged patterns before publishing.",
      );
    });
  }
  return (
    <main className="queue-shell">
      <AppNav />
      <section className="idea-workspace-shell">
        <header className="idea-workspace-header">
          <p className="breadcrumbs">
            <Link href="/">Ideas</Link>
            <span>/</span>
            {mode !== "develop" ? (
              <>
                <Link href={`/ideas/${ideaId}`}>{idea.title}</Link>
                <span>/</span>
                <strong>{stageLabels[mode]}</strong>
              </>
            ) : (
              <strong>{idea.title}</strong>
            )}
          </p>
          <div>
            <p className="eyebrow">
              {mode === "develop" ? "Idea workspace" : stageLabels[mode]}
            </p>
            <h1>{stageHeadings[mode]}</h1>
          </div>
        </header>
        <nav className="idea-stage-nav" aria-label="Idea workflow stages">
          {stageLinks.map((stage, index) => (
            <Link
              key={stage.id}
              href={stage.href}
              className={mode === stage.id ? "idea-stage active" : "idea-stage"}
              aria-current={mode === stage.id ? "step" : undefined}
            >
              <span>{index + 1}</span>
              <strong>{stage.label}</strong>
              <small>{stage.state}</small>
            </Link>
          ))}
        </nav>
        {message && (
          <p className="notice" role="status">
            {message}
          </p>
        )}
        <section className="detail-panel">
          <IdeaDetailView
            idea={idea}
            note={note}
            setNote={setNote}
            setSelected={setIdea}
            busy={busy}
            startDeveloping={() =>
              run(async () => {
                await request({ status: "developing" });
                setMessage(
                  "Your original capture is enough to start. Add anything else only if it helps.",
                );
              })
            }
            deleteIdea={() =>
              run(async () => {
                if (!window.confirm("Delete this unpublished idea and its local drafts, reviews, and notes? This cannot be undone.")) return;
                const response = await fetch(`/api/ideas/${ideaId}`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "delete_idea" }),
                });
                const data = (await response.json()) as { deleted?: boolean; error?: string };
                if (!response.ok || !data.deleted) throw new Error(data.error ?? "The idea could not be deleted.");
                router.push("/");
              })
            }
            saveDetails={(event: FormEvent) => {
              event.preventDefault();
              return run(async () => {
                await request({
                  title: idea.title,
                  ...(idea.structuredIdeaBrief?.principle ? {} : { rawNotes: idea.rawNotes }),
                  outputShape: idea.outputShape,
                  audienceProfileKey: idea.audienceProfileKey,
                  audienceNotes: idea.audienceNotes ?? null,
                  outputPreferences: idea.outputPreferences,
                  note: note || undefined,
                  structuredIdeaBrief: idea.structuredIdeaBrief ?? {},
                });
                setNote("");
                setMessage("Details saved locally.");
              });
            }}
            answers={answers}
            setAnswers={setAnswers}
            finishDevelopment={(best) =>
              run(async () => {
                await request({
                  action: "develop",
                  useBestJudgment: best,
                  answers: idea.questions.map((question) => ({
                    question,
                    answer: answers[question] ?? "",
                    choice: best
                      ? "best_judgment"
                      : answers[question]?.trim()
                        ? "answered"
                        : "skipped",
                  })),
                });
                setMessage("Idea is ready for editorial review.");
              })
            }
            createGroundedDraft={() =>
              run(async () => {
                const brief = idea.structuredIdeaBrief;
                const templateStarted = Boolean(brief && Object.values(brief).some((value) => Boolean(value?.trim())));
                const missing = templateStarted
                  ? [
                    !brief?.situation?.trim() ? "Situation" : undefined,
                    !brief?.assumption?.trim() ? "Assumption" : undefined,
                    !brief?.discovery?.trim() ? "Discovery" : undefined,
                    !brief?.principle?.trim() ? "Principle" : undefined,
                  ].filter((value): value is string => Boolean(value))
                  : [];
                if (missing.length) {
                  setMessage(`Before the Editorial Board runs, answer these narrative-template questions: ${missing.join(", ")}.`);
                  return;
                }
                if (hasUnsavedDevelopmentChanges(idea)) {
                  const saveBeforeBoard = window.confirm(
                    "You have unsaved Develop changes. The Editorial Board can use only saved audience, output shape, ranges, and notes.\n\nSelect OK to save these changes and continue to the Editorial Board. Select Cancel to stay here.",
                  );
                  if (!saveBeforeBoard) {
                    setMessage("Your Develop changes have not been saved. Save them before continuing to the Editorial Board.");
                    return;
                  }
                  await request({
                    title: idea.title,
                    ...(idea.structuredIdeaBrief?.principle ? {} : { rawNotes: idea.rawNotes }),
                    outputShape: idea.outputShape,
                    audienceProfileKey: idea.audienceProfileKey,
                    audienceNotes: idea.audienceNotes ?? null,
                    outputPreferences: idea.outputPreferences,
                    note: note || undefined,
                    structuredIdeaBrief: idea.structuredIdeaBrief ?? {},
                  });
                  setNote("");
                }
                await request({ action: "prepare_editorial_review" });
                router.push(`/ideas/${ideaId}/board`);
              })
            }
            board={() =>
              run(async () => {
                // Deterministic execution does not emit live provider events.
                // Show a separate local execution status without polling the
                // live-provider endpoint or implying private model reasoning.
                const includesDerivedShort = idea.outputShape === "long_with_derived_short";
                const deterministicStages: EditorialRunProgress["stages"] = [
                  { id: "context", label: "Prepare bounded idea and BOK context", status: "running" },
                  { id: "strategist", label: "Strategist review", status: "waiting" },
                  { id: "skeptic", label: "Skeptic review", status: "waiting" },
                  { id: "editor", label: "Editor review", status: "waiting" },
                  { id: "synthesizer", label: "Synthesize the editorial brief", status: "waiting" },
                  { id: "draft", label: "Create the voice-aligned working draft", status: "waiting" },
                  ...(includesDerivedShort ? [{ id: "derived_short" as const, label: "Create derived short post", status: "waiting" as const }] : []),
                  { id: "provenance", label: "Save provenance, usage, latency, and cost", status: "waiting" },
                ];
                setRunProgress({ status: "running", stages: deterministicStages });
                setEditorialRunLabel("Running free deterministic Board test · $0.00 · no provider call");
                setMessage("Keep this page open until this request-bound Board run finishes. Reloading, closing the tab, using Back, or navigating away can interrupt it.");
                const priorRunId = idea.editorialBrief?.runId;
                try {
                  const updated = await request({ action: "run_grounded_board" });
                  const failedRoles = new Set(updated.editorialBrief?.reviews.filter((review) => review.status === "failed").map((review) => review.role) ?? []);
                  setRunProgress({
                    status: updated.editorialBrief?.runStatus === "partially_completed" ? "partially_completed" : "completed",
                    stages: deterministicStages.map((stage) => ({
                      ...stage,
                      status: failedRoles.has(stage.id) || (stage.id === "derived_short" && includesDerivedShort && !updated.derivedShortPost)
                        ? "failed"
                        : "completed",
                    })),
                  });
                  setMessage(updated.editorialBrief?.runStatus === "partially_completed"
                    ? "The deterministic Board run completed incompletely. The failed role and safe reason are shown in the Editorial Brief."
                    : "Grounded editorial brief and working draft created. Source provenance is available below.");
                } catch (error) {
                  await hydrateTerminalBoardFailure(deterministicStages, priorRunId);
                  throw error;
                } finally {
                  setEditorialRunLabel(undefined);
                }
              })
            }
            livePreview={livePreview}
            liveQualityProfile={liveQualityProfile}
            setLiveQualityProfile={chooseLiveQualityProfile}
            executionStatus={editorialRunLabel}
            executionProgress={runProgress}
            liveBoard={(budgetCap, qualityProfile) =>
              run(async () => {
                const startedAt = new Date().toISOString();
                const priorRunId = idea.editorialBrief?.runId;
                const liveStages: EditorialRunProgress["stages"] = [
                  { id: "context", label: "Prepare bounded idea and BOK context", status: "running" },
                  { id: "strategist", label: "Strategist review", status: "waiting" },
                  { id: "skeptic", label: "Skeptic review", status: "waiting" },
                  { id: "editor", label: "Editor review", status: "waiting" },
                  { id: "synthesizer", label: "Synthesize the editorial brief", status: "waiting" },
                  { id: "draft", label: "Create the voice-aligned working draft", status: "waiting" },
                  ...(idea.outputShape === "long_with_derived_short"
                    ? [{ id: "derived_short" as const, label: "Create derived short post", status: "waiting" as const }]
                    : []),
                  { id: "provenance", label: "Save provenance, usage, latency, and cost", status: "waiting" },
                ];
                setRunStartedAt(startedAt);
                setRunProgress(undefined);
                setEditorialRunLabel("Running the live Editorial Board");
                setMessage("Keep this page open until this request-bound live Board run finishes. Reloading, closing the tab, using Back, or navigating away can interrupt it.");
                try {
                  const updated = await request({ action: "run_live_board", budgetCap, qualityProfile });
                  const statusResponse = await fetch(`/api/ideas/${ideaId}?execution=live_status&since=${encodeURIComponent(startedAt)}`);
                  const statusData = (await statusResponse.json()) as { progress?: EditorialRunProgress };
                  if (statusResponse.ok && statusData.progress) setRunProgress(statusData.progress);
                  setMessage(updated.editorialBrief?.runStatus === "partially_completed"
                    ? "The live Board run completed incompletely. The failed role and safe reason are shown in the Editorial Brief."
                    : "Live editorial brief and working draft created. Provider, model, usage, and cost assumptions are saved in provenance.");
                } catch (error) {
                  await hydrateTerminalBoardFailure(liveStages, priorRunId);
                  throw error;
                } finally {
                  setEditorialRunLabel(undefined);
                  setRunStartedAt(undefined);
                }
              })
            }
            retryDerivedShort={(budgetCap, mode) =>
              run(async () => {
                const retryStages: EditorialRunProgress["stages"] = [
                  { id: "context", label: "Load the saved article and voice reference", status: "running" },
                  { id: "derived_short", label: "Create derived short post", status: "waiting" },
                  { id: "provenance", label: "Save derived-output provenance", status: "waiting" },
                ];
                const priorRecoveryId = idea.derivedShortRecovery?.id;
                setRunProgress({ kind: "derived_short_recovery", status: "running", stages: retryStages });
                setEditorialRunLabel(mode === "refresh" ? "Refreshing only the derived short post" : mode === "escalation" ? "Escalating only the derived short post" : "Retrying only the derived short post");
                try {
                  await request({
                    action: mode === "refresh" ? "refresh_live_derived_short" : mode === "escalation" ? "escalate_live_derived_short" : "retry_live_derived_short",
                    budgetCap,
                    escalationReason: mode === "escalation" ? "Author explicitly selected a medium-tier derived-short recovery after a failed lower-cost attempt." : undefined,
                  });
                  setRunProgress({
                    kind: "derived_short_recovery",
                    status: "completed",
                    stages: retryStages.map((stage) => ({ ...stage, status: "completed" })),
                  });
                  setMessage(mode === "refresh" ? "Derived short post refreshed from the saved article. The Board review remains unchanged." : "Derived short post created from the saved article. The prior Board review remains unchanged.");
                } catch (error) {
                  await hydrateRecoveryFailure(retryStages, priorRecoveryId);
                  throw error;
                } finally {
                  setEditorialRunLabel(undefined);
                }
              })
            }
            retryInitialDrafter={(budgetCap) =>
              run(async () => {
                const retryStages: EditorialRunProgress["stages"] = [
                  { id: "context", label: "Load the saved Board synthesis and source selection", status: "running" },
                  { id: "draft", label: "Create the voice-aligned working draft", status: "waiting" },
                  { id: "provenance", label: "Save working-draft provenance", status: "waiting" },
                ];
                setRunProgress({ kind: "initial_drafter_recovery", status: "running", stages: retryStages });
                setEditorialRunLabel("Retrying only the working-draft stage");
                try {
                  await request({ action: "retry_live_initial_drafter", budgetCap });
                  setRunProgress({
                    kind: "initial_drafter_recovery",
                    status: "completed",
                    stages: retryStages.map((stage) => ({ ...stage, status: "completed" })),
                  });
                  setMessage("Working draft created from the saved Board synthesis. The original failed attempt remains in provenance; reviews and synthesis were not rerun.");
                } catch (error) {
                  await hydrateInitialDrafterRecoveryFailure(retryStages, error);
                  throw error;
                } finally {
                  setEditorialRunLabel(undefined);
                }
              })
            }
            rerunReviewer={(role, budgetCap, tier) =>
              run(async () => {
                setEditorialRunLabel(`Rerunning only the ${role} review`);
                try {
                  await request({
                    action: "rerun_live_reviewer",
                    role,
                    tier,
                    budgetCap,
                    confirmHighTier: tier === "high",
                    escalationReason: `User explicitly selected a ${tier}-tier rerun for the ${role} review.`,
                  });
                  setMessage(`Only the ${role} review was rerun at the ${tier} tier. The original Board run and draft remain unchanged.`);
                } finally {
                  setEditorialRunLabel(undefined);
                }
              })
            }
            finalReview={(format) =>
              run(async () => {
                const output = format === "derived_short" ? idea.derivedShortPost : format === "article" ? idea.article : idea.shortPost;
                if (!output) throw new Error("Save this output before running its review.");
                const useLiveProofread = Boolean(livePreview?.proofreader?.available);
                const reviewed = await request({ action: "run_final_review", body: output.body, format, draftVersionId: output.id, proofreadMode: useLiveProofread ? "live_required" : "deterministic" }, { reconcile: !useLiveProofread });
                if (useLiveProofread) {
                  try {
                    await request({ action: "run_live_proofread", format, draftVersionId: output.id, budgetCap: livePreview?.budgetCap });
                  } catch (error) {
                    await load();
                    throw error;
                  }
                } else {
                  setIdea(reviewed);
                }
                setMessage(
                  useLiveProofread ? "Combined editorial review and low-cost proofread saved for this exact version." : "Draft review saved locally. Configure the proofreader route to add the low-cost proofread.",
                );
              })
            }
            setReviewFindingDisposition={(reviewRunId, findingId, disposition) =>
              run(async () => {
                await request({ action: "set_review_finding_disposition", reviewRunId, findingId, disposition });
                setMessage("Your proofread decision was saved locally.");
              })
            }
            setRecommendationDisposition={(recommendation, disposition) =>
              run(async () => {
                const sourceReviewRunId = idea.editorialBrief?.runId;
                if (!sourceReviewRunId) throw new Error("The original Editorial Board review is unavailable.");
                await request({ action: "set_recommendation_disposition", sourceReviewRunId, recommendation, disposition });
                setMessage("Your recommendation decision was saved locally.");
              })
            }
            setEscalationOutcome={(modelCallId, outcome) =>
              run(async () => {
                await request({ action: "set_escalation_outcome", modelCallId, ...outcome });
                setMessage("Your escalation assessment was saved locally.");
              })
            }
            draft={draft}
            setDraft={(body) => setDraftEditor(body, draftEditorRef.current.dirty)}
            saveDraft={() =>
              run(async () => {
                const saved = await request({ action: "save_draft", body: draftEditorRef.current.body });
                setDraftEditor((saved.shortPost ?? saved.article)?.body ?? draftEditorRef.current.body, false);
                setMessage("Draft version saved locally.");
              })
            }
            publish={(event, format, channel, output) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              return run(async () => {
                const publishedAt = String(form.get("publishedAt") ?? "").trim();
                await request({
                  action: "publish",
                  channel,
                  url: form.get("url"),
                  publishedAt: publishedAt ? new Date(publishedAt).toISOString() : undefined,
                  finalText: output.body,
                  draftVersionId: output.id,
                  draftFormat: format,
                  voiceCheckAcknowledged: voiceChecks[format]?.draftVersionId === output.id,
                });
                setMessage("Published record saved locally.");
              });
            }}
            request={request}
            showDevelopment={mode === "develop"}
            showBoard={mode === "board"}
            showDraft={mode === "draft"}
            showPublish={mode === "publish"}
            showProvenance={mode === "board"}
            compactCapture
            showPriority={mode === "develop"}
            reviewHref={mode === "develop" ? `/ideas/${ideaId}/board` : undefined}
            voiceChecks={voiceChecks}
            checkVoice={checkVoice}
            createVisual={(visualAction) =>
              run(async () => {
                if (visualAction.operation === "recommend") {
                  await request({ action: "recommend_visual_brief", template: visualAction.template, placement: visualAction.placement, format: visualAction.format, authorDirection: visualAction.authorDirection, customIllustration: visualAction.customIllustration });
                  setMessage(visualAction.customIllustration
                    ? "Custom visual brief saved. Review the article-grounded concept, then approve its one paid image request."
                    : "Visual brief saved. Review the rationale, then approve it before rendering.");
                } else if (visualAction.operation === "start_revision") {
                  await request({ action: "start_visual_lead_revision", template: visualAction.template, format: visualAction.format, authorDirection: visualAction.authorDirection, customIllustration: visualAction.customIllustration });
                  setMessage(visualAction.customIllustration
                    ? "Custom visual brief saved as a new version. The current rendered visual remains active until this illustration is generated."
                    : "A new visual version is ready to review. The current rendered version remains active until this one is rendered.");
                } else if (visualAction.operation === "select_revision" && visualAction.briefId) {
                  await request({ action: "select_visual_lead_revision", briefId: visualAction.briefId, format: visualAction.format });
                  setMessage("Selected visual version is now active for this exact saved output.");
                } else if (visualAction.operation === "dismiss" && visualAction.briefId) {
                  await request({ action: "dismiss_visual_brief", briefId: visualAction.briefId });
                  setMessage("The unrendered visual concept was retained as dismissed history. Your active visual is unchanged.");
                } else if (visualAction.operation === "approve" && visualAction.briefId) {
                  await request({ action: "approve_visual_brief", briefId: visualAction.briefId });
                  setMessage("Visual brief approved for this exact saved output. Render when ready.");
                } else if (visualAction.operation === "render_custom" && visualAction.briefId) {
                  await request({ action: "create_custom_visual_illustration", briefId: visualAction.briefId, format: visualAction.format });
                  setMessage("Custom editorial illustration saved locally for this exact output.");
                } else {
                  await request({ action: "create_visual_companion", briefId: visualAction.briefId, format: visualAction.format });
                  setMessage("Visual companion saved locally for this draft version.");
                }
              })
            }
            updateVisualBrief={(input) => run(async () => {
              await request({ action: "update_visual_brief", ...input });
              setMessage("Visual brief edits saved for this exact output.");
            })}
            updateCustomVisualConcept={(briefId, authorDirection) => run(async () => {
              await request({ action: "update_custom_visual_concept", briefId, authorDirection });
              setMessage("Custom concept revision saved. No image has been approved or generated.");
            })}
            derivedShortDraft={derivedShortDraft}
            setDerivedShortDraft={(body) => {
              derivedShortEditorRef.current = { ...derivedShortEditorRef.current, body };
              setDerivedShortDraft(body);
            }}
            saveDerivedShort={() =>
              run(async () => {
                await request({ action: "save_derived_short", body: derivedShortDraft });
                setDerivedShortEditor(derivedShortEditorRef.current.body, false);
                setMessage("Derived short-post version saved locally. Review it when useful, then continue to Finalize.");
              })
            }
            draftDirty={draftDirty}
            onDraftChange={(body) => {
              setVoiceChecks((current) => {
                const next = { ...current };
                delete next[idea.outputShape === "short" ? "short" : "article"];
                return next;
              });
              setDraftEditor(body, true);
            }}
            derivedShortDirty={derivedShortDirty}
            onDerivedShortChange={() => {
              setVoiceChecks((current) => {
                const next = { ...current };
                delete next.derived_short;
                return next;
              });
              derivedShortEditorRef.current = { ...derivedShortEditorRef.current, dirty: true };
              setDerivedShortDirty(true);
            }}
            saveProvidedResearch={(research) =>
              run(async () => {
                await request({ action: "save_provided_research", mode: "provided", ...research });
                setMessage("Research and evidence saved locally. It remains separate from your interpretation.");
              })
            }
            createApplicationResearchBrief={(research) =>
              run(async () => {
                await request({ action: "create_application_research_brief", mode: "application", explicitlyRequested: true, ...research });
                setMessage("Bounded research brief saved locally. Add sources when you are ready; no web search was run.");
              })
            }
          />
        </section>
      </section>
    </main>
  );
}
