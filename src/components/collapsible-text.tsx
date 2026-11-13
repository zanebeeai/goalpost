"use client";

import { useState } from "react";
import { LinkifiedText } from "@/components/linkified-text";
import { cn } from "@/lib/utils";

const COLLAPSED_LINES = 6;
const CHARS_PER_LINE = 38;

function estimatedLines(text: string): number {
  return text
    .split("\n")
    .reduce(
      (sum, line) => sum + Math.max(1, Math.ceil(line.length / CHARS_PER_LINE)),
      0,
    );
}

/** Linkified text clamped to about six lines, with "Show all". */
export function CollapsibleText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const long = estimatedLines(text) > COLLAPSED_LINES;
  return (
    <div className={className}>
      {/* Keyboard focus on a hidden link expands the text instead of
          scrolling inside the clamped box. */}
      <div
        onFocus={() => {
          if (long && !expanded) setExpanded(true);
        }}
      >
        <LinkifiedText
          text={text}
          className={cn(
            "text-[16px] leading-relaxed text-ink",
            long && !expanded && "line-clamp-6",
          )}
        />
      </div>
      {long ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="-mx-1 mt-1 inline-flex min-h-11 items-center rounded-lg px-1 text-sm font-semibold text-forest-700 underline-offset-2 hover:underline"
        >
          {expanded ? "Show less" : "Show all"}
        </button>
      ) : null}
    </div>
  );
}
