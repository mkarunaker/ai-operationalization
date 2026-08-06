export type PromptInjectionAssessment = {
  suspicious: boolean;
  signals: string[];
};

const INJECTION_PATTERNS: Array<{ signal: string; expression: RegExp }> = [
  { signal: "instruction-override", expression: /ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/i },
  { signal: "role-override", expression: /(?:system\s+prompt|developer\s+message|act\s+as)\b/i },
  { signal: "secret-exfiltration", expression: /(?:reveal|print|show|exfiltrate).{0,40}(?:secret|api key|password|system prompt)/i },
  { signal: "tool-override", expression: /(?:call|use|run)\s+(?:this\s+)?(?:tool|command|function)/i },
];

export function assessPromptInjection(text: string): PromptInjectionAssessment {
  const signals = INJECTION_PATTERNS.filter((pattern) => pattern.expression.test(text)).map((pattern) => pattern.signal);
  return { suspicious: signals.length > 0, signals };
}

export function escapeUntrustedContext(text: string): string {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
