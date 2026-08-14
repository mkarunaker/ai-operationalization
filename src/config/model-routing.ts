import type { AgentRole } from "@/domain/roles";

/**
 * Committed, non-secret model policy. Change this file when the intended
 * provider or capability tier changes. Actual model IDs and all credentials
 * remain in .env.local so they can change without a source-code edit.
 */
export type ModelTier = "low" | "medium" | "high";
export type LiveProviderName = "anthropic" | "openai" | "zenmux";
export type LiveBoardQualityProfile = "balanced" | "frontier_content";

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

const liveBoardProfileRoles: readonly AgentRole[] = ["strategist", "skeptic", "editor", "synthesizer", "initial_drafter", "final_drafter"];

export const LIVE_BOARD_QUALITY_PROFILES: Record<LiveBoardQualityProfile, {
  label: string;
  description: string;
  tierForRole: Partial<Record<AgentRole, ModelTier>>;
}> = {
  balanced: {
    label: "Balanced quality",
    description: "Uses the Terra route for Board judgment and the main draft, with the Luna route for the derived short post.",
    tierForRole: Object.fromEntries(liveBoardProfileRoles.map((role) => [role, defaultTierForRole[role]])) as Partial<Record<AgentRole, ModelTier>>,
  },
  frontier_content: {
    label: "Frontier content",
    description: "Uses the Sol route only for the main draft; Board reviews and any derived short post stay on the Luna route to remain within the hard run ceiling.",
    tierForRole: {
      strategist: "low",
      skeptic: "low",
      editor: "low",
      synthesizer: "low",
      initial_drafter: "high",
      final_drafter: "low",
    },
  },
};

export const DEFAULT_LIVE_BOARD_QUALITY_PROFILE: LiveBoardQualityProfile = "balanced";

export function resolveLiveBoardQualityProfile(value: unknown): LiveBoardQualityProfile {
  if (value === undefined) return DEFAULT_LIVE_BOARD_QUALITY_PROFILE;
  if (value === "balanced" || value === "frontier_content") return value;
  throw new Error("Select a supported live Board quality profile.");
}

export function tierForLiveBoardRole(role: AgentRole, profile: LiveBoardQualityProfile = DEFAULT_LIVE_BOARD_QUALITY_PROFILE): ModelTier {
  return LIVE_BOARD_QUALITY_PROFILES[profile].tierForRole[role] ?? defaultTierForRole[role];
}
