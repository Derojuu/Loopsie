"use client";

import { useRef, type CSSProperties } from "react";
import { cn } from "@/utils/cn";
import { useGsap } from "@/hooks/useGsap";
import { DICTATE_SCENES } from "@/constants/highlights";
import { prefersReducedMotion, snapshot, whileVisible } from "@/components/sections/highlights/motion";
import { cleanParagraphs, DictateScenes } from "@/components/sections/highlights/dictateScenes";

const FIRST = DICTATE_SCENES[0];
const RESTING_BARS = [0.7375, 0.4625, 0.2562, 0.1875, 0.2562];

/** Card 6 — dictation pill cleaning up speech into a message in different apps. */
export function Dictate() {
  const root = useRef<HTMLDivElement>(null);

  useGsap(
    (gsap) => {
      const el = root.current;
      if (!el || prefersReducedMotion()) return;
      const restore = snapshot(el);
      const scenes = new DictateScenes(gsap, el);
      const stop = whileVisible(el, () => scenes.play(), () => scenes.pause());
      return () => {
        stop();
        scenes.destroy();
        restore();
      };
    },
    root,
  );

  return (
    <div ref={root} inert className="feature-visual dictate relative h-470 w-635 shrink-0 overflow-clip rounded-20 bg-grey is-apps">
      <p className="absolute left-40 top-40 whitespace-nowrap visual-title text-black opacity-50">Dictation</p>
      <div className="dictate_stage absolute inset-x-60 top-110 bottom-150 hidden items-center justify-center" />
      <div className="dictate_frame absolute inset-x-60 top-95 bottom-128 flex flex-col gap-14 rounded-15 bg-white px-26 pt-16 pb-18">
        <div className="flex items-center gap-10 border-b border-[#ececea] pb-14">
          <span className={cn("dictate_app-dot size-12 shrink-0 rounded-full", FIRST.color)} />
          <p className="whitespace-nowrap ui-14 font-medium leading-none text-[#1c1c1a]">
            <span className="dictate_app">{FIRST.app}</span>{" "}
            <span className="text-[#999991]">
              · <span className="dictate_label">{FIRST.label}</span>
            </span>
          </p>
        </div>
        <div className="dictate_area relative flex-1 font-medium text-[#1c1c1a]">
          {cleanParagraphs(FIRST.said).map((para, i) => (
            <p key={i} className={cn(para.gap && "dictate_gap")}>
              {para.text}
            </p>
          ))}
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-40 flex justify-center">
        <div className="dictate_pill flex h-64 items-center gap-20 rounded-full border border-[#8d8d8d]/30 bg-white px-10 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
          <span className="dictate_side flex size-44 items-center justify-center rounded-full bg-black/10">
            <svg className="size-18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="#1c1c1a" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          <span className="flex h-32 w-42 items-center justify-between">
            {RESTING_BARS.map((level, i) => (
              <span key={i} className="dictate_bar h-full w-4 bg-[#1c1c1a]" style={{ "--bar": level } as CSSProperties} />
            ))}
          </span>
          <span className="dictate_side flex size-44 items-center justify-center rounded-full bg-main">
            <svg className="size-20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M4.5 10.5l3.5 3.5 7.5-8" stroke="#1b1715" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}
