import fs from "node:fs";
import crypto from "node:crypto";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createIdea,
  createVisualCompanion,
  createLinkedinCompanion,
  checkExactDraftVoice,
  saveLinkedinCompanionDraft,
  createTheme,
  developIdea,
  deleteUnpublishedIdea,
  getIdea,
  listIdeas,
  listThemes,
  moveIdea,
  runFinalDraftReview,
  runLeanBoard,
  saveEditedDraft,
  assertPublishedWorkflowUnlocked,
  setRecommendationDisposition,
  publishIdea,
  updateIdea,
} from "@/lean/service";
import { POST as ideaDetailPost } from "../../app/api/ideas/[ideaId]/route";
import { POST as voiceCheckPost } from "../../app/api/voice-check/route";
import { openDatabase } from "@/persistence/database";
import { migrateDatabase } from "@/persistence/migrations";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "aeb-lean-"));
const previousDatabasePath = process.env.DATABASE_PATH;

beforeAll(() => {
  const databasePath = path.join(root, "lean.sqlite");
  process.env.DATABASE_PATH = databasePath;
  const database = openDatabase(databasePath);
  try {
    migrateDatabase(database, path.join(process.cwd(), "migrations"));
  } finally {
    database.close();
  }
});
afterAll(() => { if (previousDatabasePath === undefined) delete process.env.DATABASE_PATH; else process.env.DATABASE_PATH = previousDatabasePath; fs.rmSync(root, { recursive: true, force: true }); });

