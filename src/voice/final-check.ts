import { z } from "zod";
import { publicationMarkdownIssues } from "@/editorial/plain-text";

export type VoiceFinding = { id: string; severity: "low" | "medium" | "high"; message: string; suggestion: string };
export type VoiceCheck = { riskPercent: number; label: "low" | "moderate" | "high"; findings: VoiceFinding[]; disclaimer: string };

const phraseRules: Array<{ expression: RegExp; label: string; suggestion: string }> = [
  { expression: /\bdelve\b/gi, label: '“delve”', suggestion: "Say exactly what you are examining." },
  { expression: /\b(game[- ]?changer|game changing)\b/gi, label: '“game changer”', suggestion: "Name the concrete change instead." },
  { expression: /\b(unlock|leverage)\b/gi, label: '“unlock” or “leverage”', suggestion: "Use a direct verb that describes the action." },
  { expression: /\b(in today'?s|rapidly evolving)\b/gi, label: "generic time-setting language", suggestion: "Start with the actual observation or context." },
  { expression: /\b(at the end of the day|the key is|here'?s the thing)\b/gi, label: "generic signposting", suggestion: "State the point directly." },
  { expression: /\bnot just\b/gi, label: '“not just” contrast', suggestion: "Use a precise sentence without the canned contrast." },
];

function matches(text: string, expression: RegExp) { return [...text.matchAll(expression)].length; }
function scoreLabel(score: number): VoiceCheck["label"] { return score >= 50 ? "high" : score >= 25 ? "moderate" : "low"; }

export function checkHumanVoice(input: unknown): VoiceCheck {
  const text = z.string().trim().min(1).max(80_000).parse(input);
  const findings: VoiceFinding[] = [];
  let risk = 0;
  const markdownIssues = publicationMarkdownIssues(text);
  if (markdownIssues.length) {
    risk += 12;
    findings.push({
      id: "markdown_formatting",
      severity: "medium",
      message: `Markdown formatting found: ${markdownIssues.join(", ")}.`,
      suggestion: "Use ordinary paragraphs so the draft is ready to paste into LinkedIn, Medium, or Substack.",
    });
  }
  const emDashes = matches(text, /—/g);
  if (emDashes) { risk += Math.min(24, emDashes * 12); findings.push({ id: "em_dash", severity: "high", message: `${emDashes} em dash${emDashes === 1 ? "" : "es"} found.`, suggestion: "Use a period, comma, or rewrite the sentence." }); }
  for (const rule of phraseRules) { const count = matches(text, rule.expression); if (count) { risk += Math.min(16, count * 6); findings.push({ id: `phrase_${rule.label}`, severity: count > 1 ? "medium" : "low", message: `${count} instance${count === 1 ? "" : "s"} of ${rule.label}.`, suggestion: rule.suggestion }); } }
  const contrasts = matches(text, /\bnot\b[^.!?]{0,100}\bbut\b/gi);
  if (contrasts > 1) { risk += Math.min(12, (contrasts - 1) * 6); findings.push({ id: "contrast_pattern", severity: "medium", message: `${contrasts} “not X, but Y” constructions found.`, suggestion: "Keep at most one; rewrite the rest as direct observations." }); }
  const sentenceStarters = text.match(/(?:^|[.!?]\s+)([A-Z][^\s,;:]{1,20})/g)?.map((value) => value.replace(/^[.!?]\s*/, "").toLowerCase()) ?? [];
  const repeatedStarter = [...new Set(sentenceStarters)].find((starter) => sentenceStarters.filter((value) => value === starter).length >= 3);
  if (repeatedStarter) { risk += 8; findings.push({ id: "repeated_starter", severity: "medium", message: `Several sentences begin with “${repeatedStarter}.”`, suggestion: "Vary the sentence openings so the rhythm feels less templated." }); }
  const threePartLists = matches(text, /\b[^,.;]{2,35},\s*[^,.;]{2,35},\s*(?:and\s+)?[^,.;]{2,35}\b/g);
  if (threePartLists >= 2) { risk += 8; findings.push({ id: "three_part_rhythm", severity: "low", message: "Repeated three-part list rhythm may sound overly constructed.", suggestion: "Keep only the lists that earn their place; turn the others into natural prose." }); }
  if (/\b(what do you think|thoughts\??|let me know your thoughts)\s*$/i.test(text)) { risk += 6; findings.push({ id: "generic_close", severity: "low", message: "The closing invitation is a common social-post formula.", suggestion: "End with a specific question or a quieter observation tied to this idea." }); }
  const riskPercent = Math.min(100, risk);
  return { riskPercent, label: scoreLabel(riskPercent), findings, disclaimer: "This is an explainable pattern check, not an AI-authorship detector. A higher score means the draft contains more common AI-like writing patterns worth reviewing; it does not prove that a revision is necessary." };
}
