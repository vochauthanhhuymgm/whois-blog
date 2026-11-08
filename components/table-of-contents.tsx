"use client";

import * as React from "react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function parseHeadings(htmlContent: string): TocItem[] {
  if (!htmlContent) return [];
  const headingRegex = /<h([23])[^>]*>(.*?)<\/h\1>/gi;
  const items: TocItem[] = [];
  let match;

  while ((match = headingRegex.exec(htmlContent)) !== null) {
    const level = parseInt(match[1], 10);
    // Strip any nested tags inside heading
    const text = match[2].replace(/<[^>]*>/g, "").trim();
    if (text) {
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      items.push({ id, text, level });
    }
  }

  return items;
}

export function TableOfContents({ htmlContent }: { htmlContent: string }) {
  const headings = React.useMemo(() => parseHeadings(htmlContent), [htmlContent]);
  const [activeId, setActiveId] = React.useState<string>("");

  React.useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "0% 0% -60% 0%" }
    );

    headings.forEach((heading) => {
      const el = document.getElementById(heading.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav className="p-4 rounded-lg border bg-card text-card-foreground text-sm space-y-2">
      <h3 className="font-semibold uppercase tracking-wider text-xs text-muted-foreground mb-3">
        Table of Contents
      </h3>
      <ul className="space-y-1.5">
        {headings.map((heading, i) => (
          <li
            key={i}
            className={`${heading.level === 3 ? "pl-4 text-xs" : "font-medium"}`}
          >
            <a
              href={`#${heading.id}`}
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(heading.id);
                if (el) {
                  el.scrollIntoView({ behavior: "smooth" });
                  setActiveId(heading.id);
                }
              }}
              className={`hover:text-primary transition-colors line-clamp-1 ${
                activeId === heading.id
                  ? "text-primary font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
