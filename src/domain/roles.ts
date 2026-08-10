export const AGENT_ROLES = [
  "intake_clarification",
  "initial_drafter",
  "strategist",
  "skeptic",
  "editor",
  "synthesizer",
  "originality_landscape",
  "final_drafter",
  "proofreader",
] as const;

export type AgentRole = (typeof AGENT_ROLES)[number];

export const CORE_EDITORIAL_BOARD_ROLES = ["strategist", "skeptic", "editor", "synthesizer"] as const;
export const OPTIONAL_AGENT_ROLES = ["originality_landscape"] as const;

export const AGENT_ROLE_METADATA: Record<AgentRole, { displayName: string; optional: boolean }> = {
  intake_clarification: { displayName: "Intake and Clarification Agent", optional: false },
  initial_drafter: { displayName: "Initial Drafting Agent", optional: false },
  strategist: { displayName: "Strategist", optional: false },
  skeptic: { displayName: "Skeptic", optional: false },
  editor: { displayName: "Editor", optional: false },
  synthesizer: { displayName: "Synthesizer", optional: false },
  originality_landscape: { displayName: "Originality and Landscape Reviewer", optional: true },
  final_drafter: { displayName: "Final Drafting Agent", optional: false },
  proofreader: { displayName: "Proofread and Clarity Reviewer", optional: false },
};
