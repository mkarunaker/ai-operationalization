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

function selectedBokSourceKeyFromRequest(request: ModelRequest) {
  const material = request.messages.map((message) => message.content).join("\n");
  const match = material.match(/Canonical source key: (selected_bok_\d+)/);
  return match?.[1] ?? "no_selected_bok";
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
        "Start by naming the baseline rather than relying on enthusiasm or usage alone.",
        "Choose one outcome that a team can observe without inventing certainty.",
        "Decide in advance what evidence would justify continuing the work.",
        "Also make clear what would prompt a pause or a redesign.",
        "That discipline turns a promising demonstration into an operating decision.",
        "Controls help when they clarify responsibility and the next action.",
        "A small pilot can expose missing context, handoffs, or accountability.",
        "Those findings are valuable even when the first design needs revision.",
        "Visible activity is not the same thing as a durable improvement.",
        "The practical test is whether people can see the outcome getting better.",
        "A sustained initiative earns its place when the change remains visible.",
        "What would you check before treating this as dependable work?",
      ]
    : [
        "Capability is only the starting point for useful AI work.",
        "The durable question is what changes in the work people actually do.",
        "That question turns a promising demonstration into an operating decision.",
        "Name the baseline before treating adoption as evidence of value.",
        "Choose one observable outcome that will show whether the change is helping.",
        "A clear owner can interpret the signal and decide what happens next.",
        "Controls matter when they make the work safer and clearer, not when they merely slow it down.",
        "Small pilots can reveal where context, handoffs, or accountability are missing.",
        "Those discoveries are useful even when the first design needs to be revised.",
        "Teams should decide in advance what result would justify expanding the work.",
        "They should also say what evidence would cause them to pause or redesign it.",
        "That discipline keeps activity from becoming a substitute for learning.",
        "People can then see whether the AI changes the work rather than simply adding another interface.",
        "The aim is not flawless prediction; it is a better decision with clearer consequences.",
        "A sustained initiative earns its place when the operating change remains visible.",
        "What operating change would make this initiative worth sustaining?",
      ];
  const prefix = forceScaffoldingFailure ? ["<untrusted_context", "source=\"fixture\">"] : [];
  // A local sample is not a simulated language model. Do not repeat generic
  // sentences merely to mimic a requested word range; range guidance remains
  // advisory for an otherwise valid saved output.
  const body = [...prefix, ...sentences.flatMap((sentence) => sentence.split(/\s+/))].slice(0, range.max).join(" ");
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
    const evidenceSourceKey = task === "synthesis" ? selectedBokSourceKeyFromRequest(request) : undefined;
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
              evidence_backbone: {
                source_key: evidenceSourceKey!,
                source_heading: evidenceSourceKey === "no_selected_bok" ? "No selected BOK section" : "Resolved by the server from the selected source key.",
                operating_distinction: "Visible AI activity is not evidence of an operating change until ownership and the expected outcome are explicit.",
                drafting_use: "Use the selected operating distinction to interpret the author's incident before explaining what should change.",
                uncertainty_boundary: "Do not claim that a tool, vendor, or organization has solved the operating work unless the supplied material establishes it.",
              },
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
