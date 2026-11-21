import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/utils/cn";
import type { HighlightCard as HighlightCardData } from "@/constants/highlights";

interface HighlightsCardProps {
  card: HighlightCardData;
  index: number;
  total: number;
  /** The illustration rendered in the coloured media panel. */
  children: ReactNode;
}

/** One sticky feature card: copy + bullet points on the left, illustration on the right. */
export function HighlightsCard({ card, index, total, children }: HighlightsCardProps) {
  const isLast = index === total - 1;
  return (
    <article
      className={cn(
        "highlights_card relative flex min-h-590 origin-top items-center gap-120 overflow-clip rounded-60 bg-white pl-80 shadow-[0_4px_45px_rgba(0,0,0,0.05)] l:min-h-0 l:flex-col l:gap-0 l:rounded-30 l:p-0 s:rounded-20",
        isLast && "highlights_card--last",
      )}
      style={{ "--i": index } as CSSProperties}
    >
      <div className="highlights_text flex flex-1 flex-col justify-between self-stretch py-64 l:w-full l:gap-40 l:p-40 s:gap-20 s:p-20">
        <div className="flex flex-col gap-16 l:gap-10">
          <div className="flex flex-col gap-20 l:flex-row l:items-baseline s:flex-col s:items-start s:gap-8">
            <p className="highlights_step font-hand">
              {index + 1}
              <span className="highlights_step-total">/{total}</span>
            </p>
            <h3 className="highlights_card-title">{card.title}</h3>
          </div>
          <p className="text-lead-semi l:max-w-490">{card.lead}</p>
        </div>
        <ul className="highlights_points flex flex-col divide-y divide-black/20">
          {card.points.map((point) => (
            <li key={point} className="text-copy leading-1.4 flex items-start gap-10 py-15.5 first:pt-0 last:pb-0">
              <span className="flex h-[1lh] shrink-0 items-center" aria-hidden="true">
                <span className="size-[0.5em] bg-black s:size-[0.375em]" />
              </span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>
      <div
        className={cn(
          card.media,
          "highlights_media flex w-755 shrink-0 items-center justify-center self-stretch overflow-clip rounded-r-60 l:w-full l:self-auto l:rounded-r-none l:rounded-b-30 l:py-40 s:rounded-b-20 s:p-20",
        )}
      >
        {children}
      </div>
      <div
        className="highlights_trame pointer-events-none absolute inset-0 rounded-60 bg-black opacity-0 l:rounded-30 s:rounded-20"
        aria-hidden="true"
      />
    </article>
  );
}
