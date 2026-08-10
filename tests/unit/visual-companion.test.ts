import { describe, expect, it } from "vitest";
import { renderVisualSvg, visualCompanionFor } from "@/visual/companion";

describe("visual companion selection", () => {
  it("uses a distinct maturity framework for activity-versus-maturity content", () => {
    const visual = visualCompanionFor("Activity is not maturity", "Licenses, pilots, and experiments can coexist with low operational maturity.");
    expect(visual.type).toBe("contrast");
    expect(visual.title).toBe("Activity is not AI maturity");
    expect(visual.steps.map((step) => step.title)).toEqual(["Activity", "Operating discipline", "Maturity"]);
    const svg = renderVisualSvg(visual);
    expect(svg).toContain('Licenses · pilots · prompts · demos');
    expect(svg).toContain('M330 570 L540 960 L750 570 Z');
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
    expect(renderVisualSvg(flow)).toContain('width="280" height="300"');
    const vertical = visualCompanionFor("Activity is not maturity", "Licenses and pilots can coexist with weak maturity.", "vertical_path");
    expect(vertical.type).toBe("maturity_path");
    expect(renderVisualSvg(vertical)).toContain('M142 536 V624');
  });
});
