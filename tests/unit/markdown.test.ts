import { describe, expect, it } from "vitest";
import { parseMarkdownSections } from "../../src/content/markdown";

describe("parseMarkdownSections", () => {
  it("preserves heading paths and source locations", () => {
    const sections = parseMarkdownSections("Opening thought\n\n# Strategy\nA point\n\n## Audience\nA detail");
    expect(sections).toEqual([
      expect.objectContaining({ headingPath: "Document introduction", sequence: 1, sourceLocation: "line 1" }),
      expect.objectContaining({ headingPath: "Strategy", sequence: 2, sourceLocation: "line 3" }),
      expect.objectContaining({ headingPath: "Strategy › Audience", sequence: 3, sourceLocation: "line 6" }),
    ]);
  });
});
