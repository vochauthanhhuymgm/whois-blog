import { describe, it, expect } from "vitest";
import {
  demoteH1,
  extractHeadings,
  injectHeadingIds,
  slugifyHeading,
} from "@/lib/heading-utils";

describe("Table of Contents & Headings", () => {
  it("parses h2 and h3 headings correctly", () => {
    const html = `
      <h2>Introduction</h2>
      <p>Intro text</p>
      <h3>Background Story</h3>
      <p>More text</p>
      <h2>Deep Dive</h2>
    `;
    const headings = extractHeadings(html);
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

  it("folds Vietnamese diacritics into readable ids", () => {
    expect(slugifyHeading("Giới thiệu")).toBe("gioi-thieu");
    expect(slugifyHeading("Đường dẫn & Cấu hình")).toBe("duong-dan-cau-hinh");
  });

  it("keeps non-Latin scripts and never returns an empty id", () => {
    expect(slugifyHeading("日本語の見出し")).toBe("日本語の見出し");
    expect(slugifyHeading("!!!")).toBe("section");
  });

  it("gives repeated headings unique ids, matching between TOC and content", () => {
    const html = "<h2>Setup</h2><h3>Setup</h3><h2>Setup</h2>";
    expect(extractHeadings(html).map((h) => h.id)).toEqual(["setup", "setup-1", "setup-2"]);

    const output = injectHeadingIds(html);
    expect(output).toContain('<h2 id="setup">');
    expect(output).toContain('<h3 id="setup-1">');
    expect(output).toContain('<h2 id="setup-2">');
  });

  it("decodes entities for TOC text and replaces existing id attributes", () => {
    expect(extractHeadings("<h2>Q&amp;A</h2>")[0]).toEqual({ id: "q-a", text: "Q&A", level: 2 });
    expect(injectHeadingIds('<h2 class="x" id="old">Hello</h2>')).toBe(
      '<h2 class="x" id="hello">Hello</h2>'
    );
  });

  it("demotes h1 in post content to h2 so the title stays the only h1", () => {
    expect(demoteH1('<h1 class="a">Title</h1><h10>x</h10>')).toBe('<h2 class="a">Title</h2><h10>x</h10>');
    expect(extractHeadings("<h1>Overview</h1>")).toEqual([
      { id: "overview", text: "Overview", level: 2 },
    ]);
  });
});
