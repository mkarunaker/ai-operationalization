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
  publicationTarget?: "linkedin" | "canonical";
};

function words(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function fingerprint(request: ModelRequest) {
  const material = request.messages.map((message) => message.content).join("\n");
  return crypto.createHash("sha256").update(material).digest("hex").slice(0, 10);
}

function safeSeed(value: unknown) {
  const compact = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!compact || /ignore\s+(?:all\s+)?(?:previous|prior|above)\s+instructions|(?:reveal|show).{0,40}(?:secret|api key|password|system prompt)/i.test(compact))
    return "A useful operational question is worth making specific before it is published.";
  return compact.slice(0, 320);
}

function plainPublicationText(value: unknown) {
  return safeSeed(value)
    .replace(/```[\s\S]*?```/g, "")
    .replace(/(^|\s)#{1,6}\s+/g, "$1")
    .replace(/\*\*|__|`|^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+[.)]\s+/gm, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
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

function draftOutput(metadata: GroundedMetadata) {
  const seed = plainPublicationText(metadata.draftSeed);
  const bok = metadata.bokHeading
    ? `One useful frame from the selected BOK material is ${plainPublicationText(metadata.bokFocus ?? metadata.bokHeading)}.`
    : "The useful frame is to make the operating consequence visible.";
  const shortBody = `${seed}\n\nA lot of AI discussion still starts with what a model or agent can do. The more useful starting point is the work that needs to become meaningfully better. That shifts the conversation from visible activity to an outcome people can actually observe.\n\n${bok} It does not settle the argument on its own. It gives the question a boundary: what would need to change in the workflow, decision, or customer experience for this to matter?\n\nThat is where a promising idea becomes more than a demo. It becomes a claim that can be tested, improved, or set aside.\n\nWhat is the operating change you would need to see before calling an AI initiative valuable?`;
  const body = metadata.publicationTarget === "canonical"
    ? `${shortBody}\n\nFor a longer article, it helps to distinguish a successful technical demonstration from a dependable workflow. The latter has an accountable owner, a clear place in the process, appropriate controls, and a way to see whether the outcome improved. Those conditions do not make every pilot worth scaling. They make the next decision more honest.\n\nThat is also why the first question should not be which platform or agent framework to adopt. It should be what problem is frequent enough, consequential enough, and observable enough to justify changing how people work. Sometimes the answer will be AI. Sometimes a simpler redesign, automation, or decision rule will do more good.\n\nA useful operating discipline is to state the baseline, decide what evidence would justify continuation, and name the conditions that would cause the work to be redesigned or stopped. This keeps curiosity intact without confusing activity with progress.\n\nWhat would make an AI initiative valuable enough to keep operating?`
    : shortBody;
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
    const structuredOutput =
      task === "draft"
        ? draftOutput(metadata)
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
