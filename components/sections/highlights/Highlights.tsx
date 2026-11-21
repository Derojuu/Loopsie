import type { ComponentType } from "react";
import { HIGHLIGHT_CARDS, HIGHLIGHTS_TITLE, type HighlightVisual } from "@/constants/highlights";
import { HighlightsStack } from "@/components/sections/highlights/HighlightsStack";
import { HighlightsCard } from "@/components/sections/highlights/HighlightsCard";
import { IncomeGauge } from "@/components/sections/highlights/IncomeGauge";
import { Chapters } from "@/components/sections/highlights/Chapters";
import { Timeline } from "@/components/sections/highlights/Timeline";
import { Requests } from "@/components/sections/highlights/Requests";
import { Agent } from "@/components/sections/highlights/Agent";
import { Dictate } from "@/components/sections/highlights/Dictate";

const VISUALS: Record<HighlightVisual, ComponentType> = {
  income: IncomeGauge,
  chapters: Chapters,
  timeline: Timeline,
  requests: Requests,
  agent: Agent,
  dictate: Dictate,
};

/** "Everything around your work, handled" — stacked feature cards with live illustrations. */
export function Highlights() {
  return (
    <section className="highlights relative z-2 py-section s:pt-40">
      <HighlightsStack>
        <h2 className="h2 highlights_title mx-auto mb-80 max-w-740 text-center pc:relative pc:z-10">{HIGHLIGHTS_TITLE}</h2>
        <div className="highlights_cards mx-auto flex max-w-1530 flex-col gap-30">
          {HIGHLIGHT_CARDS.map((card, i) => {
            const Visual = VISUALS[card.visual];
            return (
              <HighlightsCard key={card.title} card={card} index={i} total={HIGHLIGHT_CARDS.length}>
                <Visual />
              </HighlightsCard>
            );
          })}
        </div>
      </HighlightsStack>
    </section>
  );
}
