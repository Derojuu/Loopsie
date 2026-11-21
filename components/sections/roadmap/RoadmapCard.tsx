import type { CSSProperties } from "react";
import { cn } from "@/utils/cn";
import { ROADMAP_TONE_CLASSES, type RoadmapCardData } from "@/constants/roadmap";

interface RoadmapCardProps extends RoadmapCardData {
  index: number;
}

/** One card on the wheel: coloured "0N LOOP" header + bullet list. */
export function RoadmapCard({ index, num, tone, badge, items }: RoadmapCardProps) {
  const toneClass = ROADMAP_TONE_CLASSES[tone];
  return (
    <article
      className="roadmap_card flex flex-col"
      style={{ "--i": index } as CSSProperties}
      aria-label={`Phase ${String(num).padStart(2, "0")}: ${badge}`}
    >
      <div className={cn(toneClass.bg, "roadmap_top relative overflow-clip rounded-20")}>
        <span className="roadmap_num roadmap_num--a" data-reel="0" inert>
          0
        </span>
        <span className="roadmap_num roadmap_num--b" data-reel={num} inert>
          {num}
        </span>
        <span className="roadmap_loop text-white" inert>
          LOOP
        </span>
        <span className={cn(toneClass.text, "roadmap_badge text-note rounded-60 bg-white px-10 font-hand")} inert>
          {badge}
        </span>
      </div>
      <div className="rounded-20 bg-white p-40 l:p-20">
        <ul className="flex flex-col divide-y divide-black/20">
          {items.map((item) => (
            <li
              key={item}
              className="roadmap_item text-copy leading-1.4 flex items-start gap-15 py-16 first:pt-0 last:pb-0 l:py-10"
            >
              <span className="flex h-[1lh] shrink-0 items-center" aria-hidden="true">
                <span className="size-[0.5em] bg-black s:size-[0.375em]" />
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
