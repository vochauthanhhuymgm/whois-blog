"use client";

import * as React from "react";
import { extractHeadings } from "@/lib/heading-utils";

export function TableOfContents({ htmlContent }: { htmlContent: string }) {
  const headings = React.useMemo(() => extractHeadings(htmlContent), [htmlContent]);
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
        {headings.map((heading) => (
          <li
            key={heading.id}
            className={`${heading.level === 3 ? "pl-4 text-xs" : "font-medium"}`}
          >
            <a
              href={`#${heading.id}`}
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(heading.id);
                if (el) {
                  el.scrollIntoView({ behavior: "smooth" });
                  history.replaceState(null, "", `#${heading.id}`);
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
