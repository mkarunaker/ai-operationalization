export type ParsedSection = {
  headingPath: string;
  sequence: number;
  text: string;
  sourceLocation: string;
};

type Heading = { depth: number; text: string };

function normaliseHeading(value: string): string {
  return value.replace(/[`*_]/g, "").replace(/\s+/g, " ").trim();
}

/** Parses Markdown into displayable, traceable sections without executing any content. */
export function parseMarkdownSections(markdown: string): ParsedSection[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const sections: Array<{ headingPath: string; startLine: number; lines: string[] }> = [];
  const headings: Heading[] = [];
  let current: { headingPath: string; startLine: number; lines: string[] } | undefined;

  const startSection = (headingPath: string, startLine: number) => {
    if (current && current.lines.join("\n").trim()) sections.push(current);
    current = { headingPath, startLine, lines: [] };
  };

  for (const [index, line] of lines.entries()) {
    const match = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (match) {
      const depth = match[1].length;
      const text = normaliseHeading(match[2]);
      while (headings.length && headings[headings.length - 1].depth >= depth) headings.pop();
      headings.push({ depth, text });
      startSection(headings.map((heading) => heading.text).join(" › "), index + 1);
      continue;
    }

    if (!current) startSection("Document introduction", 1);
    current!.lines.push(line);
  }

  if (current && current.lines.join("\n").trim()) sections.push(current);

  return sections.map((section, index) => ({
    headingPath: section.headingPath,
    sequence: index + 1,
    text: section.lines.join("\n").trim(),
    sourceLocation: `line ${section.startLine}`,
  }));
}
