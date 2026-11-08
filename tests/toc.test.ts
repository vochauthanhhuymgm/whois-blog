import { describe, it, expect } from "vitest";
import { parseHeadings } from "@/components/table-of-contents";
import { injectHeadingIds } from "@/lib/heading-utils";

describe("Table of Contents & Headings", () => {
  it("parses h2 and h3 headings correctly", () => {
    const html = `
      <h2>Introduction</h2>
      <p>Intro text</p>
      <h3>Background Story</h3>
      <p>More text</p>
      <h2>Deep Dive</h2>
    `;
    const headings = parseHeadings(html);
    expect(headings.length).toBe(3);
    expect(headings[0]).toEqual({ id: "introduction", text: "Introduction", level: 2 });
    expect(headings[1]).toEqual({ id: "background-story", text: "Background Story", level: 3 });
    expect(headings[2]).toEqual({ id: "deep-dive", text: "Deep Dive", level: 2 });
  });

  it("injects anchor ids into headings in HTML", () => {
    const html = "<h2>Getting Started</h2><p>Content</p>";
    const output = injectHeadingIds(html);
    expect(output).toContain('<h2 id="getting-started">Getting Started</h2>');
  });
});
