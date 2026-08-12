export type VisualStep = { title: string; detail: string };
export type VisualTemplate = "flow" | "vertical_path" | "contrast" | "decision_fork";
export type VisualColorScheme = "violet" | "forest" | "copper";
export type VisualCompanionType = VisualTemplate | "maturity_path";
export type VisualCompanion = {
  id: string;
  draftVersionId: string;
  /** Optional immutable brief that authorized this rendered local asset. */
  visualBriefId?: string;
  type: VisualCompanionType;
  colorScheme?: VisualColorScheme;
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

function contrastVisual(): VisualCompanionDraft {
  return {
    type: "contrast",
    eyebrow: "A MATURITY CHECK",
    title: "Activity is not AI maturity",
    subtitle: "Visible experimentation matters, but it is not yet evidence of durable capability.",
    steps: [
      { title: "Activity", detail: "Licenses, prompts, pilots, and demos show exploration is happening." },
      { title: "Operating discipline", detail: "Ownership, adoption, controls, and repeatable patterns turn learning into capability." },
      { title: "Maturity", detail: "A small number of measured workflows people can rely on." },
    ],
    altText: "An iceberg contrast: visible AI activity above the waterline and the operating discipline required for durable maturity below it.",
    caption: "What is visible is activity. What makes it durable is usually below the surface.",
  };
}

function activityFlowVisual(): VisualCompanionDraft {
  const contrast = contrastVisual();
  return { ...contrast, type: "flow", eyebrow: "A MATURITY CHECK", altText: "A three-step flow from AI activity, through operating discipline, to durable AI maturity.", caption: "Activity is a starting signal. Maturity shows up in dependable, measured work." };
}

function verticalPathVisual(): VisualCompanionDraft {
  const contrast = contrastVisual();
  return { ...contrast, type: "maturity_path", eyebrow: "A MATURITY PATH", altText: "A vertical path from AI activity through operating discipline to durable maturity.", caption: "A simple vertical view of how activity can become durable capability." };
}

function decisionForkVisual(): VisualCompanionDraft {
  return {
    type: "decision_fork",
    eyebrow: "A PRACTICAL CHOICE",
    title: "What happens after AI activity starts?",
    subtitle: "The point is not to stop experimentation. It is to decide what turns it into capability.",
    steps: [
      { title: "AI activity", detail: "Pilots, licenses, prompts, and experiments create a learning signal." },
      { title: "Unmanaged", detail: "Fragmented ownership, avoidable exposure, duplicated effort, and rework." },
      { title: "Disciplined", detail: "Clear ownership, safe boundaries, and measurable workflows people can rely on." },
    ],
    altText: "A decision fork from AI activity to either unmanaged experimentation with sprawl and rework, or disciplined activity with trusted measurable workflows.",
    caption: "Activity becomes capability only when operating discipline gives it a safe, measurable path.",
  };
}

export function visualCompanionFor(title: string, draft: string, selectedTemplate?: VisualTemplate): VisualCompanionDraft {
  const source = `${title} ${draft}`.toLowerCase();
  const activityMaturity = /activity.{0,30}maturity|maturity.{0,30}activity|licenses|hackathons|experiments/.test(source);
  if (selectedTemplate === "flow") return activityMaturity ? activityFlowVisual() : visualCompanionFor(title, draft);
  if (selectedTemplate === "vertical_path") return verticalPathVisual();
  if (selectedTemplate === "decision_fork") return decisionForkVisual();
  if (selectedTemplate === "contrast") return contrastVisual();
  if (!activityMaturity && /missing middle|pilot|dependable workflow|production/.test(source)) {
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
  if (activityMaturity) {
    return contrastVisual();
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

function wrapped(value: string, width = 26, maxLines = 4) {
  const words = value
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((word) => word.match(new RegExp(`.{1,${width}}`, "g")) ?? []);
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
  if (lines.length <= maxLines) return lines;
  const visible = lines.slice(0, maxLines);
  const finalLine = visible.at(-1) ?? "";
  return [...visible.slice(0, -1), `${finalLine.slice(0, Math.max(1, width - 1))}…`];
}

function fittedTextLength(value: string, renderedWidth: number, fontSize: number) {
  // A full em per glyph is deliberately conservative for normal copy. The SVG
  // textLength remains a hard upper bound even for wide or unusual glyphs.
  return Math.min(renderedWidth, Math.max(fontSize, Array.from(value).length * fontSize));
}

function svgLines(value: string, x: number, wrapWidth: number, maxLines: number, lineHeight: number, renderedWidth: number, fontSize: number) {
  return wrapped(value, wrapWidth, maxLines)
    // `textLength` is a geometric SVG constraint, not a character heuristic:
    // even an all-wide-glyph line is compressed to the available panel width.
    .map((line, index) => `<tspan x="${x}" dy="${index ? lineHeight : 0}" textLength="${fittedTextLength(line, renderedWidth, fontSize)}" lengthAdjust="spacingAndGlyphs" data-bounded-text="true">${escapeXml(line)}</tspan>`)
    .join("");
}

function svgSingleLine(value: string, x: number, wrapWidth: number, renderedWidth: number, fontSize: number) {
  const line = wrapped(value, wrapWidth, 1)[0] ?? "";
  return `<tspan x="${x}" textLength="${fittedTextLength(line, renderedWidth, fontSize)}" lengthAdjust="spacingAndGlyphs" data-bounded-text="true">${escapeXml(line)}</tspan>`;
}

function renderHeader(
  visual: Pick<VisualCompanion, "eyebrow" | "title" | "subtitle">,
  x = 104,
  titleY = 188,
  subtitleY = 358,
) {
  const title = svgLines(visual.title, x, 44, 3, 58, 1080 - 2 * x, 54);
  const subtitle = svgLines(visual.subtitle, x, 68, 2, 31, 1080 - 2 * x, 26);
  const eyebrow = svgSingleLine(visual.eyebrow, x, 44, 1080 - 2 * x, 19);
  return `<text x="${x}" y="104" fill="#635bcb" font-family="Arial, sans-serif" font-size="19" font-weight="700" letter-spacing="3">${eyebrow}</text><text x="${x}" y="${titleY}" fill="#1d2138" font-family="Georgia, serif" font-size="54">${title}</text><text x="${x}" y="${subtitleY}" fill="#626983" font-family="Arial, sans-serif" font-size="26">${subtitle}</text>`;
}

function footer(x = 104) {
  return `<text x="${x}" y="1018" fill="#5a607b" font-family="Arial, sans-serif" font-size="22">AI Editorial Board · conceptual framework</text>`;
}

type RenderableVisual = Pick<VisualCompanion, "type" | "eyebrow" | "title" | "subtitle" | "steps"> & Partial<Pick<VisualCompanion, "altText" | "caption">>;

function applyColorScheme(svg: string, colorScheme: VisualColorScheme | undefined) {
  if (!colorScheme || colorScheme === "violet") return svg;
  const accents = colorScheme === "forest"
    ? { "#635bcb": "#2d6a4f", "#716bb4": "#4d806a", "#756ec8": "#3f7a5d", "#827bd0": "#5b9474", "#6a63c7": "#397058", "#4e4899": "#315f4b", "#a7a3d8": "#a7cbb8", "#d9d8e8": "#d5e4db", "#eceaff": "#e4f0e9", "#e7e5f7": "#e2f0e8", "#d8d5f2": "#cfe4d7", "#eeedf9": "#edf5f0" }
    : { "#635bcb": "#a45f3b", "#716bb4": "#a06e4e", "#756ec8": "#a96743", "#827bd0": "#bd7d58", "#6a63c7": "#9b593b", "#4e4899": "#7e472f", "#a7a3d8": "#dfc0af", "#d9d8e8": "#ead9cf", "#eceaff": "#f6ebe4", "#e7e5f7": "#f3e5dd", "#d8d5f2": "#ead1c3", "#eeedf9": "#f8f0ec" };
  return Object.entries(accents).reduce((current, [from, to]) => current.replaceAll(from, to), svg);
}

function svgOpen(visual: RenderableVisual) {
  // Alt text and caption are authored and approved with the brief.  Include
  // both in the actual SVG—not only in surrounding HTML—so saved SVG, preview,
  // and PNG export share the same accessible provenance.
  const label = visual.altText || visual.title;
  const description = visual.caption ? `<desc>${escapeXml(visual.caption)}</desc>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080" role="img" aria-label="${escapeXml(label)}">${description}`;
}

/** Generates a self-contained, escaped SVG for a locally stored visual companion. */
function renderMaturityContrastSvg(visual: RenderableVisual) {
  const activity = visual.steps[0] ?? { title: "Visible activity", detail: "What is easy to count." };
  const discipline = visual.steps[1] ?? { title: "Operating discipline", detail: "What makes work dependable." };
  const maturity = visual.steps[2] ?? { title: "Maturity", detail: "What people can rely on." };
  const disciplineLines = svgLines(discipline.detail, 540, 48, 3, 25, 520, 20);
  const maturityLines = svgLines(maturity.detail, 540, 42, 2, 20, 320, 17);
  const activityLabel = svgSingleLine(`VISIBLE ${activity.title.toUpperCase()}`, 104, 50, 872, 17);
  const activityLines = svgLines(activity.detail, 104, 48, 2, 25, 872, 20);
  return `${svgOpen(visual)}<rect width="1080" height="1080" fill="#f7f7fb"/>${renderHeader(visual)}<text x="104" y="464" fill="#716bb4" font-family="Arial, sans-serif" font-size="17" font-weight="700" letter-spacing="2">${activityLabel}</text><text x="104" y="506" fill="#343956" font-family="Arial, sans-serif" font-size="20">${activityLines}</text><path d="M0 550 C180 528 360 572 540 550 C720 528 900 572 1080 550 V1080 H0Z" fill="#eeedf9"/><path d="M0 550 C180 528 360 572 540 550 C720 528 900 572 1080 550" fill="none" stroke="#756ec8" stroke-width="4"/><path d="M220 590 L540 976 L860 590 Z" fill="#d8d5f2" stroke="#827bd0" stroke-width="3"/><rect x="250" y="638" width="580" height="194" rx="18" fill="#f7f7fb" stroke="#827bd0" stroke-width="3"/><text x="540" y="686" text-anchor="middle" fill="#3f3b76" font-family="Arial, sans-serif" font-size="16" font-weight="700" letter-spacing="2">BELOW THE SURFACE</text><text x="540" y="734" text-anchor="middle" fill="#20243a" font-family="Georgia, serif" font-size="34">${svgSingleLine(discipline.title, 540, 32, 520, 34)}</text><text x="540" y="776" text-anchor="middle" fill="#565d7b" font-family="Arial, sans-serif" font-size="20">${disciplineLines}</text><rect x="360" y="856" width="360" height="90" rx="45" fill="#e7e5f7" stroke="#827bd0" stroke-width="3"/><text x="540" y="892" text-anchor="middle" fill="#20243a" font-family="Georgia, serif" font-size="28">${svgSingleLine(maturity.title, 540, 24, 320, 28)}</text><text x="540" y="920" text-anchor="middle" fill="#565d7b" font-family="Arial, sans-serif" font-size="17">${maturityLines}</text>${footer()}</svg>`;
}

function renderVerticalPathSvg(visual: RenderableVisual) {
  const stages = visual.steps.slice(0, 3).map((step, index) => {
    const y = 464 + index * 150;
    const detail = svgLines(step.detail, 202, 58, 2, 22, 730, 20);
    const connector = index < 2 ? `<path d="M142 ${y + 126} V${y + 150}" stroke="#a7a3d8" stroke-width="3"/>` : "";
    return `<rect x="104" y="${y}" width="872" height="126" rx="16" fill="${index === 1 ? "#eceaff" : "#ffffff"}" stroke="#d9d8e8"/><circle cx="142" cy="${y + 63}" r="18" fill="${index === 1 ? "#6a63c7" : "#f7f7fb"}" stroke="#6a63c7" stroke-width="3"/><text x="142" y="${y + 69}" text-anchor="middle" fill="${index === 1 ? "#fff" : "#4e4899"}" font-family="Arial, sans-serif" font-size="15" font-weight="700">${index + 1}</text><text x="202" y="${y + 45}" fill="#20243a" font-family="Georgia, serif" font-size="31">${svgSingleLine(step.title, 202, 42, 730, 31)}</text><text x="202" y="${y + 79}" fill="#626983" font-family="Arial, sans-serif" font-size="20">${detail}</text>${connector}`;
  }).join("");
  return `${svgOpen(visual)}<rect width="1080" height="1080" fill="#f7f7fb"/>${renderHeader(visual)}<path d="M104 430 H976" stroke="#deddea" stroke-width="2"/>${stages}${footer()}</svg>`;
}

function renderDecisionForkSvg(visual: RenderableVisual) {
  const [activity, unmanaged, disciplined] = visual.steps;
  const activityDetail = svgLines(activity?.detail ?? "Pilots, licenses, prompts, and experiments create a learning signal.", 540, 40, 2, 19, 332, 17);
  const unmanagedDetails = svgLines(unmanaged?.detail ?? "", 140, 30, 3, 24, 318, 20);
  const disciplinedDetails = svgLines(disciplined?.detail ?? "", 622, 30, 3, 24, 318, 20);
  return `${svgOpen(visual)}<rect width="1080" height="1080" fill="#f7f7fb"/>${renderHeader(visual)}<rect x="354" y="454" width="372" height="126" rx="63" fill="#e7e5f7" stroke="#7770c8" stroke-width="3"/><text x="540" y="505" text-anchor="middle" fill="#27234e" font-family="Georgia, serif" font-size="31">${svgSingleLine(activity?.title ?? "AI activity", 540, 22, 332, 31)}</text><text x="540" y="537" text-anchor="middle" fill="#575d7d" font-family="Arial, sans-serif" font-size="17">${activityDetail}</text><path d="M420 580 C420 634 335 662 299 720" fill="none" stroke="#ad7457" stroke-width="4"/><path d="M660 580 C660 634 745 662 781 720" fill="none" stroke="#5f8e76" stroke-width="4"/><rect x="104" y="720" width="390" height="190" rx="18" fill="#fff7f3" stroke="#d6a48f" stroke-width="3"/><rect x="586" y="720" width="390" height="190" rx="18" fill="#f4faf5" stroke="#9fc6ae" stroke-width="3"/><text x="140" y="778" fill="#7d4937" font-family="Georgia, serif" font-size="35">${svgSingleLine(unmanaged?.title ?? "Unmanaged", 140, 20, 318, 35)}</text><text x="140" y="822" fill="#715d5a" font-family="Arial, sans-serif" font-size="20">${unmanagedDetails}</text><text x="622" y="778" fill="#315e48" font-family="Georgia, serif" font-size="35">${svgSingleLine(disciplined?.title ?? "Disciplined", 622, 20, 318, 35)}</text><text x="622" y="822" fill="#52685d" font-family="Arial, sans-serif" font-size="20">${disciplinedDetails}</text>${footer()}</svg>`;
}

export function renderVisualSvg(visual: RenderableVisual & Partial<Pick<VisualCompanion, "colorScheme">>) {
  if (visual.type === "maturity_path") return applyColorScheme(renderVerticalPathSvg(visual), visual.colorScheme);
  if (visual.type === "contrast") return applyColorScheme(renderMaturityContrastSvg(visual), visual.colorScheme);
  if (visual.type === "decision_fork") return applyColorScheme(renderDecisionForkSvg(visual), visual.colorScheme);
  const cards = visual.steps.slice(0, 3).map((step, index) => {
    const x = 54 + index * 330;
    const fill = index === 1 ? "#eceaff" : "#ffffff";
    const titleLines = svgLines(step.title, x + 25, 20, 2, 30, 230, 27);
    const detailLines = svgLines(step.detail, x + 25, 25, 4, 24, 230, 19);
    const arrow = index < visual.steps.length - 1 ? `<path d="M${x + 280} 615 H${x + 310}" stroke="#7068d6" stroke-width="4"/><path d="M${x + 302} 605 L${x + 312} 615 L${x + 302} 625" fill="none" stroke="#7068d6" stroke-width="4"/>` : "";
    return `<rect x="${x}" y="480" width="280" height="280" rx="22" fill="${fill}" stroke="#d9d8e8"/><text x="${x + 25}" y="535" fill="#20243a" font-family="Georgia, serif" font-size="27">${titleLines}</text><text x="${x + 25}" y="630" fill="#5a607b" font-family="Arial, sans-serif" font-size="19">${detailLines}</text>${arrow}`;
  }).join("");
  return applyColorScheme(`${svgOpen(visual)}<rect width="1080" height="1080" fill="#f7f7fb"/>${renderHeader(visual, 54, 170, 340)}<path d="M54 420 H1026" stroke="#deddea" stroke-width="2"/>${cards}${footer(54)}</svg>`, visual.colorScheme);
}

/**
 * A display-safe data URL for the same escaped SVG that is saved and exported.
 * Rendering this URL through an image element prevents the page preview from
 * drifting into a second HTML/CSS interpretation of the visual.
 */
export function visualSvgDataUrl(visual: RenderableVisual & Partial<Pick<VisualCompanion, "colorScheme">>) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(renderVisualSvg(visual))}`;
}
