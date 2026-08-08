import { z } from "zod";
import { isPlainPublicationProse } from "@/editorial/plain-text";

export const commonReviewOutputSchema = z.object({
  role: z.string(),
  summary: z.string(),
  confidence: z.object({ score: z.number().min(0).max(1), reason: z.string() }),
  findings: z.array(
    z.object({
      category: z.string(),
      severity: z.enum(["low", "medium", "high"]),
      location: z.string(),
      observation: z.string(),
      recommendation: z.string(),
      requires_user_judgment: z.boolean(),
    }),
  ).max(3),
  strengths: z.array(z.string()).max(3),
  risks: z.array(z.string()).max(3),
  top_recommendations: z.array(z.string()).max(3),
  recommended_action: z.string(),
});

export type CommonReviewOutput = z.infer<typeof commonReviewOutputSchema>;

export const groundedSynthesisOutputSchema = z.object({
  role: z.literal("synthesizer"),
  summary: z.string().min(1),
  central_thesis: z.string().min(1),
  strongest: z.string().min(1),
  unclear: z.string().min(1),
  counterargument: z.string().min(1),
  evidence_needed: z.string().min(1),
  recommended_changes: z.array(z.string().min(1)).min(1).max(3),
  next_step: z.string().min(1),
  confidence: z.object({ score: z.number().min(0).max(1), reason: z.string() }),
});

export type GroundedSynthesisOutput = z.infer<typeof groundedSynthesisOutputSchema>;

export const initialDraftOutputSchema = z.object({
  role: z.literal("initial_drafter"),
  body: z
    .string()
    .min(1)
    .max(80_000)
    .refine(isPlainPublicationProse, "Draft body must be plain publication prose without Markdown formatting."),
  factual_gaps: z.array(z.string()).max(3),
  voice_rules_applied: z.array(z.string()).min(1).max(3),
});

export type InitialDraftOutput = z.infer<typeof initialDraftOutputSchema>;

/** Parse model JSON without interpreting it as markup or executing any content. */
export function parseStructuredJson(text: string): unknown {
  const value = text.trim();
  const fenced = value.match(/^```(?:json)?\s*\n([\s\S]*?)\n```$/i)?.[1]?.trim();
  const candidate = fenced ?? value;
  try {
    return JSON.parse(candidate);
  } catch {
    const first = candidate.indexOf("{");
    const last = candidate.lastIndexOf("}");
    if (first >= 0 && last > first) {
      try {
        return JSON.parse(candidate.slice(first, last + 1));
      } catch {
        return undefined;
      }
    }
    return undefined;
  }
}

export function validateStructuredReviewOutput(value: unknown) {
  return commonReviewOutputSchema.safeParse(value);
}
