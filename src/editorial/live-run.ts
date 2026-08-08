import { defaultRunBudgetUsd, estimateRouteCost, maximumRunBudgetUsd, modelEnvironmentVariable, routeFor, routeForProviderTier, type LiveProviderName, type ModelTier } from "@/ai/model-routing";
import { AnthropicMessagesProvider } from "@/ai/anthropic-provider";
import { OpenAIResponsesProvider } from "@/ai/openai-provider";
import { ZenMuxChatCompletionsProvider } from "@/ai/zenmux-provider";
import { estimateGroundedEditorialRun, estimateSingleReviewerRun, runGroundedEditorialRun, runSingleReviewer, type GroundedRunResult } from "@/editorial/grounded-run";
import type { ModelProvider, ModelRequest, ModelResponse, TokenUsage, CostEstimate } from "@/ai/provider";
import type { AgentRole } from "@/domain/roles";
import { assertPublishedWorkflowUnlocked } from "@/lean/service";

type ReviewerRole = "strategist" | "skeptic" | "editor";

function providerFor(provider: LiveProviderName): ModelProvider {
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

function requireConfiguredModel(route: ReturnType<typeof routeFor>, variable: string) {
  const model = route.model.trim();
  if (!model) throw new Error(`${providerLabel(route.provider)} model is not configured. Set ${variable} in the local server environment.`);
  return model;
}

class RoutedLiveProvider implements ModelProvider {
  readonly name = "routed-live";

  async generate(request: ModelRequest): Promise<ModelResponse> {
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

export function liveRunPreview(ideaId: string) {
  const route = routeFor("strategist");
  const reviewerRerunRoutes = {
    medium: routeFor("strategist", "medium"),
    high: routeFor("strategist", "high"),
  } as const;
  const estimatedCost = estimateGroundedEditorialRun(
    ideaId,
    routedLiveProvider,
    (role) => routeFor(role).model,
    (role) => routeFor(role).provider,
    (role) => routeFor(role).tier,
  );
  const reviewerRerunEstimatedCost = estimateSingleReviewerRun(
    ideaId,
    routedLiveProvider,
    reviewerRerunRoutes.medium.model,
    reviewerRerunRoutes.medium.provider,
    reviewerRerunRoutes.medium.tier,
  );
  const highReviewerRerunEstimatedCost = estimateSingleReviewerRun(
    ideaId,
    routedLiveProvider,
    reviewerRerunRoutes.high.model,
    reviewerRerunRoutes.high.provider,
    reviewerRerunRoutes.high.tier,
  );
  const plannedRoutes = ["strategist", "skeptic", "editor", "synthesizer", "initial_drafter"] as const;
  return {
    provider: route.provider,
    model: route.model || "Model configuration required",
    tier: route.tier,
    budgetCap: defaultRunBudgetUsd(),
    maximumBudgetCap: maximumRunBudgetUsd(),
    pricingAssumption: route.pricingAssumption,
    available: plannedRoutes.every((role) => {
      const planned = routeFor(role);
      return providerAvailable(planned.provider) && Boolean(planned.model);
    }),
    estimatedCost,
    planned: plannedRoutes.map((role) => {
      const planned = routeFor(role);
      return { role, provider: planned.provider, model: planned.model || "Model configuration required", tier: planned.tier };
    }),
    reviewerReruns: {
      medium: {
        provider: reviewerRerunRoutes.medium.provider,
        model: reviewerRerunRoutes.medium.model,
        tier: reviewerRerunRoutes.medium.tier,
        estimatedCost: reviewerRerunEstimatedCost,
        available: providerAvailable(reviewerRerunRoutes.medium.provider) && Boolean(reviewerRerunRoutes.medium.model),
      },
      high: {
        provider: reviewerRerunRoutes.high.provider,
        model: reviewerRerunRoutes.high.model,
        tier: reviewerRerunRoutes.high.tier,
        estimatedCost: highReviewerRerunEstimatedCost,
        available: providerAvailable(reviewerRerunRoutes.high.provider) && Boolean(reviewerRerunRoutes.high.model),
      },
    },
  };
}

export async function runLiveEditorialRun(
  ideaId: string,
  input: { budgetCap?: number; tier?: ModelTier } = {},
): Promise<GroundedRunResult> {
  assertPublishedWorkflowUnlocked(ideaId);
  const strategistTierOverride = input.tier;
  const allRoutes = ["strategist", "skeptic", "editor", "synthesizer", "initial_drafter"] as const;
  for (const role of allRoutes) {
    const planned = routeFor(role, role === "strategist" ? strategistTierOverride : undefined);
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
    modelForRole: (role: AgentRole) => routeFor(role, role === "strategist" ? strategistTierOverride : undefined).model,
    providerForRole: (role: AgentRole) => routeFor(role, role === "strategist" ? strategistTierOverride : undefined).provider,
    tierForRole: (role: AgentRole) => routeFor(role, role === "strategist" ? strategistTierOverride : undefined).tier,
    pricingAssumption: "Per-role provider and model pricing assumptions are recorded in the run provenance and each model call.",
    pricingAssumptionForRole: (role: AgentRole) => routeFor(role, role === "strategist" ? strategistTierOverride : undefined).pricingAssumption,
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
