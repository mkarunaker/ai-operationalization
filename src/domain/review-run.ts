import type { AgentRole } from "@/domain/roles";

export const REVIEW_RUN_STATUSES = ["pending", "running", "completed", "partially_completed", "failed"] as const;
export type ReviewRunStatus = (typeof REVIEW_RUN_STATUSES)[number];

export const AGENT_REVIEW_STATUSES = ["pending", "running", "completed", "partially_structured", "failed"] as const;
export type AgentReviewStatus = (typeof AGENT_REVIEW_STATUSES)[number];

export type ReviewJob = { role: AgentRole; status: AgentReviewStatus };

export function deriveReviewRunStatus(jobs: ReviewJob[]): ReviewRunStatus {
  if (jobs.length === 0 || jobs.every((job) => job.status === "pending")) return "pending";
  if (jobs.some((job) => job.status === "running" || job.status === "pending")) return "running";
  if (jobs.every((job) => job.status === "failed")) return "failed";
  if (jobs.some((job) => job.status === "failed" || job.status === "partially_structured")) {
    return "partially_completed";
  }
  return "completed";
}
