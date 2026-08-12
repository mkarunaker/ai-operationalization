import type { AgentRole } from "@/domain/roles";
import type { CostEstimate, TokenUsage } from "@/ai/provider";
import { defaultTierForRole, providerForTier, type LiveProviderName, type ModelTier } from "@/config/model-routing";

export type { LiveProviderName, ModelTier } from "@/config/model-routing";

export type ModelRoute = {
  provider: LiveProviderName;
  model: string;
  tier: ModelTier;
  inputUsdPerMillion: number;
  cachedInputUsdPerMillion: number;
  outputUsdPerMillion: number;
  pricingAssumption: string;
};

export const DEFAULT_RUN_BUDGET_USD = 0.05;
export const MAXIMUM_RUN_BUDGET_USD = 0.25;

const openaiPricing = (modelClass: string, input: string, cached: string, output: string) =>
  `OpenAI ${modelClass} standard API pricing assumption: USD ${input} / MTok input, USD ${cached} / MTok cached input, and USD ${output} / MTok output. Reasoning tokens are included in reported output tokens, not charged a second time. Verify against OpenAI billing.`;

const openaiRoutes: Record<ModelTier, ModelRoute> = {
  low: {
    provider: "openai",
    model: process.env.OPENAI_LOW_MODEL ?? "",
    tier: "low",
    inputUsdPerMillion: Number(process.env.OPENAI_LOW_INPUT_USD_PER_MILLION ?? "0.05"),
    cachedInputUsdPerMillion: Number(process.env.OPENAI_LOW_CACHED_INPUT_USD_PER_MILLION ?? "0.005"),
    outputUsdPerMillion: Number(process.env.OPENAI_LOW_OUTPUT_USD_PER_MILLION ?? "0.4"),
    pricingAssumption: openaiPricing("GPT-5 nano", "0.05", "0.005", "0.40"),
  },
  medium: {
    provider: "openai",
    model: process.env.OPENAI_MEDIUM_MODEL ?? "",
    tier: "medium",
    inputUsdPerMillion: Number(process.env.OPENAI_MEDIUM_INPUT_USD_PER_MILLION ?? "0.2"),
    cachedInputUsdPerMillion: Number(process.env.OPENAI_MEDIUM_CACHED_INPUT_USD_PER_MILLION ?? "0.02"),
    outputUsdPerMillion: Number(process.env.OPENAI_MEDIUM_OUTPUT_USD_PER_MILLION ?? "1.2"),
    pricingAssumption: openaiPricing("GPT-5.6 Luna", "0.20", "0.02", "1.20"),
  },
  high: {
    provider: "openai",
    model: process.env.OPENAI_HIGH_MODEL ?? "",
    tier: "high",
    inputUsdPerMillion: Number(process.env.OPENAI_HIGH_INPUT_USD_PER_MILLION ?? "0.75"),
    cachedInputUsdPerMillion: Number(process.env.OPENAI_HIGH_CACHED_INPUT_USD_PER_MILLION ?? "0.075"),
    outputUsdPerMillion: Number(process.env.OPENAI_HIGH_OUTPUT_USD_PER_MILLION ?? "4.5"),
    pricingAssumption: openaiPricing("GPT-5.4 mini", "0.75", "0.075", "4.50"),
  },
};

const anthropicPricing =
  "Anthropic Claude Sonnet 4 standard API pricing assumption: USD 3.00 / MTok input, USD 0.30 / MTok cache read, and USD 15.00 / MTok output. Verify against Anthropic billing.";

const anthropicRoutes: Record<ModelTier, ModelRoute> = {
  low: {
    provider: "anthropic",
    model: process.env.ANTHROPIC_LOW_MODEL ?? "",
    tier: "low",
    inputUsdPerMillion: Number(process.env.ANTHROPIC_LOW_INPUT_USD_PER_MILLION ?? "3"),
    cachedInputUsdPerMillion: Number(process.env.ANTHROPIC_LOW_CACHED_INPUT_USD_PER_MILLION ?? "0.3"),
    outputUsdPerMillion: Number(process.env.ANTHROPIC_LOW_OUTPUT_USD_PER_MILLION ?? "15"),
    pricingAssumption: anthropicPricing,
  },
  medium: {
    provider: "anthropic",
    model: process.env.ANTHROPIC_MEDIUM_MODEL ?? "",
    tier: "medium",
    inputUsdPerMillion: Number(process.env.ANTHROPIC_MEDIUM_INPUT_USD_PER_MILLION ?? "3"),
    cachedInputUsdPerMillion: Number(process.env.ANTHROPIC_MEDIUM_CACHED_INPUT_USD_PER_MILLION ?? "0.3"),
    outputUsdPerMillion: Number(process.env.ANTHROPIC_MEDIUM_OUTPUT_USD_PER_MILLION ?? "15"),
    pricingAssumption: anthropicPricing,
  },
  high: {
    provider: "anthropic",
    model: process.env.ANTHROPIC_HIGH_MODEL ?? "",
    tier: "high",
    inputUsdPerMillion: Number(process.env.ANTHROPIC_HIGH_INPUT_USD_PER_MILLION ?? "3"),
    cachedInputUsdPerMillion: Number(process.env.ANTHROPIC_HIGH_CACHED_INPUT_USD_PER_MILLION ?? "0.3"),
    outputUsdPerMillion: Number(process.env.ANTHROPIC_HIGH_OUTPUT_USD_PER_MILLION ?? "15"),
    pricingAssumption: anthropicPricing,
  },
};

