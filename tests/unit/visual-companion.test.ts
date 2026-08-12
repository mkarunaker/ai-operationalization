import { describe, expect, it } from "vitest";
import { renderVisualSvg, visualCompanionFor, visualSvgDataUrl } from "@/visual/companion";

describe("visual companion selection", () => {
  it("uses a distinct maturity framework for activity-versus-maturity content", () => {
    const visual = visualCompanionFor("Activity is not maturity", "Licenses, pilots, and experiments can coexist with low operational maturity.");
    expect(visual.type).toBe("contrast");
    expect(visual.title).toBe("Activity is not AI maturity");
    expect(visual.steps.map((step) => step.title)).toEqual(["Activity", "Operating discipline", "Maturity"]);
    const svg = renderVisualSvg(visual);
    expect(svg).toContain("Licenses, prompts, pilots, and demos show");
    expect(svg).toContain('M220 590 L540 976 L860 590 Z');
    expect(svg).not.toContain('width="280" height="300"');
  });

  it("uses a decision fork only when the author selects that template", () => {
    const visual = visualCompanionFor("Activity is not maturity", "A post about operating discipline.", "decision_fork");
    expect(visual.type).toBe("decision_fork");
    expect(renderVisualSvg(visual)).toContain("Unmanaged");
  });

  it("honors explicit three-step-flow and vertical-path selections", () => {
    const flow = visualCompanionFor("Activity is not maturity", "Licenses and pilots can coexist with weak maturity.", "flow");
    expect(flow.type).toBe("flow");
    expect(renderVisualSvg(flow)).toContain('width="280" height="280"');
    const vertical = visualCompanionFor("Activity is not maturity", "Licenses and pilots can coexist with weak maturity.", "vertical_path");
    expect(vertical.type).toBe("maturity_path");
    expect(renderVisualSvg(vertical)).toContain('M142 590 V614');
  });

  it("keeps every template's explanatory copy inside a bounded visual region", () => {
    const decisionFork = visualCompanionFor("Activity is not maturity", "A post about operating discipline.", "decision_fork");
    const contrast = visualCompanionFor("Activity is not maturity", "A post about operating discipline.", "contrast");
    const verticalPath = visualCompanionFor("Activity is not maturity", "A post about operating discipline.", "vertical_path");

    expect(renderVisualSvg(decisionFork)).toContain('<rect x="104" y="720" width="390" height="190"');
    expect(renderVisualSvg(contrast)).toContain('<rect x="250" y="638" width="580" height="194"');
    expect(renderVisualSvg(verticalPath)).toContain('<rect x="104" y="464" width="872" height="126"');
  });

  it("renders an explicit saved palette without mutating the default visual grammar", () => {
    const visual = visualCompanionFor("Activity is not maturity", "Licenses, pilots, and experiments can coexist with low operational maturity.", "contrast");
    expect(renderVisualSvg({ ...visual, colorScheme: "violet" })).toContain("#635bcb");
    const forest = renderVisualSvg({ ...visual, colorScheme: "forest" });
    expect(forest).toContain("#2d6a4f");
    expect(forest).not.toContain("#635bcb");
  });

  it("uses normal letterforms while conservatively truncating text to fixed visual regions", () => {
    const longTitle = "W".repeat(260);
    const svg = renderVisualSvg({
      type: "flow",
      eyebrow: "A SAFE VISUAL",
      title: longTitle,
      subtitle: "A bounded subtitle.",
      steps: [
        { title: longTitle, detail: longTitle },
        { title: longTitle, detail: longTitle },
        { title: longTitle, detail: longTitle },
      ],
    });

    expect(svg).toContain("…");
    const titleElement = svg.split('<text x="54" y="170"')[1]?.split("</text>")[0] ?? "";
    expect(titleElement).not.toContain(longTitle);
    expect(titleElement).toContain('<tspan x="54" dy="0" data-bounded-text="true">');
    expect(svg).toContain('<tspan x="79" dy="0" data-bounded-text="true">');
    expect(svg).not.toContain("textLength=");
    expect(svg).not.toContain("lengthAdjust=");

    const decisionForkSvg = renderVisualSvg({
      type: "decision_fork",
      eyebrow: "A SAFE VISUAL",
      title: "A contained decision",
      subtitle: "A bounded subtitle.",
      steps: [
        { title: longTitle, detail: "A contained starting point." },
        { title: longTitle, detail: "A contained left outcome." },
        { title: longTitle, detail: "A contained right outcome." },
      ],
    });
    expect(decisionForkSvg).toContain("…");
    expect(decisionForkSvg).not.toContain(longTitle);
    expect(decisionForkSvg).toContain('<tspan x="540" data-bounded-text="true">');
    expect(decisionForkSvg).toContain('<tspan x="140" data-bounded-text="true">');
    expect(decisionForkSvg).toContain('<tspan x="622" data-bounded-text="true">');

    const contrastSvg = renderVisualSvg({
      type: "contrast",
      eyebrow: "A SAFE VISUAL",
      title: longTitle,
      subtitle: longTitle,
      steps: [
        { title: longTitle, detail: longTitle },
        { title: longTitle, detail: longTitle },
        { title: longTitle, detail: longTitle },
      ],
    });
    expect(contrastSvg).toContain('<tspan x="540" data-bounded-text="true">');

    const verticalSvg = renderVisualSvg({
      type: "maturity_path",
      eyebrow: "A SAFE VISUAL",
      title: longTitle,
      subtitle: longTitle,
      steps: [
        { title: longTitle, detail: longTitle },
        { title: longTitle, detail: longTitle },
        { title: longTitle, detail: longTitle },
      ],
    });
    expect(verticalSvg).toContain('<tspan x="202" data-bounded-text="true">');
    expect(verticalSvg).toContain('<tspan x="202" dy="0" data-bounded-text="true">');
  });

  it("creates the browser preview from the exact escaped SVG used for export", () => {
    const visual = visualCompanionFor("A safe visual", "A short, bounded visual description.");
    const url = visualSvgDataUrl(visual);
    expect(url).toMatch(/^data:image\/svg\+xml;charset=utf-8,/);
    expect(decodeURIComponent(url.split(",", 2)[1]!)).toBe(renderVisualSvg(visual));
  });
});
