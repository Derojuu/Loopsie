"use client";

import { useRef, type AnchorHTMLAttributes, type MouseEventHandler } from "react";
import { useWeightHover, WEIGHT_CHAR_ATTR } from "@/hooks/useWeightHover";

interface WeightHoverLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children"> {
  label: string;
  track?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}

/** Link whose characters swell in weight around the cursor (`WeightHover`). */
export function WeightHoverLink({ label, track, ...rest }: WeightHoverLinkProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  useWeightHover(ref);

  return (
    <a ref={ref} data-track={track} aria-label={label} {...rest}>
      {[...label].map((char, i) =>
        char === " " ? (
          " "
        ) : (
          <span key={i} {...{ [WEIGHT_CHAR_ATTR]: "" }} aria-hidden="true" className="relative inline-block">
            {char}
          </span>
        ),
      )}
    </a>
  );
}
