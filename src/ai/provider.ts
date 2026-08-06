import type { AgentRole } from "@/domain/roles";

export type ReasoningEffort = "low" | "medium" | "high";

export type ModelMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ModelRequest = {
  provider: string;
  model: string;
  messages: ModelMessage[];
  systemPrompt?: string;
  temperature?: number;
  maxOutputTokens?: number;
  responseFormat?: Record<string, unknown>;
  reasoningEffort?: ReasoningEffort;
  metadata?: {
    agentRole?: AgentRole;
    [key: string]: unknown;
  };
};

export type TokenUsage = {
  inputTokens?: number;
  outputTokens?: number;
  cachedInputTokens?: number;
  reasoningTokens?: number;
  totalTokens?: number;
};

export type CostEstimate = {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  currency: string;
  estimated: true;
};

export type ModelResponse = TokenUsage & {
  text: string;
  structuredOutput?: unknown;
  latencyMs?: number;
  providerRequestId?: string;
  model: string;
  provider: string;
  finishReason?: string;
  rawUsage?: Record<string, unknown>;
};

export type ModelStreamEvent = { type: "text_delta" | "completed" | "error"; value?: string };

export interface ModelProvider {
  readonly name: string;
  generate(request: ModelRequest): Promise<ModelResponse>;
  stream?(request: ModelRequest): AsyncIterable<ModelStreamEvent>;
  estimateCost?(usage: TokenUsage, model: string): CostEstimate;
  listModels?(): Promise<Array<{ id: string; displayName: string }>>;
}
