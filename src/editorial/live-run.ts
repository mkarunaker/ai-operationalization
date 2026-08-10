import { defaultRunBudgetUsd, estimateRouteCost, maximumRunBudgetUsd, modelEnvironmentVariable, routeFor, routeForProviderTier, type LiveProviderName, type ModelTier } from "@/ai/model-routing";
import { AnthropicMessagesProvider } from "@/ai/anthropic-provider";
import { OpenAIResponsesProvider } from "@/ai/openai-provider";
import { ZenMuxChatCompletionsProvider } from "@/ai/zenmux-provider";
import { assertDerivedShortRecoveryPolicy, estimateDerivedShortDraft, estimateGroundedEditorialRun, estimateSingleReviewerRun, hasSavedBoardReaderContract, plannedRolesForIdea, retryDerivedShortDraft, runGroundedEditorialRun, runSingleReviewer, type GroundedRunResult } from "@/editorial/grounded-run";
import type { ModelProvider, ModelRequest, ModelResponse, TokenUsage, CostEstimate } from "@/ai/provider";
import type { AgentRole } from "@/domain/roles";
import { assertPublishedWorkflowUnlocked, getIdea, proofreadRequestFor, runLiveProofreadForExactReview, type DraftFormat, type ReaderOutputContract } from "@/lean/service";
import { requestMaximumUsage } from "@/editorial/grounded-run";
import { getAppConfig } from "@/config/env";
import { getContentStatus } from "@/content/loader";

type ReviewerRole = "strategist" | "skeptic" | "editor";

function assertExternalProviderCallsEnabled() {
  if (process.env.EDITORIAL_TEST_DISABLE_PROVIDER_CALLS === "1")
    throw new Error("External provider calls are disabled for deterministic test execution.");
}

function providerFor(provider: LiveProviderName): ModelProvider {
  assertExternalProviderCallsEnabled();
  if (provider === "anthropic") return new AnthropicMessagesProvider();
  if (provider === "openai") return new OpenAIResponsesProvider();
  return new ZenMuxChatCompletionsProvider();
}

function providerAvailable(provider: LiveProviderName) {
  if (provider === "anthropic") return Boolean(process.env.ANTHROPIC_API_KEY);
  if (provider === "openai") return Boolean(process.env.OPENAI_API_KEY);
  return Boolean(process.env.ZENMUX_API_KEY);
}

function providerLabel(provider: LiveProviderName) {
  return provider === "zenmux" ? "ZenMux" : provider === "anthropic" ? "Anthropic" : "OpenAI";
}

function routeForPlannedRole(role: AgentRole) {
  // A derived short post is a bounded adaptation of the article, not a
  // second long-form drafting task. Keep that extra call low-cost.
  return routeFor(role);
}

function requireConfiguredModel(route: ReturnType<typeof routeFor>, variable: string) {
  const model = route.model.trim();
  if (!model) throw new Error(`${providerLabel(route.provider)} model is not configured. Set ${variable} in the local server environment.`);
  return model;
}

class RoutedLiveProvider implements ModelProvider {
  readonly name = "routed-live";

  async generate(request: ModelRequest): Promise<ModelResponse> {
    assertExternalProviderCallsEnabled();
    if (request.provider !== "anthropic" && request.provider !== "openai" && request.provider !== "zenmux")
      throw new Error("The requested live provider is not supported.");
    return providerFor(request.provider).generate(request);
  }

  estimateCost(usage: TokenUsage, model: string, context: { provider?: string; tier?: ModelTier } = {}): CostEstimate {
    if (!context.provider || !context.tier)
      throw new Error("Provider and tier are required for a live cost estimate.");
    if (context.provider !== "anthropic" && context.provider !== "openai" && context.provider !== "zenmux")
      throw new Error("The requested live provider is not supported for cost estimation.");
    const route = routeForProviderTier(context.provider, context.tier);
    if (route.model !== model)
      throw new Error(`Configured ${context.provider} ${context.tier}-tier model does not match the attempted model.`);
    return estimateRouteCost(route, usage);
  }
}

const routedLiveProvider = new RoutedLiveProvider();

