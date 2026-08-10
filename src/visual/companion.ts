export type VisualStep = { title: string; detail: string };
export type VisualTemplate = "flow" | "vertical_path" | "contrast" | "decision_fork";
export type VisualCompanionType = VisualTemplate | "maturity_path";
export type VisualCompanion = {
  id: string;
  draftVersionId: string;
  type: VisualCompanionType;
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
function renderMaturityContrastSvg(visual: Pick<VisualCompanion, "eyebrow" | "title" | "subtitle" | "steps">) {
  const title = wrapped(visual.title, 44).map((line, index) => `<tspan x="104" dy="${index ? 58 : 0}">${escapeXml(line)}</tspan>`).join("");
  const subtitle = wrapped(visual.subtitle, 68).map((line, index) => `<tspan x="104" dy="${index ? 31 : 0}">${escapeXml(line)}</tspan>`).join("");
  const activity = visual.steps[0] ?? { title: "Visible activity", detail: "What is easy to count." };
  const discipline = visual.steps[1] ?? { title: "Operating discipline", detail: "What makes work dependable." };
  const maturity = visual.steps[2] ?? { title: "Maturity", detail: "What people can rely on." };
  const disciplineLines = wrapped(discipline.detail, 44).map((line, index) => `<tspan x="540" dy="${index ? 27 : 0}">${escapeXml(line)}</tspan>`).join("");
  const maturityLines = wrapped(maturity.detail, 44).map((line, index) => `<tspan x="540" dy="${index ? 27 : 0}">${escapeXml(line)}</tspan>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080" role="img" aria-label="${escapeXml(visual.title)}"><rect width="1080" height="1080" fill="#f7f7fb"/><text x="104" y="104" fill="#635bcb" font-family="Arial, sans-serif" font-size="19" font-weight="700" letter-spacing="3">${escapeXml(visual.eyebrow)}</text><text x="104" y="188" fill="#1d2138" font-family="Georgia, serif" font-size="54">${title}</text><text x="104" y="358" fill="#626983" font-family="Arial, sans-serif" font-size="26">${subtitle}</text><text x="104" y="464" fill="#716bb4" font-family="Arial, sans-serif" font-size="17" font-weight="700" letter-spacing="2">VISIBLE ${escapeXml(activity.title).toUpperCase()}</text><text x="104" y="506" fill="#343956" font-family="Georgia, serif" font-size="31">Licenses · pilots · prompts · demos</text><path d="M0 550 C180 528 360 572 540 550 C720 528 900 572 1080 550 V1080 H0Z" fill="#eeedf9"/><path d="M0 550 C180 528 360 572 540 550 C720 528 900 572 1080 550" fill="none" stroke="#756ec8" stroke-width="4"/><path d="M330 570 L540 960 L750 570 Z" fill="#d8d5f2" stroke="#827bd0" stroke-width="3"/><path d="M330 570 L540 650 L750 570" fill="#e7e5f7"/><text x="540" y="696" text-anchor="middle" fill="#3f3b76" font-family="Arial, sans-serif" font-size="17" font-weight="700" letter-spacing="2">BELOW THE SURFACE</text><text x="540" y="756" text-anchor="middle" fill="#20243a" font-family="Georgia, serif" font-size="34">${escapeXml(discipline.title)}</text><text x="540" y="794" text-anchor="middle" fill="#565d7b" font-family="Arial, sans-serif" font-size="21">${disciplineLines}</text><text x="540" y="872" text-anchor="middle" fill="#20243a" font-family="Georgia, serif" font-size="30">${escapeXml(maturity.title)}</text><text x="540" y="908" text-anchor="middle" fill="#565d7b" font-family="Arial, sans-serif" font-size="21">${maturityLines}</text><text x="104" y="1018" fill="#5a607b" font-family="Arial, sans-serif" font-size="22">AI Editorial Board · conceptual framework</text></svg>`;
}

function renderVerticalPathSvg(visual: Pick<VisualCompanion, "eyebrow" | "title" | "subtitle" | "steps">) {
  const title = wrapped(visual.title, 44).map((line, index) => `<tspan x="104" dy="${index ? 58 : 0}">${escapeXml(line)}</tspan>`).join("");
  const subtitle = wrapped(visual.subtitle, 68).map((line, index) => `<tspan x="104" dy="${index ? 31 : 0}">${escapeXml(line)}</tspan>`).join("");
  const stages = visual.steps.slice(0, 3).map((step, index) => { const y = 500 + index * 160; const detail = wrapped(step.detail, 58).map((line, lineIndex) => `<tspan x="202" dy="${lineIndex ? 26 : 0}">${escapeXml(line)}</tspan>`).join(""); return `<circle cx="142" cy="${y}" r="18" fill="${index === 1 ? "#6a63c7" : "#f7f7fb"}" stroke="#6a63c7" stroke-width="3"/><text x="142" y="${y + 6}" text-anchor="middle" fill="${index === 1 ? "#fff" : "#4e4899"}" font-family="Arial, sans-serif" font-size="15" font-weight="700">${index + 1}</text>${index < 2 ? `<path d="M142 ${y + 36} V${y + 124}" stroke="#a7a3d8" stroke-width="3"/>` : ""}<text x="202" y="${y - 2}" fill="#20243a" font-family="Georgia, serif" font-size="31">${escapeXml(step.title)}</text><text x="202" y="${y + 40}" fill="#626983" font-family="Arial, sans-serif" font-size="22">${detail}</text>`; }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080" role="img" aria-label="${escapeXml(visual.title)}"><rect width="1080" height="1080" fill="#f7f7fb"/><text x="104" y="104" fill="#635bcb" font-family="Arial, sans-serif" font-size="19" font-weight="700" letter-spacing="3">${escapeXml(visual.eyebrow)}</text><text x="104" y="188" fill="#1d2138" font-family="Georgia, serif" font-size="54">${title}</text><text x="104" y="358" fill="#626983" font-family="Arial, sans-serif" font-size="26">${subtitle}</text><path d="M104 430 H976" stroke="#deddea" stroke-width="2"/>${stages}<text x="104" y="1018" fill="#5a607b" font-family="Arial, sans-serif" font-size="22">AI Editorial Board · conceptual framework</text></svg>`;
}

function renderDecisionForkSvg(visual: Pick<VisualCompanion, "eyebrow" | "title" | "subtitle" | "steps">) {
  const title = wrapped(visual.title, 44).map((line, index) => `<tspan x="104" dy="${index ? 58 : 0}">${escapeXml(line)}</tspan>`).join("");
  const subtitle = wrapped(visual.subtitle, 68).map((line, index) => `<tspan x="104" dy="${index ? 31 : 0}">${escapeXml(line)}</tspan>`).join("");
  const [activity, unmanaged, disciplined] = visual.steps;
  const details = (step: VisualStep | undefined, x: number) => wrapped(step?.detail ?? "", 27).map((line, index) => `<tspan x="${x}" dy="${index ? 26 : 0}">${escapeXml(line)}</tspan>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080" role="img" aria-label="${escapeXml(visual.title)}"><rect width="1080" height="1080" fill="#f7f7fb"/><text x="104" y="104" fill="#635bcb" font-family="Arial, sans-serif" font-size="19" font-weight="700" letter-spacing="3">${escapeXml(visual.eyebrow)}</text><text x="104" y="188" fill="#1d2138" font-family="Georgia, serif" font-size="54">${title}</text><text x="104" y="358" fill="#626983" font-family="Arial, sans-serif" font-size="26">${subtitle}</text><circle cx="540" cy="520" r="78" fill="#e7e5f7" stroke="#7770c8" stroke-width="3"/><text x="540" y="510" text-anchor="middle" fill="#27234e" font-family="Georgia, serif" font-size="31">${escapeXml(activity?.title ?? "AI activity")}</text><text x="540" y="546" text-anchor="middle" fill="#575d7d" font-family="Arial, sans-serif" font-size="18">pilots · prompts · experiments</text><path d="M488 580 C420 640 320 660 254 720" fill="none" stroke="#ad7457" stroke-width="4"/><path d="M592 580 C660 640 760 660 826 720" fill="none" stroke="#5f8e76" stroke-width="4"/><circle cx="220" cy="748" r="18" fill="#c97655"/><circle cx="860" cy="748" r="18" fill="#6fa181"/><text x="104" y="824" fill="#7d4937" font-family="Georgia, serif" font-size="35">${escapeXml(unmanaged?.title ?? "Unmanaged")}</text><text x="104" y="866" fill="#715d5a" font-family="Arial, sans-serif" font-size="21">${details(unmanaged, 104)}</text><text x="590" y="824" fill="#315e48" font-family="Georgia, serif" font-size="35">${escapeXml(disciplined?.title ?? "Disciplined")}</text><text x="590" y="866" fill="#52685d" font-family="Arial, sans-serif" font-size="21">${details(disciplined, 590)}</text><text x="104" y="1018" fill="#5a607b" font-family="Arial, sans-serif" font-size="22">AI Editorial Board · conceptual framework</text></svg>`;
}

export function renderVisualSvg(visual: Pick<VisualCompanion, "type" | "eyebrow" | "title" | "subtitle" | "steps">) {
  if (visual.type === "maturity_path") return renderVerticalPathSvg(visual);
  if (visual.type === "contrast") return renderMaturityContrastSvg(visual);
  if (visual.type === "decision_fork") return renderDecisionForkSvg(visual);
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
