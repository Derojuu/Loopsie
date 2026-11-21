"use client";

import type { ReactNode } from "react";
import type { FeatureGroupData } from "@/constants/features";
import { cn } from "@/utils/cn";
import { useFeaturesAccordion } from "@/components/sections/features/FeaturesList";

interface FeatureItemProps {
  group: FeatureGroupData;
  index: number;
  /** The phase's cards (rendered on the server). */
  children: ReactNode;
}

/** One project phase: sticky aside (phase pill + heading) and its card grid; collapsible on mobile. */
export function FeatureItem({ group, index, children }: FeatureItemProps) {
  const { openIndex, toggle } = useFeaturesAccordion();
  const open = openIndex === index;
  const bodyId = `features-${group.id}-body`;

  return (
    <div
      className={cn(
        "features_item flex gap-20 l:flex-col l:gap-0 l:border-b l:border-black/20 l:pb-20",
        open && "is-open",
      )}
    >
      <div
        className="features_aside relative flex w-603 shrink-0 flex-col items-start gap-10 pt-20 pc:sticky pc:self-start l:w-full l:pt-0 l:pr-60 s:pr-95"
        onClick={() => toggle(index)}
      >
        <span className="features_phase rounded-full border border-black px-10 py-4">{group.phase}</span>
        <h3 className="h3">
          {group.title[0]}
          <br className="l:hidden" /> {group.title[1]}
        </h3>
        <button
          type="button"
          data-track={group.track}
          className="features_toggle absolute right-0 bottom-0 hidden size-36 l:block s:bottom-6"
          aria-expanded={open}
          aria-controls={bodyId}
          aria-label={group.phase}
        />
      </div>
      <div className="features_body flex-1" id={bodyId}>
        <div className="features_body-inner">
          <div className="features_grid grid grid-cols-3 gap-20 l:grid-cols-1 l:gap-10 l:pt-20 s:grid-cols-1 s:pt-40">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
