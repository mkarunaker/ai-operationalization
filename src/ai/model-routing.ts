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

export const DEFAULT_RUN_BUDGET_USD = 0.75;
export const MAXIMUM_RUN_BUDGET_USD = 0.75;
// The initial draft is the only long structured response in the standard
// Board run. Keep a generous default for provider-managed reasoning while
// retaining a hard server-side ceiling that cost reservation can enforce.
export const DEFAULT_INITIAL_DRAFTER_OUTPUT_TOKENS = 2_400;
export const MINIMUM_INITIAL_DRAFTER_OUTPUT_TOKENS = 2_000;
export const MAXIMUM_INITIAL_DRAFTER_OUTPUT_TOKENS = 9_000;
// Responses API reasoning tokens share the output allowance with visible
// structured output. Reserve enough room for low-effort reasoning plus the
// validated reviewer JSON while retaining a bounded server-owned ceiling.
export const DEFAULT_REVIEWER_OUTPUT_TOKENS = 1_600;
export const MINIMUM_REVIEWER_OUTPUT_TOKENS = 1_200;
export const MAXIMUM_REVIEWER_OUTPUT_TOKENS = 3_000;
export const DEFAULT_SYNTHESIZER_OUTPUT_TOKENS = 1_600;
export const MINIMUM_SYNTHESIZER_OUTPUT_TOKENS = 1_600;
export const MAXIMUM_SYNTHESIZER_OUTPUT_TOKENS = 3_000;
export const DEFAULT_FINAL_DRAFTER_OUTPUT_TOKENS = 1_600;
export const MINIMUM_FINAL_DRAFTER_OUTPUT_TOKENS = 1_200;
export const MAXIMUM_FINAL_DRAFTER_OUTPUT_TOKENS = 9_000;
export const DEFAULT_PROOFREADER_OUTPUT_TOKENS = 1_600;
export const MINIMUM_PROOFREADER_OUTPUT_TOKENS = 1_200;
export const MAXIMUM_PROOFREADER_OUTPUT_TOKENS = 3_000;

function rangeAwareDraftAllowance(defaultTokens: number, maximumTokens: number, targetMaximumWords?: number) {
  if (!targetMaximumWords || !Number.isFinite(targetMaximumWords) || targetMaximumWords <= 0) return defaultTokens;
  // Publication words are not provider tokens. Reserve a conservative 1.5
  // tokens per requested word plus a bounded 700-token reasoning/JSON margin,
  // then round upward so the displayed reservation and dispatched request use
  // one stable server-owned value.
  const projected = Math.ceil((targetMaximumWords * 1.5 + 700) / 100) * 100;
  return Math.min(maximumTokens, Math.max(defaultTokens, projected));
}

const openaiPricing = (modelClass: string, input: string, cached: string, output: string) =>
  `OpenAI ${modelClass} standard API pricing assumption: USD ${input} / MTok input, USD ${cached} / MTok cached input, and USD ${output} / MTok output. Reasoning tokens are included in reported output tokens, not charged a second time. Verify against OpenAI billing.`;

const documentedOpenAiModelForTier: Record<ModelTier, string> = {
  low: "gpt-5.6-luna",
  medium: "gpt-5.6-terra",
  high: "gpt-5.6-sol",
};

