import { z } from "zod";

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
  ),
  strengths: z.array(z.string()),
  risks: z.array(z.string()),
  top_recommendations: z.array(z.string()),
  recommended_action: z.string(),
});

export type CommonReviewOutput = z.infer<typeof commonReviewOutputSchema>;

export function validateStructuredReviewOutput(value: unknown) {
  return commonReviewOutputSchema.safeParse(value);
}