/**
 * One source of truth for the proofreader disclosure and the two-attempt
 * reservation. The same exact bounded request is metered before each live
 * dispatch; multiplying the maximum by two accounts for its sole permitted
 * same-route structured-output repair.
 */
export function proofreaderReservationEstimate(body: string, readerContract: ReaderOutputContract, route = routeFor("proofreader")) {
  const request = proofreadRequestFor(body, route.provider, route.model, readerContract).request;
  return estimateRouteCost(route, requestMaximumUsage(request)).totalCost * 2;
}

export function liveRunPreview(ideaId: string) {
  // A missing local index is an expected setup state after a synthetic-data
  // reset. Keep the Board setup visible and disable only the actions that
  // truly need the source; do not throw from a page-load preview.
  const sourceStatus = getContentStatus(getAppConfig());
  const bokReady = sourceStatus.bok.status === "ready";
  const voiceReady = sourceStatus.voiceSkill.status === "ready";
  const hasSavedBoardContract = hasSavedBoardReaderContract(ideaId);
  const boardUnavailableReason = !bokReady
    ? "The Editorial Board needs a ready Book of Knowledge index. Index the configured source before starting a Board run."
    : !voiceReady
      ? "The Editorial Board needs a ready voice reference. Index the configured source before starting a Board run."
      : undefined;
  const route = routeFor("strategist");
  const reviewerRerunRoutes = {
    medium: routeFor("strategist", "medium"),
    high: routeFor("strategist", "high"),
  } as const;
  const estimatedCost = bokReady && voiceReady
    ? estimateGroundedEditorialRun(
        ideaId,
        routedLiveProvider,
        (role) => routeForPlannedRole(role).model,
        (role) => routeForPlannedRole(role).provider,
        (role) => routeForPlannedRole(role).tier,
      )
    : 0;
  const reviewerRerunEstimatedCost = bokReady
    ? estimateSingleReviewerRun(
        ideaId,
        routedLiveProvider,
        reviewerRerunRoutes.medium.model,
        reviewerRerunRoutes.medium.provider,
        reviewerRerunRoutes.medium.tier,
      )
    : 0;
  const highReviewerRerunEstimatedCost = bokReady
    ? estimateSingleReviewerRun(
        ideaId,
        routedLiveProvider,
        reviewerRerunRoutes.high.model,
        reviewerRerunRoutes.high.provider,
        reviewerRerunRoutes.high.tier,
      )
    : 0;
  // A stale derived short post needs the configured low-cost Final Drafter route. A
  // higher tier is an explicit author-selected recovery escalation only.
  const derivedShortRefreshRoute = routeForPlannedRole("final_drafter");
  const derivedShortRefreshEstimatedCost = voiceReady
    ? estimateDerivedShortDraft(
        ideaId,
        routedLiveProvider,
        derivedShortRefreshRoute.model,
        derivedShortRefreshRoute.provider,
        derivedShortRefreshRoute.tier,
      )
    : 0;
  const derivedShortEscalationRoute = routeFor("final_drafter", "medium");
  const derivedShortEscalationEstimatedCost = voiceReady
    ? estimateDerivedShortDraft(
        ideaId,
        routedLiveProvider,
        derivedShortEscalationRoute.model,
        derivedShortEscalationRoute.provider,
        derivedShortEscalationRoute.tier,
      )
    : 0;
  const plannedRoutes = plannedRolesForIdea(ideaId);
  const proofreaderRoute = routeFor("proofreader");
  const previewIdea = getIdea(ideaId);
  const readerContract = previewIdea?.grounding?.readerContract;
  const proofreaderEstimates = {
    short: previewIdea?.shortPost
      && readerContract ? proofreaderReservationEstimate(previewIdea.shortPost.body, readerContract, proofreaderRoute)
      : 0,
    article: previewIdea?.article
      && readerContract ? proofreaderReservationEstimate(previewIdea.article.body, readerContract, proofreaderRoute)
      : 0,
    derived_short: previewIdea?.derivedShortPost
      && readerContract ? proofreaderReservationEstimate(previewIdea.derivedShortPost.body, readerContract, proofreaderRoute)
      : 0,
  };
  return {
    provider: route.provider,
    model: route.model || "Model configuration required",
    tier: route.tier,
    budgetCap: defaultRunBudgetUsd(),
    maximumBudgetCap: maximumRunBudgetUsd(),
    pricingAssumption: route.pricingAssumption,
    source: { boardReady: bokReady && voiceReady, unavailableReason: boardUnavailableReason, hasSavedBoardContract },
    available: bokReady && voiceReady && plannedRoutes.every((role) => {
      const planned = routeForPlannedRole(role);
      return providerAvailable(planned.provider) && Boolean(planned.model);
    }),
    estimatedCost,
    planned: plannedRoutes.map((role) => {
      const planned = routeForPlannedRole(role);
      return { role, provider: planned.provider, model: planned.model || "Model configuration required", tier: planned.tier };
    }),
    proofreader: {
      provider: proofreaderRoute.provider,
      model: proofreaderRoute.model || "Model configuration required",
      tier: proofreaderRoute.tier,
      estimates: proofreaderEstimates,
      // A configured provider alone is not enough: live proofread is bound to
      // the immutable Board manifest and must remain deterministic until one
      // exists for this idea.
      available: hasSavedBoardContract && Boolean(readerContract) && providerAvailable(proofreaderRoute.provider) && Boolean(proofreaderRoute.model),
    },
    reviewerReruns: {
      medium: {
        provider: reviewerRerunRoutes.medium.provider,
        model: reviewerRerunRoutes.medium.model,
        tier: reviewerRerunRoutes.medium.tier,
        estimatedCost: reviewerRerunEstimatedCost,
        available: hasSavedBoardContract && bokReady && providerAvailable(reviewerRerunRoutes.medium.provider) && Boolean(reviewerRerunRoutes.medium.model),
      },
      high: {
        provider: reviewerRerunRoutes.high.provider,
        model: reviewerRerunRoutes.high.model,
        tier: reviewerRerunRoutes.high.tier,
        estimatedCost: highReviewerRerunEstimatedCost,
        available: hasSavedBoardContract && bokReady && providerAvailable(reviewerRerunRoutes.high.provider) && Boolean(reviewerRerunRoutes.high.model),
      },
    },
    derivedShortRefresh: {
      provider: derivedShortRefreshRoute.provider,
      model: derivedShortRefreshRoute.model || "Model configuration required",
      tier: derivedShortRefreshRoute.tier,
      estimatedCost: derivedShortRefreshEstimatedCost,
        available: hasSavedBoardContract && voiceReady && providerAvailable(derivedShortRefreshRoute.provider) && Boolean(derivedShortRefreshRoute.model),
    },
    derivedShortEscalation: {
      provider: derivedShortEscalationRoute.provider,
      model: derivedShortEscalationRoute.model || "Model configuration required",
      tier: derivedShortEscalationRoute.tier,
      estimatedCost: derivedShortEscalationEstimatedCost,
        available: hasSavedBoardContract && voiceReady && providerAvailable(derivedShortEscalationRoute.provider) && Boolean(derivedShortEscalationRoute.model),
    },
  };
}

