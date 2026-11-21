"use client";

import { cn } from "@/utils/cn";
import { PRICING_OPTIONS, PRICING_SAVE_LABEL } from "@/constants/pricing";
import { usePricing } from "@/components/sections/pricing/PricingRoot";

/** Monthly / yearly switch. Hovering it (fine pointers) peeks the paper corner. */
export function PricingToggle() {
  const { plan, select, peek } = usePricing();
  const [monthly, yearly] = PRICING_OPTIONS;
  const isYearly = plan === "yearly";

  const option = ({ id, label }: (typeof PRICING_OPTIONS)[number]) => (
    <button
      className={cn("pricing_option", plan === id && "is-active")}
      type="button"
      data-plan={id}
      aria-pressed={plan === id}
      onClick={() => select(id)}
    >
      {label}
    </button>
  );

  return (
    <div
      className="pricing_toggle flex items-center gap-18 s:gap-10"
      onMouseEnter={() => peek(true)}
      onMouseLeave={() => peek(false)}
    >
      {option(monthly)}
      <button
        className="pricing_switch relative h-40 w-85 rounded-20 border border-black s:h-28 s:w-60 s:rounded-14"
        type="button"
        role="switch"
        aria-checked={isYearly}
        aria-label="Bill yearly"
        data-switch
        onClick={() => select(isYearly ? "monthly" : "yearly")}
      >
        <span className="pricing_knob absolute top-3 left-3 size-32 rounded-full bg-black s:top-2 s:left-2 s:size-22" />
      </button>
      {option(yearly)}
      <span className="pricing_save text-note font-hand whitespace-nowrap">{PRICING_SAVE_LABEL}</span>
    </div>
  );
}
