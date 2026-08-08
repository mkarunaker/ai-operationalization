"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { IdeaDetailView, type Detail, type Theme } from "../../queue-client";
import { AppNav } from "../../app-nav";
import type { EditorialRunProgress } from "@/editorial/run-progress";

type VoiceCheck = {
  riskPercent: number;
  label: string;
  findings: Array<{ id: string; severity: string; message: string; suggestion: string }>;
  disclaimer: string;
  draftVersionId: string;
};

export function IdeaWorkspaceClient({
  ideaId,
  mode = "develop",
}: {
  ideaId: string;
  mode?: "develop" | "board" | "draft" | "publish";
}) {
  const router = useRouter();
  const [idea, setIdea] = useState<Detail>();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [livePreview, setLivePreview] = useState<{
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
  }>();
  const [note, setNote] = useState("");
  const [draft, setDraft] = useState("");
  const [companionDraft, setCompanionDraft] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [editorialRunLabel, setEditorialRunLabel] = useState<string>();
  const [runStartedAt, setRunStartedAt] = useState<string>();
  const [runProgress, setRunProgress] = useState<EditorialRunProgress>();
  const [draftDirty, setDraftDirty] = useState(false);
  const [companionDirty, setCompanionDirty] = useState(false);
  const [voiceChecks, setVoiceChecks] = useState<Partial<Record<"linkedin" | "canonical" | "linkedin_companion", VoiceCheck>>>({});
  async function load() {
    const [ideaResponse, listResponse, previewResponse] = await Promise.all([
      fetch(`/api/ideas/${ideaId}`),
      fetch("/api/ideas"),
      fetch(`/api/ideas/${ideaId}?execution=live_preview`),
    ]);
    const ideaData = (await ideaResponse.json()) as {
      idea?: Detail;
      error?: string;
    };
    const listData = (await listResponse.json()) as { themes: Theme[] };
    if (!ideaResponse.ok || !ideaData.idea)
      throw new Error(ideaData.error ?? "Idea not found.");
    setIdea(ideaData.idea);
    setThemes(listData.themes);
    if (previewResponse.ok) {
      const previewData = (await previewResponse.json()) as { preview?: typeof livePreview };
      if (previewData.preview) setLivePreview(previewData.preview);
    }
    setDraft(ideaData.idea.draft?.body ?? "");
    setCompanionDraft(ideaData.idea.linkedinCompanion?.body ?? "");
    setDraftDirty(false);
    setCompanionDirty(false);
    setAnswers(
      Object.fromEntries(
        ideaData.idea.answers.map((answer) => [answer.question, answer.answer]),
      ),
    );
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
  async function request(body: unknown) {
    const response = await fetch(`/api/ideas/${ideaId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await response.json()) as { idea?: Detail; error?: string };
    if (!response.ok || !data.idea)
      throw new Error(data.error ?? "The idea could not be saved.");
    setIdea(data.idea);
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
      (action === "run_final_review" && body !== null && typeof body === "object" && (body as { format?: string }).format !== "linkedin_companion") ||
      (action === "publish" && body !== null && typeof body === "object" && (body as { draftFormat?: string }).draftFormat !== "linkedin_companion");
    if (!draftDirty || replacesPrimaryDraft) {
      setDraft(data.idea.draft?.body ?? "");
      setDraftDirty(false);
    }
    if (["create_linkedin_companion", "save_linkedin_companion"].includes(action ?? ""))
      setCompanionDraft(data.idea.linkedinCompanion?.body ?? "");
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
        ? idea.editorialBrief.runStatus === "partially_completed" ? "Review incomplete" : "Review complete"
        : "Ready to run",
    },
    {
      id: "draft",
      label: "Write",
      href: `/ideas/${ideaId}/draft`,
      state: idea.draft ? `Version ${idea.draft.version}` : "Not created",
    },
    {
      id: "publish",
      label: "Finalize",
      href: `/ideas/${ideaId}/publish`,
      state: (() => {
        const outputIds = [idea.draft?.id, idea.linkedinCompanion?.id].filter(Boolean) as string[];
        const published = outputIds.filter((id) => idea.publications.some((publication) => publication.draftVersionId === id)).length;
        return published ? `${published} of ${outputIds.length} published` : "Final check";
      })(),
    },
  ] as const;
  async function checkVoice(format: "linkedin" | "canonical" | "linkedin_companion") {
    if (!idea) throw new Error("Idea is still loading.");
    const output = format === "linkedin_companion" ? idea.linkedinCompanion : idea.draft;
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
            themes={themes}
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
                  publicationPlan: idea.publicationPlan ?? "linkedin",
                  themeIds: idea.themes.map((theme) => theme.id),
                  note: note || undefined,
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
                await request({ action: "prepare_editorial_review" });
                router.push(`/ideas/${ideaId}/board`);
              })
            }
            board={() =>
              run(async () => {
                setMessage("The grounded editorial workflow is running. You can keep this page open.");
                await request({ action: "run_grounded_board" });
                setMessage(
                  "Grounded editorial brief and working draft created. Source provenance is available below.",
                );
              })
            }
            livePreview={livePreview}
            executionStatus={editorialRunLabel}
            executionProgress={runProgress}
            liveBoard={(budgetCap) =>
              run(async () => {
                setRunStartedAt(new Date().toISOString());
                setRunProgress(undefined);
                setEditorialRunLabel("Running the live Editorial Board");
                setMessage("The live editorial workflow is running. You can keep this page open.");
                try {
                  await request({ action: "run_live_board", budgetCap });
                  setMessage("Live editorial brief and working draft created. Provider, model, usage, and cost assumptions are saved in provenance.");
                } finally {
                  setEditorialRunLabel(undefined);
                  setRunStartedAt(undefined);
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
                const output = format === "linkedin_companion" ? idea.linkedinCompanion : idea.draft;
                if (!output) throw new Error("Save this output before running its review.");
                await request({ action: "run_final_review", body: output.body, format, draftVersionId: output.id });
                setMessage(
                  "Draft review saved. The original brief and every prior review remain available in history.",
                );
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
            setDraft={setDraft}
            saveDraft={() =>
              run(async () => {
                await request({ action: "save_draft", body: draft });
                setMessage("Draft version saved locally.");
              })
            }
            publish={(event, format, platform, output) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              return run(async () => {
                const publishedAt = String(form.get("publishedAt") ?? "").trim();
                await request({
                  action: "publish",
                  platform,
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
            compactCapture={mode !== "develop"}
            showPriority={mode === "develop"}
            reviewHref={mode === "develop" ? `/ideas/${ideaId}/board` : undefined}
            voiceChecks={voiceChecks}
            checkVoice={checkVoice}
            createVisual={() =>
              run(async () => {
                await request({ action: "create_visual_companion" });
                setMessage("Visual companion saved locally for this draft version.");
              })
            }
            createLinkedinCompanion={() =>
              run(async () => {
                await request({ action: "create_linkedin_companion" });
                setCompanionDirty(false);
                setMessage("LinkedIn companion created from this exact canonical version. It is saved separately and will become stale if the canonical article changes.");
              })
            }
            companionDraft={companionDraft}
            setCompanionDraft={setCompanionDraft}
            saveLinkedinCompanion={() =>
              run(async () => {
                await request({ action: "save_linkedin_companion", body: companionDraft });
                setCompanionDirty(false);
                setMessage("LinkedIn companion version saved locally. Review it when useful, then continue to Finalize.");
              })
            }
            draftDirty={draftDirty}
            onDraftChange={() => {
              setVoiceChecks((current) => {
                const next = { ...current };
                delete next[idea.publicationPlan?.startsWith("medium") || idea.publicationPlan?.startsWith("substack") ? "canonical" : "linkedin"];
                return next;
              });
              setDraftDirty(true);
            }}
            companionDirty={companionDirty}
            onCompanionChange={() => {
              setVoiceChecks((current) => {
                const next = { ...current };
                delete next.linkedin_companion;
                return next;
              });
              setCompanionDirty(true);
            }}
          />
        </section>
      </section>
    </main>
  );
}
