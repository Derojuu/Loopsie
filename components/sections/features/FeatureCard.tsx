"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { FeatureCardColor, FeatureCardData } from "@/constants/features";
import { MEDIA } from "@/constants/motion";
import { registerGsap, SplitText } from "@/lib/gsap";

const CARD_BG: Record<FeatureCardColor, string> = {
  sky: "bg-sky",
  steel: "bg-steel",
  coral: "bg-coral",
  main: "bg-main",
  "lime-light": "bg-lime-light",
  sage: "bg-sage",
  apricot: "bg-apricot",
};

interface FeatureCardProps {
  card: FeatureCardData;
  /** The card's animated visual. */
  children: ReactNode;
}

/**
 * Feature tile. On hover-capable devices the description is hidden and
 * slides in word by word on hover, while the optional note slides out.
 */
export function FeatureCard({ card, children }: FeatureCardProps) {
  const cardRef = useRef<HTMLElement>(null);
  const swapRef = useRef<HTMLDivElement>(null);
  const noteRef = useRef<HTMLParagraphElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    const swap = swapRef.current;
    const desc = descRef.current;
    if (!el || !swap || !desc) return;
    if (!window.matchMedia(MEDIA.finePointer).matches || window.matchMedia(MEDIA.reducedMotion).matches) return;

    const gsap = registerGsap();
    let teardown: (() => void) | null = null;

    const build = () => {
      const note = noteRef.current;
      swap.classList.add("is-swap");
      const splits = [note, desc]
        .filter((node): node is HTMLParagraphElement => !!node)
        .map((node) => SplitText.create(node, { type: "lines, words", aria: "none" }));
      gsap.set(
        splits.flatMap((s) => s.lines),
        { overflow: "hidden", paddingBottom: "0.1em", marginBottom: "-0.1em" },
      );

      const descSplit = splits[splits.length - 1];
      const noteWords = note ? splits[0].words : [];
      const tl = gsap.timeline({ paused: true, defaults: { ease: "power4", duration: 0.8 } });
      const out = 0.35;
      const stagger = 0.02;
      if (noteWords.length) tl.to(noteWords, { yPercent: -110, duration: out, ease: "power2.in", stagger }, 0);
      const start = noteWords.length ? out + stagger * (noteWords.length - 1) : 0;
      descSplit.lines.forEach((line, i) => {
        tl.fromTo(line.querySelectorAll("div"), { yPercent: 110 }, { yPercent: 0, stagger: 0.03 }, start + i * 0.05);
      });

      const enter = () => tl.timeScale(1).play();
      const leave = () => tl.timeScale(1.6).reverse();
      el.addEventListener("mouseenter", enter);
      el.addEventListener("mouseleave", leave);

      teardown = () => {
        el.removeEventListener("mouseenter", enter);
        el.removeEventListener("mouseleave", leave);
        tl.kill();
        splits.forEach((s) => s.revert());
        swap.classList.remove("is-swap");
      };
    };

    const rebuild = () => {
      teardown?.();
      build();
    };

    let width = window.innerWidth;
    const onResize = () => {
      if (window.innerWidth === width) return;
      width = window.innerWidth;
      rebuild();
    };

    let cancelled = false;
    build();
    document.fonts?.ready.then(() => !cancelled && rebuild());
    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      teardown?.();
    };
  }, []);

  return (
    <article
      ref={cardRef}
      className={`${CARD_BG[card.color]} features_card flex aspect-square flex-col justify-between gap-20 overflow-clip rounded-20 p-20 text-black l:aspect-auto l:h-184 l:flex-row-reverse l:items-center s:h-auto s:flex-col s:items-start`}
    >
      <div className="flex flex-col gap-4 l:w-312 l:shrink-0 l:self-start s:w-full">
        <h3 className="features_card-title">{card.title}</h3>
        <div ref={swapRef} className="features_card-swap flex flex-col">
          {card.note && (
            <p ref={noteRef} className="features_card-note font-hand">
              {card.note}
            </p>
          )}
          <p ref={descRef} className="features_card-desc text-lead-semi">
            {card.description}
          </p>
        </div>
      </div>
      {children}
    </article>
  );
}
