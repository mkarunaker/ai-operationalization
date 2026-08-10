"use client";

import type { VisualCompanion } from "@/visual/companion";
import { renderVisualSvg } from "@/visual/companion";

export function VisualFlow({ visual }: { visual: VisualCompanion }) {
  function download() {
    const blob = new Blob([renderVisualSvg(visual)], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = visual.filePath.split("/").at(-1) || "editorial-flow.svg";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="visual-flow">
      <div className="visual-flow-card">
        <p className="eyebrow">{visual.eyebrow}</p>
        <h3>{visual.title}</h3>
        <p>{visual.subtitle}</p>
        {visual.type === "maturity_path" ? (
          <ol className="visual-maturity-path">{visual.steps.map((step, index) => <li key={step.title} className={index === 1 ? "highlighted" : undefined}><span>{index + 1}</span><div><h4>{step.title}</h4><p>{step.detail}</p></div></li>)}</ol>
        ) : visual.type === "contrast" ? (
          <div className="visual-iceberg">
            <div className="visual-iceberg-visible">
              <span>Visible activity</span>
              <h4>{visual.steps[0]?.title}</h4>
              <p>{visual.steps[0]?.detail}</p>
            </div>
            <div className="visual-iceberg-waterline" aria-hidden="true" />
            <div className="visual-iceberg-below">
              <span>Below the surface</span>
              <h4>{visual.steps[1]?.title}</h4>
              <p>{visual.steps[1]?.detail}</p>
              <strong>{visual.steps[2]?.title}</strong>
              <p>{visual.steps[2]?.detail}</p>
            </div>
          </div>
        ) : visual.type === "decision_fork" ? (
          <div className="visual-decision-fork">
            <div className="visual-fork-start"><strong>{visual.steps[0]?.title}</strong><span>{visual.steps[0]?.detail}</span></div>
            <div className="visual-fork-branches">
              <div className="visual-fork-risk"><h4>{visual.steps[1]?.title}</h4><p>{visual.steps[1]?.detail}</p></div>
              <div className="visual-fork-safe"><h4>{visual.steps[2]?.title}</h4><p>{visual.steps[2]?.detail}</p></div>
            </div>
          </div>
        ) : (
          <div className="visual-flow-steps">
            {visual.steps.map((step, index) => (
              <div key={step.title} className={index === 1 ? "visual-step highlighted" : "visual-step"}>
                <span>{index + 1}</span>
                <h4>{step.title}</h4>
                <p>{step.detail}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="visual-flow-meta">
        <p><b>Caption:</b> {visual.caption}</p>
        <p><b>Alt text:</b> {visual.altText}</p>
        <button type="button" onClick={download}>Download SVG</button>
      </div>
    </div>
  );
}
