import { ROADMAP_CARDS, ROADMAP_INTRO, ROADMAP_RINGS } from "@/constants/roadmap";
import { RoadmapCard } from "@/components/sections/roadmap/RoadmapCard";
import { RoadmapRing } from "@/components/sections/roadmap/RoadmapRing";
import { RoadmapMotion } from "@/components/sections/roadmap/RoadmapMotion";

/**
 * "The roadmap" — a tall pinned section where scrolling spins a wheel of
 * phase cards around a dotted ring that glows in the active card's colour.
 */
export function Roadmap() {
  return (
    <RoadmapMotion>
      <div className="roadmap_pin sticky top-0 flex h-(--screen-h) flex-col overflow-x-clip">
        <div className="container max-w-none roadmap_intro mb-113 flex shrink-0 flex-col items-center gap-20 text-center l:mb-60 s:mb-40 px-cont">
          <p className="roadmap_note text-note font-hand">{ROADMAP_INTRO.note}</p>
          <h2 id="roadmap-heading" className="h2 roadmap_heading max-w-840 l:max-w-584">{ROADMAP_INTRO.heading}</h2>
        </div>
        <div className="roadmap_stage relative min-h-0 flex-1">
          {ROADMAP_RINGS.map((ring) => (
            <RoadmapRing key={ring.variant} {...ring} />
          ))}
          <div className="roadmap_wheel">
            {ROADMAP_CARDS.map((card, i) => (
              <RoadmapCard key={card.num} index={i} {...card} />
            ))}
          </div>
        </div>
      </div>
    </RoadmapMotion>
  );
}
