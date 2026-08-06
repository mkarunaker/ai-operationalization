import { deriveReviewRunStatus, type AgentReviewStatus, type ReviewJob, type ReviewRunStatus } from "@/domain/review-run";
import type { AgentRole } from "@/domain/roles";

export type PersistedReviewJob = ReviewJob & { id: string };

export class ReviewJobStateMachine {
  private readonly jobs: PersistedReviewJob[];

  constructor(roles: AgentRole[]) {
    this.jobs = roles.map((role) => ({ id: crypto.randomUUID(), role, status: "pending" }));
  }

  transition(jobId: string, status: AgentReviewStatus): void {
    const job = this.jobs.find((candidate) => candidate.id === jobId);
    if (!job) throw new Error(`Unknown review job: ${jobId}`);
    if (job.status === "completed" || job.status === "failed") {
      throw new Error(`Cannot transition terminal review job: ${jobId}`);
    }
    job.status = status;
  }

  status(): ReviewRunStatus {
    return deriveReviewRunStatus(this.jobs);
  }

  snapshot(): PersistedReviewJob[] {
    return this.jobs.map((job) => ({ ...job }));
  }
}
