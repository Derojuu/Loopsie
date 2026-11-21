import { createElement, type ElementType } from "react";
import { cn } from "@/utils/cn";

export interface RevealTextProps {
  text: string;
  as?: ElementType;
  className?: string;
  /** Start with every word pushed below its mask (110%). Defaults to true. */
  hidden?: boolean;
}

/**
 * Word-mask text: every word sits in an overflow-hidden `.mask` so it can slide
 * up into view. The plain string stays available to assistive tech via `sr-only`.
 * Animate the `[data-reveal-word]` spans (grouped per rendered line with
 * {@link getRevealLines}).
 */
export function RevealText({ text, as = "p", className, hidden = true }: RevealTextProps) {
  const words = text.split(/\s+/).filter(Boolean);
  return createElement(
    as,
    { className },
    <span className="sr-only">{text}</span>,
    words.map((word, i) => (
      <span key={i} aria-hidden="true">
        <span className="mask">
          <span data-reveal-word="" className={cn("word relative", hidden && "translate-y-[110%]")}>
            {word}
          </span>
        </span>
        {i < words.length - 1 ? " " : null}
      </span>
    )),
  );
}

/** Groups the word spans inside `root` by rendered line (top offset), in reading order. */
export function getRevealLines(root: Element): HTMLElement[][] {
  const words = [...root.querySelectorAll<HTMLElement>("[data-reveal-word]")];
  const lines: HTMLElement[][] = [];
  let lastTop: number | null = null;
  for (const word of words) {
    const top = Math.round((word.parentElement ?? word).getBoundingClientRect().top);
    if (lastTop === null || Math.abs(top - lastTop) > 2) {
      lines.push([]);
      lastTop = top;
    }
    lines[lines.length - 1].push(word);
  }
  return lines;
}
