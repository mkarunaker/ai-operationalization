type VisualGuidanceInput = {
  title: string;
  body: string;
  recommendations: string[];
};

function savedOutputSentences(body: string) {
  return body
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function centralityScore(sentence: string, index: number) {
  const words = sentence.split(/\s+/).filter(Boolean).length;
  let score = words >= 8 && words <= 42 ? 2 : words > 60 ? -2 : 0;
  const signals: Array<[RegExp, number]> = [
    [/\bgates?\b/i, 8],
    [/\bowner(?:ship)?\b|\baccountab(?:le|ility)\b/i, 6],
    [/\bdecision|decid(?:e|es|ed|ing)|deferr|expir|trigger\b/i, 5],
    [/\bgovernance|framework|playbook\b/i, 4],
    [/\bpilot|prototype\b/i, 3],
    [/\bproduction|operat(?:e|es|ed|ing|ion|ional|ions)\b/i, 3],
    [/\brisk|engineering|data|security|legal|leadership\b/i, 2],
    [/\bbetween|versus|rather than|when|until|before|after\b/i, 2],
  ];
  for (const [pattern, weight] of signals) if (pattern.test(sentence)) score += weight;
  if (index === 0) score -= 3;
  if (/^(?:i keep hearing|that is where|this is where|there is also|none of this)\b/i.test(sentence)) score -= 4;
  return score;
}

function boundedConceptFocus(text: string) {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.!?]+$/g, "")
    .split(/\s+/)
    .slice(0, 36)
    .join(" ");
}

/**
 * Selects a concise local concept focus from an exact saved output. This is a
 * display and prompt-planning aid only; it does not call a model or add claims.
 */
export function customIllustrationFocusForOutput(body: string) {
  const sentences = savedOutputSentences(body);
  if (sentences.length === 0) return "the saved output's central practical decision";

  const gateOne = sentences.findIndex((sentence) => /\bgate\s*1\b/i.test(sentence));
  const gateTwo = sentences.findIndex((sentence) => /\bgate\s*2\b/i.test(sentence));
  if (gateOne >= 0 && gateTwo >= 0) {
    const paired = [sentences[gateOne], sentences[gateTwo]].filter(Boolean).join(" ");
    if (paired.split(/\s+/).length <= 36) return boundedConceptFocus(paired);
  }

  const ranked = sentences
    .map((sentence, index) => ({ sentence, index, score: centralityScore(sentence, index) }))
    .sort((left, right) => right.score - left.score || left.index - right.index);
  return boundedConceptFocus(ranked[0]?.sentence ?? sentences[0]);
}

function boundedFocus(input: VisualGuidanceInput) {
  const reviewPriority = input.recommendations.find((item) => item.trim().length > 0);
  const firstSavedSentence = input.body.split(/[.!?](?:\s|$)/)[0]?.trim();
  const source = reviewPriority ?? firstSavedSentence ?? input.title;
  return source
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[)\],.;:!?]+$/g, "")
    .split(/\s+/)
    .slice(0, 12)
    .join(" ");
}

/**
 * Creates local, exact-output visual guidance without a provider call. Review
 * and draft text remain untrusted plain data when the author later saves this
 * direction in a visual brief.
 */
export function visualGuidanceForReview(input: VisualGuidanceInput) {
  const focus = boundedFocus(input) || "the saved output's central practical tension";
  const guidance = `Visualize this review priority: ${focus}. Show one clear decision, its accountable owner, and the operating path that follows. Keep the hierarchy calm and text minimal. Use one grounded editorial scene.`;
  const words = guidance.split(/\s+/).filter(Boolean);
  return `${words.slice(0, 40).join(" ").replace(/[.;:,]+$/g, "")}.`;
}
