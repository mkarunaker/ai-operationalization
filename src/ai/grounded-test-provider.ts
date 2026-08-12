import crypto from "node:crypto";
import type {
  CostEstimate,
  ModelProvider,
  ModelRequest,
  ModelResponse,
  TokenUsage,
} from "@/ai/provider";

type GroundedMetadata = {
  agentRole?: string;
  task?: "review" | "synthesis" | "draft" | "repair";
  draftSeed?: string;
  bokHeading?: string;
  bokFocus?: string;
  sourceFingerprint?: string;
  factualGaps?: string[];
  publicationTarget?: "short" | "article" | "derived_short";
  targetWordRange?: { min: number; max: number };
};

// This marker is a deterministic browser-fixture seam only. It proves that a
// locally persisted Initial-Drafter scaffolding rejection reaches the browser
// projection; it cannot select a live provider path.
const E2E_SCAFFOLDING_FAILURE_MARKER = "[[e2e_scaffolding_failure]]";

function words(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function fingerprint(request: ModelRequest) {
  const material = request.messages.map((message) => message.content).join("\n");
  return crypto.createHash("sha256").update(material).digest("hex").slice(0, 10);
}

function reviewOutput(role: string, marker: string, bokHeading?: string) {
  const sourceNote = bokHeading
    ? ` The selected BOK material includes ${bokHeading}.`
    : " No indexed BOK passage was available for this run.";
  const copy = {
    strategist: {
      summary: `The grounded material points to a useful operational decision, provided the post stays focused.${sourceNote}`,
      recommendation: "State the one operating decision or behavior the reader should reconsider.",
    },
    skeptic: {
      summary: `The claim needs a visible boundary and support before it is presented broadly.${sourceNote}`,
      recommendation: "Separate the observation from a universal claim and identify what evidence would change it.",
    },
    editor: {
      summary: `The point can be clearer when the opening observation leads directly to its practical implication.${sourceNote}`,
      recommendation: "Use direct language, short paragraphs where they help, and an inviting close tied to the point.",
    },
  }[role] ?? {
    summary: "The grounded material requires an editorial decision.",
    recommendation: "Make the next revision specific.",
  };
  return {
    role,
    summary: `${copy.summary} Grounding marker: ${marker}.`,
    confidence: { score: 0.72, reason: "Deterministic grounded test output; factual claims still require human validation." },
    findings: [
      {
        category: "evidence",
        severity: "medium",
        location: "overall",
        observation: "The run cannot independently verify factual claims.",
        recommendation: "Keep the evidence boundary visible or add a user-supplied example.",
        requires_user_judgment: true,
      },
    ],
    strengths: ["The captured idea and selected BOK passages were supplied to the reviewer."],
    risks: ["This deterministic test provider does not establish factual truth."],
    top_recommendations: [copy.recommendation],
    recommended_action: "revise",
  };
}

function draftOutput(metadata: GroundedMetadata, forceScaffoldingFailure = false) {
  // This local fixture demonstrates the same publication boundary used for
  // provider output: no capture/source copy may appear in reader-facing prose.
  const range = metadata.targetWordRange ?? (metadata.publicationTarget === "article" ? { min: 800, max: 1100 } : { min: 180, max: 300 });
  const sentences = metadata.publicationTarget === "derived_short"
    ? [
        "AI work becomes useful when it changes an observable part of the work.",
        "A clear owner can decide whether the change improves the result.",
        "The practical test is whether people can see the outcome getting better.",
        "What would you check before treating this as dependable work?",
      ]
    : [
        "Capability is only the starting point for useful AI work.",
        "The durable question is what changes in the work people actually do.",
        "A clear owner, sensible controls, and an observable outcome make that question practical.",
        "Teams can name the baseline, decide what evidence would justify continuing, and notice when the work needs redesign.",
        "That approach keeps experimentation useful without mistaking visible activity for progress.",
        "What operating change would make this initiative worth sustaining?",
      ];
  const outputWords: string[] = [];
  let sentence = 0;
  const prefix = forceScaffoldingFailure ? ["The", "following", "themes"] : [];
  while (outputWords.length + prefix.length < range.min) {
    outputWords.push(...sentences[sentence % sentences.length]!.split(/\s+/));
    sentence += 1;
  }
  const body = [...prefix, ...outputWords].slice(0, range.max).join(" ");
  return {
    role: metadata.agentRole === "final_drafter" ? "final_drafter" : "initial_drafter",
    body,
    factual_gaps: metadata.factualGaps ?? ["Add a concrete example or label the point as an observation before publishing."],
    voice_rules_applied: ["no em dashes", "direct language", "uncertainty retained"],
  };
}

export class GroundedTestProvider implements ModelProvider {
  readonly name = "grounded-test";

  async generate(request: ModelRequest): Promise<ModelResponse> {
    const metadata = (request.metadata ?? {}) as GroundedMetadata & { agentRole?: string };
    const marker = metadata.sourceFingerprint ?? fingerprint(request);
    const task = metadata.task ?? "review";
    const forceScaffoldingFailure = metadata.agentRole === "initial_drafter"
      && request.messages.some((message) => message.content.includes(E2E_SCAFFOLDING_FAILURE_MARKER));
    const structuredOutput =
      task === "draft"
        ? draftOutput(metadata, forceScaffoldingFailure)
        : task === "synthesis"
          ? {
              role: "synthesizer",
              summary: `The independent reviews agree that the post needs a focused operational claim and a visible evidence boundary. Grounding marker: ${marker}.`,
              central_thesis: "The post should make one operational consequence of the idea clear before it argues for AI activity.",
              strongest: "The starting point connects AI activity to a practical operating question.",
              unclear: "The claim still needs a specific boundary or example.",
              counterargument: "The observation may not hold when the workflow already has clear ownership, context, and measurement.",
              evidence_needed: "Add one concrete example, source, or clearly labelled uncertainty.",
              recommended_changes: [
                "Lead with the observation and name the operating consequence.",
                "Keep the evidence boundary visible.",
              ],
              next_step: "Review the grounded working draft, then make the example or uncertainty personal and specific.",
              confidence: { score: 0.74, reason: "Deterministic synthesis of supplied reviewer outputs." },
            }
          : reviewOutput(metadata.agentRole ?? "editor", marker, metadata.bokHeading);
    const text = JSON.stringify(structuredOutput);
    const inputTokens = request.messages.reduce((total, message) => total + words(message.content), 0);
    const outputTokens = words(text);
    return {
      text,
      structuredOutput,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      latencyMs: 1,
      providerRequestId: `grounded-test-${marker}`,
      model: request.model,
      provider: this.name,
      finishReason: "stop",
      rawUsage: { source: "deterministic-grounded-test", groundingMarker: marker },
    };
  }

  estimateCost(usage: TokenUsage, model: string): CostEstimate {
    void model;
    const totalTokens = usage.totalTokens ?? (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0);
    return { inputCost: 0, outputCost: totalTokens * 0, totalCost: 0, currency: "USD", estimated: true };
  }
}