const openaiRoutes: Record<ModelTier, ModelRoute> = {
  low: {
    provider: "openai",
    model: process.env.OPENAI_LOW_MODEL ?? "",
    tier: "low",
    inputUsdPerMillion: Number(process.env.OPENAI_LOW_INPUT_USD_PER_MILLION ?? "0.2"),
    cachedInputUsdPerMillion: Number(process.env.OPENAI_LOW_CACHED_INPUT_USD_PER_MILLION ?? "0.02"),
    outputUsdPerMillion: Number(process.env.OPENAI_LOW_OUTPUT_USD_PER_MILLION ?? "1.2"),
    pricingAssumption: openaiPricing("GPT-5.6 Luna", "0.20", "0.02", "1.20"),
  },
  medium: {
    provider: "openai",
    model: process.env.OPENAI_MEDIUM_MODEL ?? "",
    tier: "medium",
    inputUsdPerMillion: Number(process.env.OPENAI_MEDIUM_INPUT_USD_PER_MILLION ?? "2"),
    cachedInputUsdPerMillion: Number(process.env.OPENAI_MEDIUM_CACHED_INPUT_USD_PER_MILLION ?? "0.2"),
    outputUsdPerMillion: Number(process.env.OPENAI_MEDIUM_OUTPUT_USD_PER_MILLION ?? "12"),
    pricingAssumption: openaiPricing("GPT-5.6 Terra", "2.00", "0.20", "12.00"),
  },
  high: {
    provider: "openai",
    model: process.env.OPENAI_HIGH_MODEL ?? "",
    tier: "high",
    inputUsdPerMillion: Number(process.env.OPENAI_HIGH_INPUT_USD_PER_MILLION ?? "5"),
    cachedInputUsdPerMillion: Number(process.env.OPENAI_HIGH_CACHED_INPUT_USD_PER_MILLION ?? "0.5"),
    outputUsdPerMillion: Number(process.env.OPENAI_HIGH_OUTPUT_USD_PER_MILLION ?? "30"),
    pricingAssumption: openaiPricing("GPT-5.6 Sol", "5.00", "0.50", "30.00"),
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
  const model = process.env[modelEnvironmentVariable(route)] ?? "";
  if (provider === "openai" && process.env.NODE_ENV !== "test" && model) {
    const expectedModel = documentedOpenAiModelForTier[tier];
    const pricePrefix = `OPENAI_${tier.toUpperCase()}`;
    const priceKeys = ["INPUT_USD_PER_MILLION", "CACHED_INPUT_USD_PER_MILLION", "OUTPUT_USD_PER_MILLION"];
    const hasEveryExplicitRate = priceKeys.every((suffix) => process.env[`${pricePrefix}_${suffix}`] !== undefined);
    const hasAnyExplicitRate = priceKeys.some((suffix) => process.env[`${pricePrefix}_${suffix}`] !== undefined);
    if (hasAnyExplicitRate && !hasEveryExplicitRate)
      throw new Error(`OpenAI ${tier}-tier pricing must set all three USD-per-million values or none of them.`);
    if (model !== expectedModel && !model.startsWith(`${expectedModel}-`) && !hasEveryExplicitRate)
      throw new Error(`OpenAI ${tier}-tier model pricing is not configured. Use ${expectedModel}, its dated snapshot, or set all three explicit ${pricePrefix}_*_USD_PER_MILLION values.`);
  }
  return { ...route, model };
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
  return Number.isFinite(value) && value > 0 ? Math.min(value, maximumRunBudgetUsd()) : DEFAULT_RUN_BUDGET_USD;
}

export function maximumRunBudgetUsd(): number {
  const value = Number(process.env.EDITORIAL_MAX_RUN_BUDGET_USD ?? String(MAXIMUM_RUN_BUDGET_USD));
  return Number.isFinite(value) && value > 0 ? Math.min(value, MAXIMUM_RUN_BUDGET_USD) : MAXIMUM_RUN_BUDGET_USD;
}

/**
 * A local operator may tune this server-only allowance without exposing a
 * draft-control to the browser. Invalid values fail closed before any live
 * estimate or provider request, and every Board snapshot records the value
 * actually used so a scoped retry cannot silently change it.
 */
export function initialDrafterOutputTokens(targetMaximumWords?: number): number {
  const raw = process.env.EDITORIAL_INITIAL_DRAFTER_MAX_OUTPUT_TOKENS;
  if (raw === undefined || raw.trim() === "")
    return rangeAwareDraftAllowance(DEFAULT_INITIAL_DRAFTER_OUTPUT_TOKENS, MAXIMUM_INITIAL_DRAFTER_OUTPUT_TOKENS, targetMaximumWords);
  const value = Number(raw);
  if (!Number.isInteger(value) || value < MINIMUM_INITIAL_DRAFTER_OUTPUT_TOKENS || value > MAXIMUM_INITIAL_DRAFTER_OUTPUT_TOKENS)
    throw new Error(`Initial Drafter output allowance must be an integer between ${MINIMUM_INITIAL_DRAFTER_OUTPUT_TOKENS} and ${MAXIMUM_INITIAL_DRAFTER_OUTPUT_TOKENS}.`);
  return value;
}

/** Resolve the bounded Final Drafter allowance for the saved short-post range. */
export function finalDrafterOutputTokens(targetMaximumWords?: number): number {
  const raw = process.env.EDITORIAL_FINAL_DRAFTER_MAX_OUTPUT_TOKENS;
  if (raw === undefined || raw.trim() === "")
    return rangeAwareDraftAllowance(DEFAULT_FINAL_DRAFTER_OUTPUT_TOKENS, MAXIMUM_FINAL_DRAFTER_OUTPUT_TOKENS, targetMaximumWords);
  const value = Number(raw);
  if (!Number.isInteger(value) || value < MINIMUM_FINAL_DRAFTER_OUTPUT_TOKENS || value > MAXIMUM_FINAL_DRAFTER_OUTPUT_TOKENS)
    throw new Error(`Final Drafter output allowance must be an integer between ${MINIMUM_FINAL_DRAFTER_OUTPUT_TOKENS} and ${MAXIMUM_FINAL_DRAFTER_OUTPUT_TOKENS}.`);
  return value;
}

/** Resolve the bounded low-reasoning proofreader allowance. */
export function proofreaderOutputTokens(): number {
  const raw = process.env.EDITORIAL_PROOFREADER_MAX_OUTPUT_TOKENS;
  if (raw === undefined || raw.trim() === "") return DEFAULT_PROOFREADER_OUTPUT_TOKENS;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < MINIMUM_PROOFREADER_OUTPUT_TOKENS || value > MAXIMUM_PROOFREADER_OUTPUT_TOKENS)
    throw new Error(`Proofreader output allowance must be an integer between ${MINIMUM_PROOFREADER_OUTPUT_TOKENS} and ${MAXIMUM_PROOFREADER_OUTPUT_TOKENS}.`);
  return value;
}

