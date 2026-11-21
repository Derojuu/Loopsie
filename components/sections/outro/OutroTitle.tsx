"use client";

import { useRef, type CSSProperties } from "react";
import { useGsap } from "@/hooks/useGsap";
import { ScrollTrigger } from "@/lib/gsap";

/** Minimum gap between words, in em (original `zn`). */
const WORD_GAP = 0.25;

/** Each word with its authored wave lift (multiplied by `--px` × `--wave`). */
const WORDS = [
  { word: "Shipped", className: undefined },
  { word: "weekly,", className: "[transform:translate3d(0,calc(var(--px)*var(--wave,1)*-2em),0)]" },
  { word: "shaped", className: "[transform:translate3d(0,calc(var(--px)*var(--wave,1)*-4em),0)]" },
  { word: "by", className: "[transform:translate3d(0,calc(var(--px)*var(--wave,1)*-2em),0)]" },
  { word: "you", className: undefined },
] as const;

/**
 * Justified outro line. The font size is fitted so the words span the full
 * width, and the arched "wave" flattens (`--px` 1 → 0) as the title scrolls up.
 * `data-footer-open` tells the nav when to morph into the footer card.
 */
export function OutroTitle() {
  const title = useRef<HTMLDivElement>(null);
  const line = useRef<HTMLDivElement>(null);

  useGsap(
    (gsap) => {
      const titleEl = title.current;
      const lineEl = line.current;
      if (!titleEl || !lineEl) return;
      let tween: gsap.core.Tween | undefined;
      let trigger: ScrollTrigger | undefined;
      let width = 0;

      const fit = () => {
        titleEl.style.removeProperty("font-size");
        const words = [...lineEl.children];
        const size = parseFloat(getComputedStyle(titleEl).fontSize);
        const total = words.reduce((sum, w) => sum + w.getBoundingClientRect().width, 0);
        const room = lineEl.clientWidth - WORD_GAP * size * (words.length - 1);
        if (total > room) titleEl.style.fontSize = `${(size * room) / total}px`;
      };

      const build = () => {
        trigger?.kill();
        tween?.kill();
        tween = gsap.fromTo(titleEl, { "--px": 1 }, { "--px": 0, ease: "none", paused: true });
        trigger = ScrollTrigger.create({
          trigger: titleEl,
          start: "top bottom",
          endTrigger: lineEl,
          end: "top top",
          scrub: true,
          animation: tween,
        });
      };

      const update = () => {
        fit();
        build();
        width = window.innerWidth;
        ScrollTrigger.refresh();
      };
      const onResize = () => {
        if (window.innerWidth !== width) update();
      };

      fit();
      build();
      width = window.innerWidth;
      document.fonts.ready.then(() => titleEl.isConnected && update());
      window.addEventListener("resize", onResize);

      return () => {
        window.removeEventListener("resize", onResize);
        trigger?.kill();
        tween?.kill();
      };
    },
    title,
  );

  return (
    <div ref={title} className="outro_title pt-[4em] text-black" aria-hidden="true" style={{ "--px": 1 } as CSSProperties}>
      <div ref={line} className="outro_line flex justify-between" data-footer-open="top 10%">
        {WORDS.map(({ word, className }) => (
          <div key={word} className={className}>
            {word}
          </div>
        ))}
      </div>
    </div>
  );
}
