const markdownPatterns: Array<{ expression: RegExp; label: string }> = [
  { expression: /^\s{0,3}#{1,6}\s+/m, label: "heading marker" },
  { expression: /^\s{0,3}[-*+]\s+/m, label: "bullet-list marker" },
  { expression: /^\s{0,3}\d+[.)]\s+/m, label: "numbered-list marker" },
  { expression: /^\s{0,3}>\s+/m, label: "block-quote marker" },
  { expression: /```/, label: "code fence" },
  { expression: /\*\*[^*]+\*\*|__[^_]+__/, label: "bold marker" },
  { expression: /`[^`]+`/, label: "inline-code marker" },
  { expression: /\[[^\]]+\]\([^\s)]+\)/, label: "Markdown link" },
];

/** Publication copy is deliberately plain prose for direct delivery-channel use. */
export function publicationMarkdownIssues(text: string) {
  return markdownPatterns
    .filter(({ expression }) => expression.test(text))
    .map(({ label }) => label);
}

export function isPlainPublicationProse(text: string) {
  return publicationMarkdownIssues(text).length === 0;
}

export function assertPlainPublicationProse(text: string) {
  const issues = publicationMarkdownIssues(text);
  if (issues.length)
    throw new Error(
      `Publication text must be plain prose, not Markdown. Remove: ${issues.join(", ")}.`,
    );
}