/**
 * Resolve the server-owned allowance for Strategist, Skeptic, and Editor.
 * It is deliberately unavailable as a browser control; invalid operator
 * configuration fails before cost estimation or provider dispatch.
 */
export function reviewerOutputTokens(): number {
  const raw = process.env.EDITORIAL_REVIEWER_MAX_OUTPUT_TOKENS;
  if (raw === undefined || raw.trim() === "") return DEFAULT_REVIEWER_OUTPUT_TOKENS;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < MINIMUM_REVIEWER_OUTPUT_TOKENS || value > MAXIMUM_REVIEWER_OUTPUT_TOKENS)
    throw new Error(`Reviewer output allowance must be an integer between ${MINIMUM_REVIEWER_OUTPUT_TOKENS} and ${MAXIMUM_REVIEWER_OUTPUT_TOKENS}.`);
  return value;
}

/**
 * Resolve the server-owned Synthesizer allowance. Reasoning and visible
 * structured output share this bound, so the value is reserved in full and
 * recorded with the immutable Board route contract.
 */
export function synthesizerOutputTokens(): number {
  const raw = process.env.EDITORIAL_SYNTHESIZER_MAX_OUTPUT_TOKENS;
  if (raw === undefined || raw.trim() === "") return DEFAULT_SYNTHESIZER_OUTPUT_TOKENS;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < MINIMUM_SYNTHESIZER_OUTPUT_TOKENS || value > MAXIMUM_SYNTHESIZER_OUTPUT_TOKENS)
    throw new Error(`Synthesizer output allowance must be an integer between ${MINIMUM_SYNTHESIZER_OUTPUT_TOKENS} and ${MAXIMUM_SYNTHESIZER_OUTPUT_TOKENS}.`);
  return value;
}
