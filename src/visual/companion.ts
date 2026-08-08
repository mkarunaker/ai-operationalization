export type VisualStep = { title: string; detail: string };
export type VisualCompanion = {
  id: string;
  draftVersionId: string;
  type: "flow";
  eyebrow: string;
  title: string;
  subtitle: string;
  steps: VisualStep[];
  altText: string;
  caption: string;
  filePath: string;
  createdAt: string;
};

export type VisualCompanionDraft = Omit<VisualCompanion, "id" | "draftVersionId" | "filePath" | "createdAt">;

export function visualCompanionFor(title: string, draft: string): VisualCompanionDraft {
  const source = `${title} ${draft}`.toLowerCase();
  if (/missing middle|pilot|dependable workflow|production/.test(source)) {
    return {
      type: "flow",
      eyebrow: "A SIMPLE DIAGNOSTIC",
      title: "From a promising pilot to a dependable workflow",
      subtitle: "What changes when technical promise becomes work people can rely on?",
      steps: [
        { title: "Promising pilot", detail: "A useful demo, often with manual support and narrow use." },
        { title: "The missing middle", detail: "Clear ownership, sensible controls, and a way to measure value." },
        { title: "Dependable workflow", detail: "Trusted, supported, and measured in everyday work." },
      ],
      altText: "A three-step flow from a promising AI pilot, through the missing middle of ownership, controls, and measurement, to a dependable workflow.",
      caption: "The missing middle is what turns a promising pilot into a dependable workflow.",
    };
  }
  return {
    type: "flow",
    eyebrow: "A SIMPLE DECISION FLOW",
    title: title || "From observation to practical action",
    subtitle: "A concise way to move from an idea to a more useful decision.",
    steps: [
      { title: "Observation", detail: "Name the practical tension or opportunity." },
      { title: "Decision", detail: "Clarify what needs to be true before acting." },
      { title: "Practical action", detail: "Choose the next small, measurable move." },
    ],
    altText: "A three-step flow from observation, to decision, to practical action.",
    caption: "A simple flow for turning an observation into a practical next step.",
  };
}

function escapeXml(value: string) {
  return value.replace(/[<>&"']/g, (character) => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;",
  })[character]!);
}

function wrapped(value: string, width = 26) {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > width && line) {
      lines.push(line);
      line = word;
    } else line = candidate;
  }
  if (line) lines.push(line);
  return lines.slice(0, 4);
}

/** Generates a self-contained, escaped SVG for a locally stored visual companion. */
export function renderVisualSvg(visual: Pick<VisualCompanion, "eyebrow" | "title" | "subtitle" | "steps">) {
  const cards = visual.steps.map((step, index) => {
    const x = 54 + index * 330;
    const fill = index === 1 ? "#eceaff" : "#ffffff";
    const titleLines = wrapped(step.title, 19).map((line, lineIndex) => `<tspan x="${x + 25}" dy="${lineIndex ? 34 : 0}">${escapeXml(line)}</tspan>`).join("");
    const detailLines = wrapped(step.detail, 25).map((line, lineIndex) => `<tspan x="${x + 25}" dy="${lineIndex ? 28 : 0}">${escapeXml(line)}</tspan>`).join("");
    const arrow = index < visual.steps.length - 1 ? `<path d="M${x + 280} 615 H${x + 310}" stroke="#7068d6" stroke-width="4"/><path d="M${x + 302} 605 L${x + 312} 615 L${x + 302} 625" fill="none" stroke="#7068d6" stroke-width="4"/>` : "";
    return `<rect x="${x}" y="490" width="280" height="300" rx="22" fill="${fill}" stroke="#d9d8e8"/><text x="${x + 25}" y="550" fill="#20243a" font-family="Georgia, serif" font-size="30">${titleLines}</text><text x="${x + 25}" y="650" fill="#5a607b" font-family="Arial, sans-serif" font-size="22">${detailLines}</text>${arrow}`;
  }).join("");
  const title = wrapped(visual.title, 44).map((line, index) => `<tspan x="54" dy="${index ? 58 : 0}">${escapeXml(line)}</tspan>`).join("");
  const subtitle = wrapped(visual.subtitle, 75).map((line, index) => `<tspan x="54" dy="${index ? 31 : 0}">${escapeXml(line)}</tspan>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080" role="img" aria-label="${escapeXml(visual.title)}"><rect width="1080" height="1080" fill="#f7f7fb"/><text x="54" y="86" fill="#635bcb" font-family="Arial, sans-serif" font-size="19" font-weight="700" letter-spacing="3">${escapeXml(visual.eyebrow)}</text><text x="54" y="170" fill="#1d2138" font-family="Georgia, serif" font-size="54">${title}</text><text x="54" y="340" fill="#626983" font-family="Arial, sans-serif" font-size="26">${subtitle}</text><path d="M54 420 H1026" stroke="#deddea" stroke-width="2"/>${cards}<text x="54" y="955" fill="#5a607b" font-family="Arial, sans-serif" font-size="22">AI Editorial Board · conceptual framework</text></svg>`;
}
