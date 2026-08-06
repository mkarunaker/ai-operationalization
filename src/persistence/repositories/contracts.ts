export interface TransactionRunner {
  transaction<T>(operation: () => T): T;
}

export interface VersionedRepository<T> {
  getById(id: string): Promise<T | null>;
  create(value: T): Promise<T>;
}

export interface ModelCallRepository {
  recordUsage(input: {
    provider: string;
    model: string;
    agentRole: string;
    estimatedCost: number;
    actualCost?: number;
    latencyMs?: number;
  }): Promise<void>;
}
