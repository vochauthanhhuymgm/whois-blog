import { describe, it, expect } from "vitest";
import { calculateReadingTime, stripHtml } from "@/lib/reading-time";

describe("Reading Time & HTML Stripper Utility", () => {
  it("strips HTML tags cleanly to extract plain text", () => {
    const html = "<p>Hello <strong>World</strong>! This is a <a href='#'>test</a>.</p>";
    expect(stripHtml(html)).toBe("Hello World! This is a test.");
  });

  it("calculates minimum 1 minute for short content", () => {
    const html = "<p>Just a few words.</p>";
    expect(calculateReadingTime(html)).toBe(1);
  });

  it("calculates accurate reading time at 200 words per minute", () => {
    // 450 words should be Math.ceil(450 / 200) = 3 minutes
    const words = Array(450).fill("word").join(" ");
    const html = `<article><p>${words}</p></article>`;
    expect(calculateReadingTime(html)).toBe(3);
  });

  it("handles empty or null content safely", () => {
    expect(calculateReadingTime("")).toBe(1);
    expect(calculateReadingTime("   ")).toBe(1);
  });
});