describe("lean idea queue", () => {
  it("deletes an unpublished idea with its local workflow records and refuses published history", () => {
    const disposable = createIdea({ rawNotes: "A disposable local idea." });
    developIdea(disposable.id, { useBestJudgment: true, answers: [] });
    runLeanBoard(disposable.id);
    deleteUnpublishedIdea(disposable.id);
    expect(getIdea(disposable.id)).toBeUndefined();

    const retained = createIdea({ rawNotes: "A publication record remains part of local history." });
    developIdea(retained.id, { useBestJudgment: true, answers: [] });
    runLeanBoard(retained.id);
    const retainedDraft = getIdea(retained.id)!.draft!;
    publishIdea(retained.id, { platform: "linkedin", finalText: retainedDraft.body, draftVersionId: retainedDraft.id, draftFormat: "linkedin", voiceCheckAcknowledged: true });
    expect(() => deleteUnpublishedIdea(retained.id)).toThrow(/Published ideas are retained/i);
  });

  it("saves an optional-theme idea without a model call and carries it through board and draft", () => {
    const theme = createTheme("A useful custom theme");
    expect(listThemes().map((item) => item.name)).toEqual(expect.arrayContaining([
      "See through the AI hype",
      "Understand the operationalization gap",
      "Improve leadership judgment",
      "Select the right work",
      "Build, adopt, and operate with principles",
    ]));
    const created = createIdea({ rawNotes: "A rough observation about operational value and AI activity.", themeIds: [theme.id] });
    expect(created.status).toBe("inbox");
    expect(created.themes).toEqual([theme]);
    expect(listThemes().some((item) => item.name === "Understand the operationalization gap")).toBe(true);
    expect(listIdeas().some((item) => item.id === created.id)).toBe(true);

    const ready = developIdea(created.id, { useBestJudgment: true, answers: [] });
    expect(ready.status).toBe("ready_to_review");
    const reviewed = runLeanBoard(created.id);
    expect(reviewed.status).toBe("drafted");
    expect(reviewed.editorialBrief?.reviews).toHaveLength(3);
    expect(reviewed.draft?.body).toContain("operational value");
    const edited = saveEditedDraft(created.id, "A user-owned final draft.");
    expect(edited.draft?.body).toBe("A user-owned final draft.");
    expect(getIdea(created.id)?.draft?.version).toBeGreaterThan(1);
    const withVisual = createVisualCompanion(created.id);
    expect(withVisual.visualCompanion?.title).toBeTruthy();
    expect(withVisual.visualCompanion?.filePath).toMatch(/^[a-z0-9-]+\//);
    expect(withVisual.visualCompanion?.filePath).toMatch(/draft_\d+_\d{8}T\d{6}/);
    expect(fs.existsSync(path.join(root, withVisual.visualCompanion!.filePath))).toBe(true);
    const finalBody = "A user-owned final draft with a concrete example because the operating model matters. What would change in your organization?";
    const finalDraft = saveEditedDraft(created.id, finalBody);
    const finalReview = runFinalDraftReview(created.id, finalBody, "linkedin", finalDraft.draft!.id);
    expect(finalReview.finalReview?.draftVersionId).toBe(finalReview.draft?.id);
    expect(finalReview.finalReview?.polishSuggestions).toEqual([]);
    expect(finalReview.finalReview?.reviews.map((review) => review.checkStatus)).toEqual(
      expect.arrayContaining(["pass", "needs_revision"]),
    );
    expect(finalReview.reviewHistory).toHaveLength(2);
    expect(finalReview.editorialBrief?.recommendedChanges).toHaveLength(2);
  });

  it("offers optional exact final-polish edits without reopening a ready review", () => {
    const created = createIdea({ rawNotes: "The missing middle between AI pilots and production." });
    developIdea(created.id, { useBestJudgment: true, answers: [] });
    runLeanBoard(created.id);
    const polishBody = "Most organizations focus on the model. Sometimes that matters, but a hypothetical pilot can still stall because ownership is unclear. A dependable workflow also needs sensible permissions, support when something goes wrong, and a baseline that shows whether the work improved. Clear ownership makes those operating decisions easier to revisit as conditions change. That does not mean every promising experiment should move into production. The team may decide to scale, redesign, or retire it after looking at the evidence. The decision should rest on more than technical excitement. What conditions would help your organization make that decision clearly?";
    const polishDraft = saveEditedDraft(created.id, polishBody);
    const reviewed = runFinalDraftReview(created.id, polishBody, "linkedin", polishDraft.draft!.id);

    expect(reviewed.finalReview?.readiness).toBe("ready");
    expect(reviewed.finalReview?.remaining).toEqual([]);
    expect(reviewed.finalReview?.polishSuggestions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          current: "Most organizations",
          suggested: "Many organizations",
        }),
        expect.objectContaining({
          current: "technical excitement",
          suggested: "technical performance alone",
        }),
      ]),
    );
  });

  it("uses explicit author dispositions and preserves exact review and voice provenance at publication", () => {
    const created = createIdea({ rawNotes: "A practical point about the missing middle between a pilot and dependable work." });
    developIdea(created.id, { useBestJudgment: true, answers: [] });
    const board = runLeanBoard(created.id);
    const recommendation = board.editorialBrief!.recommendedChanges[0];
    setRecommendationDisposition(created.id, {
      sourceReviewRunId: board.editorialBrief!.runId,
      recommendation,
      disposition: "revised",
    });
    const finalText = "A practical point can be qualified with a concrete example because a dependable workflow needs ownership. What would make that work in your organization?";
    const saved = saveEditedDraft(created.id, finalText);
    const reviewed = runFinalDraftReview(created.id, finalText, "linkedin", saved.draft!.id);
    expect(reviewed.finalReview?.recommendationStatuses).toEqual(
      expect.arrayContaining([expect.objectContaining({ recommendation, disposition: "revised" })]),
    );
    const published = publishIdea(created.id, {
      platform: "linkedin",
      finalText,
      draftVersionId: reviewed.draft!.id,
      draftFormat: "linkedin",
      voiceCheckAcknowledged: true,
    });
    expect(published.status).toBe("published");
    expect(published.draft?.id).toBe(reviewed.draft?.id);
    const database = new DatabaseSync(path.join(root, "lean.sqlite"));
    const provenance = database.prepare(
      "SELECT editorial_review_run_id, final_review_run_id, reviewed_draft_version_id, voice_check_json FROM publication_provenance WHERE reviewed_draft_version_id = ? ORDER BY recorded_at DESC LIMIT 1",
    ).get(reviewed.draft!.id) as {
      editorial_review_run_id: string | null;
      final_review_run_id: string | null;
      reviewed_draft_version_id: string | null;
      voice_check_json: string;
    };
    database.close();
    expect(provenance.editorial_review_run_id).toBe(board.editorialBrief!.runId);
    expect(provenance.final_review_run_id).toBe(reviewed.finalReview!.runId);
    expect(provenance.reviewed_draft_version_id).toBe(reviewed.draft!.id);
    expect(JSON.parse(provenance.voice_check_json)).toMatchObject({ acknowledged: true });
  });

  it("locks a published output against edits, reviews, visuals, and duplicate publication records", () => {
    const created = createIdea({ rawNotes: "A publishable point about accountable operating discipline." });
    developIdea(created.id, { useBestJudgment: true, answers: [] });
    runLeanBoard(created.id);
    const current = getIdea(created.id)!;
    const published = publishIdea(created.id, {
      platform: "linkedin",
      finalText: current.draft!.body,
      draftVersionId: current.draft!.id,
      draftFormat: "linkedin",
      voiceCheckAcknowledged: true,
    });

    expect(() => saveEditedDraft(created.id, "A changed published post.")).toThrow(/Published workflow is locked|already published/i);
    expect(() => runFinalDraftReview(created.id, published.draft!.body, "linkedin", published.draft!.id)).toThrow(/Published workflow is locked|already published/i);
    expect(() => createVisualCompanion(created.id)).toThrow(/Published workflow is locked|already published/i);
    expect(() => runLeanBoard(created.id)).toThrow(/Published workflow is locked/i);
    expect(() => developIdea(created.id, { useBestJudgment: true, answers: [] })).toThrow(/Published workflow is locked/i);
    expect(() => updateIdea(created.id, { status: "inbox" })).toThrow(/Published workflow is locked/i);
    expect(() => moveIdea(created.id, "down")).toThrow(/Published workflow is locked/i);
    expect(() => assertPublishedWorkflowUnlocked(created.id)).toThrow(/Published workflow is locked/i);
    expect(() => setRecommendationDisposition(created.id, {
      sourceReviewRunId: current.editorialBrief!.runId,
      recommendation: current.editorialBrief!.recommendedChanges[0]!,
      disposition: "resolved",
    })).toThrow(/Published workflow is locked/i);
    expect(() => checkExactDraftVoice(created.id, { draftVersionId: published.draft!.id, format: "linkedin" })).toThrow(/Published workflow is locked|already published/i);
    expect(() => publishIdea(created.id, {
      platform: "linkedin",
      finalText: published.draft!.body,
      draftVersionId: published.draft!.id,
      draftFormat: "linkedin",
      voiceCheckAcknowledged: true,
    })).toThrow(/already has a publication record/i);
    expect(() => publishIdea(created.id, {
      platform: "linkedin",
      finalText: "A different body must never become a new publication from Finalize.",
      voiceCheckAcknowledged: true,
    })).toThrow();
    expect(() => publishIdea(created.id, {
      platform: "linkedin",
      finalText: "A different body must not replace the exact saved version.",
      draftVersionId: published.draft!.id,
      draftFormat: "linkedin",
      voiceCheckAcknowledged: true,
    })).toThrow(/does not match the selected saved draft version/i);
    expect(getIdea(created.id)?.publications).toHaveLength(1);
    expect(getIdea(created.id)?.draft?.id).toBe(published.draft!.id);
  });

  it("rejects Board and workflow mutations through the local route after publication", async () => {
    const created = createIdea({ rawNotes: "A published local record must not accept new Board history." });
    developIdea(created.id, { useBestJudgment: true, answers: [] });
    runLeanBoard(created.id);
    const draft = getIdea(created.id)!.draft!;
    publishIdea(created.id, {
      platform: "linkedin",
      finalText: draft.body,
      draftVersionId: draft.id,
      draftFormat: "linkedin",
      voiceCheckAcknowledged: true,
    });
    for (const body of [
      { action: "run_board" },
      { action: "run_live_board", budgetCap: 0.05 },
      { action: "rerun_live_reviewer", role: "editor", tier: "medium", budgetCap: 0.05, escalationReason: "Must remain locked." },
      { action: "develop", useBestJudgment: true, answers: [] },
      { action: "move_down" },
      { status: "inbox" },
    ]) {
      const response = await ideaDetailPost(
        new Request(`http://127.0.0.1:3100/api/ideas/${created.id}`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "http://127.0.0.1:3100",
            "sec-fetch-site": "same-origin",
          },
          body: JSON.stringify(body),
        }),
        { params: Promise.resolve({ ideaId: created.id }) },
      );
      expect(response.status).toBe(400);
      expect((await response.json()).error).toMatch(/Published workflow is locked/i);
    }
    const bypass = await ideaDetailPost(
      new Request(`http://127.0.0.1:3100/api/ideas/${created.id}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://127.0.0.1:3100",
          "sec-fetch-site": "same-origin",
        },
        body: JSON.stringify({
          action: "publish",
          platform: "linkedin",
          finalText: "A route request must not create and publish a new draft.",
          voiceCheckAcknowledged: true,
        }),
      }),
      { params: Promise.resolve({ ideaId: created.id }) },
    );
    expect(bypass.status).toBe(400);
    expect(getIdea(created.id)?.publications).toHaveLength(1);
    for (const body of [
      { action: "save_draft", body: draft.body, format: "linkedin" },
      { action: "run_final_review", body: draft.body, format: "linkedin", draftVersionId: draft.id },
      { action: "create_visual_companion" },
      {
        action: "set_recommendation_disposition",
        sourceReviewRunId: getIdea(created.id)!.editorialBrief!.runId,
        recommendation: getIdea(created.id)!.editorialBrief!.recommendedChanges[0],
        disposition: "resolved",
      },
      {
        action: "publish",
        platform: "linkedin",
        finalText: draft.body,
        draftVersionId: draft.id,
        draftFormat: "linkedin",
        voiceCheckAcknowledged: true,
      },
    ]) {
      const response = await ideaDetailPost(
        new Request(`http://127.0.0.1:3100/api/ideas/${created.id}`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "http://127.0.0.1:3100",
            "sec-fetch-site": "same-origin",
          },
          body: JSON.stringify(body),
        }),
        { params: Promise.resolve({ ideaId: created.id }) },
      );
      expect(response.status).toBe(400);
    }
  });

  it("rejects mismatched review and voice formats and prevents generic companion saves", async () => {
    const created = createIdea({ rawNotes: "Exact output formats must remain aligned across review and voice checks." });
    updateIdea(created.id, { publicationPlan: "medium_linkedin" });
    developIdea(created.id, { useBestJudgment: true, answers: [] });
    runLeanBoard(created.id);
    const article = getIdea(created.id)!.canonicalDraft!;

    expect(() => runFinalDraftReview(created.id, article.body, "linkedin", article.id)).toThrow(/does not match this idea's publication plan/i);
    expect(() => checkExactDraftVoice(created.id, { draftVersionId: article.id, format: "linkedin" })).toThrow(/does not match this idea's publication plan/i);
    expect(() => saveEditedDraft(created.id, "An unlinked companion must not be created.", "linkedin_companion")).toThrow(/dedicated LinkedIn companion action/i);

    const reviewResponse = await ideaDetailPost(
      new Request(`http://127.0.0.1:3100/api/ideas/${created.id}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://127.0.0.1:3100",
          "sec-fetch-site": "same-origin",
        },
        body: JSON.stringify({ action: "run_final_review", body: article.body, format: "linkedin", draftVersionId: article.id }),
      }),
      { params: Promise.resolve({ ideaId: created.id }) },
    );
    expect(reviewResponse.status).toBe(400);
    expect((await reviewResponse.json()).error).toMatch(/does not match this idea's publication plan/i);

    const response = await ideaDetailPost(
      new Request(`http://127.0.0.1:3100/api/ideas/${created.id}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://127.0.0.1:3100",
          "sec-fetch-site": "same-origin",
        },
        body: JSON.stringify({ action: "save_draft", format: "linkedin_companion", body: "An orphan companion." }),
      }),
      { params: Promise.resolve({ ideaId: created.id }) },
    );
    expect(response.status).toBe(400);
    expect((await response.json()).error).toMatch(/dedicated LinkedIn companion action/i);
    expect(getIdea(created.id)?.linkedinCompanion).toBeUndefined();

    const voiceResponse = await voiceCheckPost(new Request("http://127.0.0.1:3100/api/voice-check", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://127.0.0.1:3100",
        "sec-fetch-site": "same-origin",
      },
      body: JSON.stringify({ ideaId: created.id, draftVersionId: article.id, format: "linkedin" }),
    }));
    expect(voiceResponse.status).toBe(400);
    expect((await voiceResponse.json()).error).toMatch(/does not match this idea's publication plan/i);
  });

  it("rejects obsolete approval actions without recording partial companion workflow state", async () => {
    const created = createIdea({ rawNotes: "Companion creation must remain one atomic author action." });
    updateIdea(created.id, { publicationPlan: "medium_linkedin" });
    developIdea(created.id, { useBestJudgment: true, answers: [] });
    runLeanBoard(created.id);

    for (const action of ["approve_canonical_draft", "approve_linkedin_companion"]) {
      const response = await ideaDetailPost(
        new Request(`http://127.0.0.1:3100/api/ideas/${created.id}`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "http://127.0.0.1:3100",
            "sec-fetch-site": "same-origin",
          },
          body: JSON.stringify({ action }),
        }),
        { params: Promise.resolve({ ideaId: created.id }) },
      );
      expect(response.status).toBe(400);
      expect((await response.json()).error).toMatch(/approval action is no longer available/i);
    }

    const database = new DatabaseSync(path.join(root, "lean.sqlite"));
    const approvals = database
      .prepare("SELECT COUNT(*) AS count FROM canonical_draft_approvals WHERE idea_id = ?")
      .get(created.id) as { count: number };
    database.close();
    expect(approvals.count).toBe(0);
    expect(getIdea(created.id)?.linkedinCompanion).toBeUndefined();
  });

  it("moves an unpublished idea without mutating an adjacent published idea", () => {
    const publishedIdea = createIdea({ rawNotes: "A published queue item must keep its recorded workflow state." });
    const movableIdea = createIdea({ rawNotes: "An unpublished adjacent queue item." });
    updateIdea(publishedIdea.id, { priority: 100_000 });
    updateIdea(movableIdea.id, { priority: 99_999 });
    developIdea(publishedIdea.id, { useBestJudgment: true, answers: [] });
    runLeanBoard(publishedIdea.id);
    const draft = getIdea(publishedIdea.id)!.draft!;
    publishIdea(publishedIdea.id, {
      platform: "linkedin",
      finalText: draft.body,
      draftVersionId: draft.id,
      draftFormat: "linkedin",
      voiceCheckAcknowledged: true,
    });

    const publishedPriority = listIdeas().find((idea) => idea.id === publishedIdea.id)!.priority;
    expect(() => moveIdea(movableIdea.id, "up")).not.toThrow();
    const queue = listIdeas().filter((idea) => [publishedIdea.id, movableIdea.id].includes(idea.id));
    expect(queue.map((idea) => idea.id)).toEqual([movableIdea.id, publishedIdea.id]);
    expect(queue.find((idea) => idea.id === publishedIdea.id)?.priority).toBe(publishedPriority);
  });

  it("rolls back publication, provenance, and idea status when provenance persistence fails", () => {
    const created = createIdea({ rawNotes: "Publication records must be atomic." });
    developIdea(created.id, { useBestJudgment: true, answers: [] });
    runLeanBoard(created.id);
    const draft = getIdea(created.id)!.draft!;
    const database = new DatabaseSync(path.join(root, "lean.sqlite"));
    database.exec("CREATE TRIGGER fail_publication_provenance BEFORE INSERT ON publication_provenance BEGIN SELECT RAISE(ABORT, 'forced provenance failure'); END;");
    database.close();
    try {
      expect(() => publishIdea(created.id, {
        platform: "linkedin",
        finalText: draft.body,
        draftVersionId: draft.id,
        draftFormat: "linkedin",
        voiceCheckAcknowledged: true,
      })).toThrow(/forced provenance failure/i);
      const check = new DatabaseSync(path.join(root, "lean.sqlite"));
      const publicationCount = check.prepare("SELECT COUNT(*) AS count FROM publications WHERE draft_version_id = ?").get(draft.id) as { count: number };
      check.close();
      expect(publicationCount.count).toBe(0);
      expect(getIdea(created.id)?.status).not.toBe("published");
    } finally {
      const cleanup = new DatabaseSync(path.join(root, "lean.sqlite"));
      cleanup.exec("DROP TRIGGER IF EXISTS fail_publication_provenance;");
      cleanup.close();
    }
  });

  it("requires a current companion before recording a dual-output canonical article, then keeps the companion independently usable", () => {
    const created = createIdea({ rawNotes: "A dual-output article needs a prepared LinkedIn companion before the article is published." });
    updateIdea(created.id, { publicationPlan: "medium_linkedin" });
    developIdea(created.id, { useBestJudgment: true, answers: [] });
    runLeanBoard(created.id);
    const withoutCompanion = getIdea(created.id)!;
    expect(() => publishIdea(created.id, {
      platform: "medium",
      finalText: withoutCompanion.canonicalDraft!.body,
      draftVersionId: withoutCompanion.canonicalDraft!.id,
      draftFormat: "canonical",
      voiceCheckAcknowledged: true,
    })).toThrow(/Create a current LinkedIn companion/i);

    const prepared = createLinkedinCompanion(created.id);
    const article = publishIdea(created.id, {
      platform: "medium",
      finalText: prepared.canonicalDraft!.body,
      draftVersionId: prepared.canonicalDraft!.id,
      draftFormat: "canonical",
      title: "A publication request must not rewrite the saved idea title.",
      voiceCheckAcknowledged: true,
    });
    expect(article.publications).toEqual(expect.arrayContaining([
      expect.objectContaining({ draftVersionId: prepared.canonicalDraft!.id, platform: "medium" }),
    ]));
    expect(article.title).toBe(created.title);
    expect(() => runFinalDraftReview(created.id, article.linkedinCompanion!.body, "linkedin_companion", article.linkedinCompanion!.id)).not.toThrow();
    expect(checkExactDraftVoice(created.id, {
      draftVersionId: article.linkedinCompanion!.id,
      format: "linkedin_companion",
    })).toHaveProperty("riskPercent");
    const edited = saveLinkedinCompanionDraft(created.id, `${article.linkedinCompanion!.body}\n\nThe companion remains independently editable after the article is published.`);
    expect(edited.linkedinCompanion?.id).not.toBe(article.linkedinCompanion?.id);
  });

  it("rejects companion-first publication without changing publication history or status", async () => {
    const created = createIdea({ rawNotes: "A companion must never publish ahead of its canonical article." });
    updateIdea(created.id, { publicationPlan: "medium_linkedin" });
    developIdea(created.id, { useBestJudgment: true, answers: [] });
    runLeanBoard(created.id);
    const prepared = createLinkedinCompanion(created.id);
    const companion = prepared.linkedinCompanion!;

    expect(() => publishIdea(created.id, {
      platform: "linkedin",
      finalText: companion.body,
      draftVersionId: companion.id,
      draftFormat: "linkedin_companion",
      voiceCheckAcknowledged: true,
    })).toThrow(/canonical article publication before recording its LinkedIn companion/i);
    expect(getIdea(created.id)?.publications).toEqual([]);
    expect(getIdea(created.id)?.status).not.toBe("published");

    const response = await ideaDetailPost(
      new Request(`http://127.0.0.1:3100/api/ideas/${created.id}`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: "http://127.0.0.1:3100", "sec-fetch-site": "same-origin" },
        body: JSON.stringify({
          action: "publish", platform: "linkedin", finalText: companion.body,
          draftVersionId: companion.id, draftFormat: "linkedin_companion", voiceCheckAcknowledged: true,
        }),
      }),
      { params: Promise.resolve({ ideaId: created.id }) },
    );
    expect(response.status).toBe(400);
    expect((await response.json()).error).toMatch(/canonical article publication before recording/i);
    expect(getIdea(created.id)?.publications).toEqual([]);
  });

  it("detects historical companion-first records without rewriting them", () => {
    const created = createIdea({ rawNotes: "Historical companion-first publication data must be surfaced safely." });
    updateIdea(created.id, { publicationPlan: "medium_linkedin" });
    developIdea(created.id, { useBestJudgment: true, answers: [] });
    runLeanBoard(created.id);
    const prepared = createLinkedinCompanion(created.id);
    const database = new DatabaseSync(path.join(root, "lean.sqlite"));
    const content = database.prepare("SELECT id FROM content_items WHERE idea_id = ?").get(created.id) as { id: string };
    database.prepare("INSERT INTO publications (id, content_item_id, draft_version_id, platform, published_at, final_text) VALUES (?, ?, ?, 'linkedin', ?, ?)")
      .run("historical_companion_first", content.id, prepared.linkedinCompanion!.id, new Date().toISOString(), prepared.linkedinCompanion!.body);
    database.close();

    expect(getIdea(created.id)?.publicationIntegrityWarning).toMatch(/recorded before its canonical article/i);
    expect(() => saveLinkedinCompanionDraft(created.id, "Unsafe history must not be rewritten.")).toThrow(/Publication history is inconsistent/i);
    expect(() => publishIdea(created.id, {
      platform: "medium", finalText: prepared.canonicalDraft!.body,
      draftVersionId: prepared.canonicalDraft!.id, draftFormat: "canonical", voiceCheckAcknowledged: true,
    })).toThrow(/Publication history is inconsistent/i);
    const check = new DatabaseSync(path.join(root, "lean.sqlite"));
    expect((check.prepare("SELECT COUNT(*) AS count FROM publications WHERE content_item_id = ?").get(content.id) as { count: number }).count).toBe(1);
    check.close();
  });

  it("rolls back every companion creation and edit write when a dependent persistence step fails", () => {
    const fresh = () => {
      const created = createIdea({ rawNotes: `Atomic companion write ${crypto.randomUUID()}.` });
      updateIdea(created.id, { publicationPlan: "medium_linkedin" });
      developIdea(created.id, { useBestJudgment: true, answers: [] });
      runLeanBoard(created.id);
      return created;
    };
    const count = (ideaId: string) => {
      const database = new DatabaseSync(path.join(root, "lean.sqlite"));
      const content = database.prepare("SELECT id FROM content_items WHERE idea_id = ?").get(ideaId) as { id: string };
      const companions = (database.prepare("SELECT COUNT(*) AS count FROM draft_versions WHERE content_item_id = ? AND publication_format = 'linkedin_companion'").get(content.id) as { count: number }).count;
      const approvals = (database.prepare("SELECT COUNT(*) AS count FROM canonical_draft_approvals WHERE idea_id = ?").get(ideaId) as { count: number }).count;
      database.close();
      return { companions, approvals };
    };
    const install = (name: string, sql: string) => {
      const database = new DatabaseSync(path.join(root, "lean.sqlite"));
      database.exec(`CREATE TRIGGER ${name} ${sql}`);
      database.close();
    };
    const remove = (name: string) => {
      const database = new DatabaseSync(path.join(root, "lean.sqlite"));
      database.exec(`DROP TRIGGER IF EXISTS ${name}`);
      database.close();
    };

    const approvalFailure = fresh();
    install("fail_canonical_approval", "BEFORE INSERT ON canonical_draft_approvals BEGIN SELECT RAISE(ABORT, 'forced canonical approval failure'); END;");
    try {
      expect(() => createLinkedinCompanion(approvalFailure.id)).toThrow(/forced canonical approval failure/i);
      expect(count(approvalFailure.id)).toEqual({ companions: 0, approvals: 0 });
    } finally { remove("fail_canonical_approval"); }

    const draftFailure = fresh();
    install("fail_companion_draft", "BEFORE INSERT ON draft_versions WHEN NEW.publication_format = 'linkedin_companion' BEGIN SELECT RAISE(ABORT, 'forced companion draft failure'); END;");
    try {
      expect(() => createLinkedinCompanion(draftFailure.id)).toThrow(/forced companion draft failure/i);
      expect(count(draftFailure.id)).toEqual({ companions: 0, approvals: 0 });
    } finally { remove("fail_companion_draft"); }

    const relationshipFailure = fresh();
    install("fail_companion_relationship", "BEFORE INSERT ON draft_relationships BEGIN SELECT RAISE(ABORT, 'forced companion relationship failure'); END;");
    try {
      expect(() => createLinkedinCompanion(relationshipFailure.id)).toThrow(/forced companion relationship failure/i);
      expect(count(relationshipFailure.id)).toEqual({ companions: 0, approvals: 0 });
    } finally { remove("fail_companion_relationship"); }

    const editFailure = fresh();
    const createdCompanion = createLinkedinCompanion(editFailure.id);
    const before = count(editFailure.id);
    install("fail_companion_edit_relationship", "BEFORE INSERT ON draft_relationships BEGIN SELECT RAISE(ABORT, 'forced companion edit relationship failure'); END;");
    try {
      expect(() => saveLinkedinCompanionDraft(editFailure.id, `${createdCompanion.linkedinCompanion!.body}\n\nA failed edit must roll back.`)).toThrow(/forced companion edit relationship failure/i);
      expect(count(editFailure.id)).toEqual(before);
      expect(getIdea(editFailure.id)?.linkedinCompanion?.id).toBe(createdCompanion.linkedinCompanion?.id);
    } finally { remove("fail_companion_edit_relationship"); }
  });

  it("keeps an author disposition after the final review is already saved", () => {
    const created = createIdea({ rawNotes: "A point about operational discipline and dependable AI work." });
    developIdea(created.id, { useBestJudgment: true, answers: [] });
    const board = runLeanBoard(created.id);
    const dispositionBody = "A qualified point about operational discipline needs a concrete example because a dependable workflow has an owner. What would change in your organization?";
    const dispositionDraft = saveEditedDraft(created.id, dispositionBody);
    const reviewed = runFinalDraftReview(created.id, dispositionBody, "linkedin", dispositionDraft.draft!.id);
    const recommendation = board.editorialBrief!.recommendedChanges[0];

    setRecommendationDisposition(created.id, {
      sourceReviewRunId: board.editorialBrief!.runId,
      recommendation,
      disposition: "resolved",
    });

    const reloaded = getIdea(created.id)!;
    expect(reloaded.finalReview?.runId).toBe(reviewed.finalReview?.runId);
    expect(reloaded.finalReview?.recommendationStatuses).toEqual(
      expect.arrayContaining([expect.objectContaining({ recommendation, disposition: "resolved" })]),
    );
    expect(reloaded.finalReview?.addressed).toContain(recommendation);
    expect(reloaded.finalReview?.remaining).not.toContain(recommendation);
  });

  it("creates a concise working title from a detailed capture", () => {
    const created = createIdea({
      rawNotes:
        "Theme: Understand the operationalization gap\n\nI want to write to understand the maturity of AI understanding in the industry and why activity does not equal operational maturity.\n\n- Pilots are increasing\n- Production capability is still uneven",
    });

    expect(created.title).toBe(
      "the maturity of AI understanding in the industry and why activity does not equal…",
    );
    expect(created.title).not.toBe(created.rawNotes);
  });

  it("preserves an existing LinkedIn draft as a canonical article when the author changes to a long-form companion plan", () => {
    const created = createIdea({ rawNotes: "A short starting point about accountable AI operating models." });
    developIdea(created.id, { useBestJudgment: true, answers: [] });
    runLeanBoard(created.id);
    const linkedInDraft = getIdea(created.id)!.draft!;
    const changed = updateIdea(created.id, { publicationPlan: "medium_linkedin" });
    expect(changed.canonicalDraft?.body).toBe(linkedInDraft.body);
    expect(changed.canonicalDraft?.createdBy).toBe("publication_plan_transition");
    expect(changed.linkedinCompanion).toBeUndefined();
  });

  it("creates a LinkedIn companion from an explicit canonical-source action, reviews outputs independently, and marks the companion stale after a canonical edit", () => {
    const created = createIdea({ rawNotes: "A practical observation about moving enterprise AI work from a pilot into dependable operation." });
    updateIdea(created.id, { publicationPlan: "medium_linkedin" });
    developIdea(created.id, { useBestJudgment: true, answers: [] });
    const drafted = runLeanBoard(created.id);

    expect(drafted.canonicalDraft?.body.split(/\s+/).length).toBeGreaterThan(100);
    expect(drafted.canonicalDraft?.body.length).toBeGreaterThan(drafted.rawNotes.length);
    expect(drafted.linkedinCompanion).toBeUndefined();

    const companion = createLinkedinCompanion(created.id);
    expect(companion.canonicalDraft?.approved).toBe(true);
    expect(companion.linkedinCompanion?.stale).toBe(false);
    expect(companion.linkedinCompanion?.sourceCanonicalVersion).toBe(companion.canonicalDraft?.version);
    expect(companion.linkedinCompanion?.body.length).toBeLessThan(companion.canonicalDraft!.body.length);
    const editedCompanion = saveLinkedinCompanionDraft(created.id, `${companion.linkedinCompanion!.body}\n\nWhat would you examine before moving a pilot forward?`);
    expect(editedCompanion.linkedinCompanion?.version).toBeGreaterThan(companion.linkedinCompanion!.version);
    const companionReview = runFinalDraftReview(created.id, editedCompanion.linkedinCompanion!.body, "linkedin_companion", editedCompanion.linkedinCompanion!.id);
    expect(companionReview.linkedinCompanionFinalReview?.draftVersionId).toBe(editedCompanion.linkedinCompanion!.id);

    const revised = saveEditedDraft(created.id, `${companion.canonicalDraft!.body}\n\nOne more practical boundary is worth keeping visible.`, "canonical");
    expect(revised.linkedinCompanion?.stale).toBe(true);

    expect(() => publishIdea(created.id, {
      platform: "linkedin",
      finalText: editedCompanion.linkedinCompanion!.body,
      draftVersionId: editedCompanion.linkedinCompanion!.id,
      draftFormat: "linkedin_companion",
      voiceCheckAcknowledged: true,
    })).toThrow(/stale or unlinked/i);

    const current = createLinkedinCompanion(created.id);
    expect(() => publishIdea(created.id, {
      platform: "medium",
      finalText: current.linkedinCompanion!.body,
      draftVersionId: current.linkedinCompanion!.id,
      draftFormat: "linkedin_companion",
      voiceCheckAcknowledged: true,
    })).toThrow(/does not match this publication output/i);
    const canonicalPublished = publishIdea(created.id, {
      platform: "medium",
      finalText: current.canonicalDraft!.body,
      draftVersionId: current.canonicalDraft!.id,
      draftFormat: "canonical",
      voiceCheckAcknowledged: true,
    });
    expect(canonicalPublished.publications).toEqual(expect.arrayContaining([
      expect.objectContaining({ draftVersionId: current.canonicalDraft!.id, platform: "medium" }),
    ]));
    const published = publishIdea(created.id, {
      platform: "linkedin",
      finalText: current.linkedinCompanion!.body,
      draftVersionId: current.linkedinCompanion!.id,
      draftFormat: "linkedin_companion",
      voiceCheckAcknowledged: true,
    });
    expect(published.status).toBe("published");
    expect(published.publications).toEqual(expect.arrayContaining([
      expect.objectContaining({ draftVersionId: current.canonicalDraft!.id, platform: "medium" }),
      expect.objectContaining({ draftVersionId: current.linkedinCompanion!.id, platform: "linkedin" }),
    ]));
    expect(() => saveEditedDraft(created.id, "A canonical source must not be replaced after its companion is published.", "canonical")).toThrow(/Published workflow is locked/i);
    expect(() => saveLinkedinCompanionDraft(created.id, "A changed published companion.")).toThrow(/already published/i);
  });

  it("rejects cross-idea companion relationships for review, voice checks, and publication", () => {
    const first = createIdea({ rawNotes: "The first article owns its companion relationship." });
    const second = createIdea({ rawNotes: "The second article must never become another idea's companion source." });
    for (const idea of [first, second]) {
      updateIdea(idea.id, { publicationPlan: "medium_linkedin" });
      developIdea(idea.id, { useBestJudgment: true, answers: [] });
      runLeanBoard(idea.id);
    }
    const firstCompanion = createLinkedinCompanion(first.id).linkedinCompanion!;
    const secondCanonical = getIdea(second.id)!.canonicalDraft!;
    const database = new DatabaseSync(path.join(root, "lean.sqlite"));
    database.prepare("UPDATE draft_relationships SET parent_draft_version_id = ? WHERE child_draft_version_id = ?").run(secondCanonical.id, firstCompanion.id);
    database.close();

    expect(() => runFinalDraftReview(first.id, firstCompanion.body, "linkedin_companion", firstCompanion.id)).toThrow(/stale or unlinked/i);
    expect(() => checkExactDraftVoice(first.id, { draftVersionId: firstCompanion.id, format: "linkedin_companion" })).toThrow(/stale or unlinked/i);
    expect(() => publishIdea(first.id, {
      platform: "linkedin", finalText: firstCompanion.body,
      draftVersionId: firstCompanion.id, draftFormat: "linkedin_companion", voiceCheckAcknowledged: true,
    })).toThrow(/stale or unlinked/i);
  });

  it("records Substack and LinkedIn versions independently for a dual-output plan", () => {
    const created = createIdea({ rawNotes: "A Substack article about accountable ownership in enterprise AI pilots." });
    updateIdea(created.id, { publicationPlan: "substack_linkedin" });
    developIdea(created.id, { useBestJudgment: true, answers: [] });
    runLeanBoard(created.id);
    const withCompanion = createLinkedinCompanion(created.id);
    const article = publishIdea(created.id, {
      platform: "substack",
      finalText: withCompanion.canonicalDraft!.body,
      draftVersionId: withCompanion.canonicalDraft!.id,
      draftFormat: "canonical",
      voiceCheckAcknowledged: true,
    });
    const complete = publishIdea(created.id, {
      platform: "linkedin",
      finalText: article.linkedinCompanion!.body,
      draftVersionId: article.linkedinCompanion!.id,
      draftFormat: "linkedin_companion",
      voiceCheckAcknowledged: true,
    });
    expect(complete.publications).toEqual(expect.arrayContaining([
      expect.objectContaining({ platform: "substack", draftVersionId: withCompanion.canonicalDraft!.id }),
      expect.objectContaining({ platform: "linkedin", draftVersionId: article.linkedinCompanion!.id }),
    ]));
  });

  it("keeps queue changes and a long simulated review history version-linked", () => {
    const first = createIdea({ rawNotes: "First queue item about operational discipline." });
    const second = createIdea({ rawNotes: "Second queue item about AI maturity." });
    expect(updateIdea(first.id, { title: "A clearer working title", status: "parked" }).status).toBe("parked");
    expect(getIdea(first.id)?.title).toBe("A clearer working title");
    expect(updateIdea(first.id, { status: "inbox" }).status).toBe("inbox");
    updateIdea(first.id, { priority: 20_000 });
    updateIdea(second.id, { priority: 10_000 });
    expect(moveIdea(first.id, "down").id).toBe(first.id);
    expect(listIdeas().filter((idea) => [first.id, second.id].includes(idea.id)).map((idea) => idea.id)).toEqual([
      second.id,
      first.id,
    ]);

    developIdea(first.id, { useBestJudgment: true, answers: [] });
    const initial = runLeanBoard(first.id);
    const initialRunId = initial.editorialBrief?.runId;
    expect(initialRunId).toBeTruthy();

    let latest = initial;
    for (let pass = 1; pass <= 10; pass += 1) {
      const passBody = `Draft pass ${pass}. The operating model matters because a concrete example makes the claim testable. What would change in your organization?`;
      const passDraft = saveEditedDraft(first.id, passBody);
      latest = runFinalDraftReview(
        first.id,
        passBody,
        "linkedin",
        passDraft.draft!.id,
      );
    }
    const reloaded = getIdea(first.id)!;
    expect(reloaded.editorialBrief?.runId).toBe(initialRunId);
    expect(latest.finalReview?.draftVersionId).toBe(latest.draft?.id);
    expect(reloaded.reviewHistory).toHaveLength(11);
    expect(reloaded.reviewHistory.filter((entry) => entry.reviewType === "final_draft")).toHaveLength(10);
    expect(new Set(reloaded.reviewHistory.map((entry) => entry.draftVersionId)).size).toBeGreaterThan(9);
  });
});
