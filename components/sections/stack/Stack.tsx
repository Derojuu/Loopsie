"use client";

import { useRef, type CSSProperties } from "react";
import { SECTION_IDS } from "@/constants/site";
import { STACK_APPS, STACK_HLINES, STACK_NOTE, STACK_SIDES, STACK_TITLE, STACK_VLINES } from "@/constants/stack";
import {
  StackAppCard,
  StackCta,
  StackLinks,
  StackLoop,
  StackOffer,
  StackStats,
} from "@/components/sections/stack/StackParts";
import { useStackMotion } from "@/components/sections/stack/useStackMotion";

/** "Your workflow shouldn't cost this much" — the tool-stack grid and import CTA. */
export function Stack() {
  const root = useRef<HTMLElement>(null);
  useStackMotion(root);

  return (
    <section ref={root} id={SECTION_IDS.why} className="stack relative z-2 pt-120 pb-70 l:pt-100 s:pt-80">
      <div className="container max-w-none px-cont">
        <div className="flex flex-col items-center gap-45 text-center l:gap-24 s:gap-16">
          <p className="stack_note text-note font-hand">{STACK_NOTE}</p>
          <h2 className="h2 stack_title max-w-820 l:max-w-560 s:max-w-335">{STACK_TITLE}</h2>
        </div>
      </div>
      <div className="stack_grid relative mx-auto mt-64 l:mt-60 s:mt-40">
        <div className="stack_cells absolute inset-0 grid">
          <div className="stack_lines absolute inset-0" aria-hidden="true">
            <div>
              {STACK_VLINES.map((i) => (
                <span key={i} className="stack_vline" style={{ "--i": i } as CSSProperties} />
              ))}
            </div>
            <div>
              {STACK_HLINES.map((i) => (
                <span key={i} className="stack_hline" style={{ "--i": i } as CSSProperties} />
              ))}
            </div>
            <span className="stack_tail" />
          </div>
          {STACK_APPS.map((app) => (
            <StackAppCard key={app.id} app={app} />
          ))}
          <StackLinks />
          <StackStats />
          {STACK_SIDES.map((side) => (
            <div key={side.lines[0]} className={side.className}>
              <p className="stack_side-text">
                {side.lines.map((line) => (
                  <span key={line} className="stack_line">
                    <span className="stack_line-in">{line}</span>
                  </span>
                ))}
              </p>
            </div>
          ))}
          <StackLoop />
          <StackOffer />
        </div>
      </div>
      <StackCta />
    </section>
  );
}
