"use client";

import type { ReactNode } from "react";
import type { VisualCompanion } from "@/visual/companion";
import { visualSvgDataUrl } from "@/visual/companion";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function pngFilename(visual: VisualCompanion) {
  const sourceName = visual.filePath.split("/").at(-1) || "editorial-flow.svg";
  return sourceName.replace(/\.svg$/i, ".png");
}

export function VisualFlow({ visual, actions }: { visual: VisualCompanion; actions?: ReactNode }) {
  function downloadPng() {
    if (visual.type === "custom_image") {
      void fetch(`/api/visuals/${encodeURIComponent(visual.id)}`)
        .then((response) => response.ok ? response.blob() : undefined)
        .then((png) => { if (png) downloadBlob(png, pngFilename(visual)); });
      return;
    }
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1080;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((png) => {
        if (png) downloadBlob(png, pngFilename(visual));
      }, "image/png");
    };
    image.src = visualSvgDataUrl(visual);
  }

  return (
    <div className="visual-flow">
      <figure className="visual-flow-figure">
        {/* eslint-disable-next-line @next/next/no-img-element -- This exact escaped local SVG data URL is also the export source. */}
        <img
          className="visual-rendered-asset"
          src={visual.type === "custom_image" ? `/api/visuals/${encodeURIComponent(visual.id)}` : visualSvgDataUrl(visual)}
          alt={visual.altText}
        />
      </figure>
      <div className="visual-flow-meta">
        <p><b>Caption:</b> {visual.caption}</p>
        <p><b>Alt text:</b> {visual.altText}</p>
        <div className="visual-flow-actions">
          {actions}
          <button type="button" onClick={downloadPng}>Download PNG</button>
        </div>
      </div>
    </div>
  );
}