export async function runLiveEditorialRun(
  ideaId: string,
  input: { budgetCap?: number; tier?: ModelTier } = {},
): Promise<GroundedRunResult> {
  assertPublishedWorkflowUnlocked(ideaId);
  const strategistTierOverride = input.tier;
  const allRoutes = plannedRolesForIdea(ideaId);
  for (const role of allRoutes) {
    const planned = role === "strategist" ? routeFor(role, strategistTierOverride) : routeForPlannedRole(role);
    requireConfiguredModel(planned, modelEnvironmentVariable(planned));
  }
  const budgetCap = input.budgetCap ?? defaultRunBudgetUsd();
  if (!Number.isFinite(budgetCap) || budgetCap <= 0)
    throw new Error("A positive per-run budget cap is required for a live editorial run.");
  if (budgetCap > maximumRunBudgetUsd())
    throw new Error(`The live editorial run cap cannot exceed $${maximumRunBudgetUsd().toFixed(2)}.`);
  return runGroundedEditorialRun(ideaId, routedLiveProvider, {
    executionMode: "live",
    budgetCap,
    modelForRole: (role: AgentRole) => (role === "strategist" ? routeFor(role, strategistTierOverride) : routeForPlannedRole(role)).model,
    providerForRole: (role: AgentRole) => (role === "strategist" ? routeFor(role, strategistTierOverride) : routeForPlannedRole(role)).provider,
    tierForRole: (role: AgentRole) => (role === "strategist" ? routeFor(role, strategistTierOverride) : routeForPlannedRole(role)).tier,
    pricingAssumption: "Per-role provider and model pricing assumptions are recorded in the run provenance and each model call.",
    pricingAssumptionForRole: (role: AgentRole) => (role === "strategist" ? routeFor(role, strategistTierOverride) : routeForPlannedRole(role)).pricingAssumption,
  });
}

