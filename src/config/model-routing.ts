import type { AgentRole } from "@/domain/roles";

/**
 * Committed, non-secret model policy. Change this file when the intended
 * provider or capability tier changes. Actual model IDs and all credentials
 * remain in .env.local so they can change without a source-code edit.
 */
export type ModelTier = "low" | "medium" | "high";
export type LiveProviderName = "anthropic" | "openai" | "zenmux";

export const providerForTier: Record<ModelTier, LiveProviderName> = {
  low: "openai",
  medium: "openai",
  high: "openai",
};

export const defaultTierForRole: Record<AgentRole, ModelTier> = {
  intake_clarification: "low",
  initial_drafter: "medium",
  strategist: "medium",
  skeptic: "medium",
  editor: "medium",
  synthesizer: "medium",
  originality_landscape: "low",
  final_drafter: "low",
  proofreader: "low",
};