const zenmuxPricing =
  "ZenMux model pricing is an operator-maintained local estimate. Set the ZENMUX_*_USD_PER_MILLION values to the selected model's current ZenMux price, then reconcile against ZenMux generation details.";

function zenmuxRoute(tier: ModelTier, defaults: { input: string; cached: string; output: string }): ModelRoute {
  const prefix = `ZENMUX_${tier.toUpperCase()}`;
  return {
    provider: "zenmux",
    model: process.env[`${prefix}_MODEL`] ?? "",
    tier,
    inputUsdPerMillion: Number(process.env[`${prefix}_INPUT_USD_PER_MILLION`] ?? defaults.input),
    cachedInputUsdPerMillion: Number(process.env[`${prefix}_CACHED_INPUT_USD_PER_MILLION`] ?? defaults.cached),
    outputUsdPerMillion: Number(process.env[`${prefix}_OUTPUT_USD_PER_MILLION`] ?? defaults.output),
    pricingAssumption: zenmuxPricing,
  };
}

const zenmuxRoutes: Record<ModelTier, ModelRoute> = {
  // These conservative defaults are estimates only. Model IDs remain explicit
  // runtime configuration because ZenMux's catalog and prices can change.
  low: zenmuxRoute("low", { input: "1", cached: "0.1", output: "5" }),
  medium: zenmuxRoute("medium", { input: "3", cached: "0.3", output: "15" }),
  high: zenmuxRoute("high", { input: "10", cached: "1", output: "50" }),
};

export function routeFor(role: AgentRole, override?: ModelTier): ModelRoute {
  const tier = override ?? defaultTierForRole[role];
  const provider = providerForTier[tier];
  return routeForProviderTier(provider, tier);
}

export function routeForProviderTier(provider: LiveProviderName, tier: ModelTier): ModelRoute {
  const routes = provider === "openai" ? openaiRoutes : provider === "anthropic" ? anthropicRoutes : zenmuxRoutes;
  const route = routes[tier];
  // Models are operator configuration rather than source constants. Resolve
  // the selected model at the server boundary so a restarted local process
  // and deterministic tests see the same route that dispatch and recovery
  // comparison enforce. Pricing remains the explicit route assumption.
  return { ...route, model: process.env[modelEnvironmentVariable(route)] ?? "" };
}

export function modelEnvironmentVariable(route: ModelRoute) {
  return `${route.provider.toUpperCase()}_${route.tier.toUpperCase()}_MODEL`;
}

export function estimateRouteCost(route: ModelRoute, usage: TokenUsage): CostEstimate {
  const rates = [route.inputUsdPerMillion, route.cachedInputUsdPerMillion, route.outputUsdPerMillion];
  if (rates.some((rate) => !Number.isFinite(rate) || rate < 0))
    throw new Error(`Pricing for ${route.provider} ${route.tier} is invalid. Configure finite, non-negative USD-per-million values.`);
  const inputTokens = usage.inputTokens ?? 0;
  const cachedTokens = usage.cachedInputTokens ?? 0;
  const outputTokens = usage.outputTokens ?? 0;
  const boundedCachedTokens = Math.min(inputTokens, cachedTokens);
  const inputCost = ((inputTokens - boundedCachedTokens) * route.inputUsdPerMillion + boundedCachedTokens * route.cachedInputUsdPerMillion) / 1_000_000;
  // Supported providers report reasoning tokens as a subset of output tokens.
  // Track that metric separately, but never bill it twice.
  const outputCost = (outputTokens * route.outputUsdPerMillion) / 1_000_000;
  return { inputCost, outputCost, totalCost: inputCost + outputCost, currency: "USD", estimated: true };
}

export function defaultRunBudgetUsd(): number {
  const value = Number(process.env.EDITORIAL_RUN_BUDGET_USD ?? String(DEFAULT_RUN_BUDGET_USD));
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_RUN_BUDGET_USD;
}

export function maximumRunBudgetUsd(): number {
  const value = Number(process.env.EDITORIAL_MAX_RUN_BUDGET_USD ?? String(MAXIMUM_RUN_BUDGET_USD));
  return Number.isFinite(value) && value > 0 ? value : MAXIMUM_RUN_BUDGET_USD;
}