export async function rerunLiveReviewer(
  ideaId: string,
  role: ReviewerRole,
  input: { budgetCap?: number; tier?: Exclude<ModelTier, "low">; escalationReason?: string } = {},
) {
  assertPublishedWorkflowUnlocked(ideaId);
  const tier = input.tier ?? "medium";
  const route = routeFor(role, tier);
  const model = requireConfiguredModel(route, modelEnvironmentVariable(route));
  const budgetCap = input.budgetCap ?? defaultRunBudgetUsd();
  if (!Number.isFinite(budgetCap) || budgetCap <= 0)
    throw new Error("A positive per-run budget cap is required for a reviewer rerun.");
  if (budgetCap > maximumRunBudgetUsd())
    throw new Error(`The reviewer rerun cap cannot exceed $${maximumRunBudgetUsd().toFixed(2)}.`);
  return runSingleReviewer(ideaId, role, providerFor(route.provider), {
    model,
    tier,
    budgetCap,
    pricingAssumption: route.pricingAssumption,
    escalationReason:
      input.escalationReason ?? `User explicitly selected a ${tier}-tier rerun for the ${role} review.`,
  });
}

export async function retryLiveDerivedShort(
  ideaId: string,
  input: { budgetCap?: number; tier?: "low" | "medium"; escalationReason?: string; recoveryKind?: "refresh" | "retry" | "escalation" } = {},
) {
  const tier = input.tier ?? "low";
  // A medium model is never an implied escalation. Callers must name that
  // governed action and provide its reason explicitly.
  const recoveryKind = input.recoveryKind ?? "retry";
  const recovery = assertDerivedShortRecoveryPolicy({ tier, recoveryKind, escalationReason: input.escalationReason });
  const route = routeFor("final_drafter", tier);
  const model = requireConfiguredModel(route, modelEnvironmentVariable(route));
  const budgetCap = input.budgetCap ?? defaultRunBudgetUsd();
  if (!Number.isFinite(budgetCap) || budgetCap <= 0) throw new Error("A positive per-run budget cap is required for the derived-short retry.");
  if (budgetCap > maximumRunBudgetUsd()) throw new Error(`The derived-short retry cap cannot exceed $${maximumRunBudgetUsd().toFixed(2)}.`);
  return retryDerivedShortDraft(ideaId, routedLiveProvider, {
    model,
    providerName: route.provider,
    tier: route.tier,
    budgetCap,
    pricingAssumption: route.pricingAssumption,
    recoveryKind: recovery.recoveryKind,
    escalationReason: recovery.escalationReason,
  });
}

export async function runLiveProofreadReview(ideaId: string, input: { draftVersionId: string; format: DraftFormat; budgetCap?: number }) {
  const route = routeFor("proofreader");
  requireConfiguredModel(route, modelEnvironmentVariable(route));
  const budgetCap = input.budgetCap ?? defaultRunBudgetUsd();
  if (!Number.isFinite(budgetCap) || budgetCap <= 0 || budgetCap > maximumRunBudgetUsd()) throw new Error("A valid proofread budget cap is required.");
  return runLiveProofreadForExactReview(ideaId, { ...input, budgetCap });
}
