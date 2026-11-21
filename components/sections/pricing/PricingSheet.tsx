"use client";

import type { CSSProperties } from "react";
import { cn } from "@/utils/cn";
import { PRICING_PLAN_IDS, PRICING_PLANS } from "@/constants/pricing";
import { usePricing } from "@/components/sections/pricing/PricingRoot";

/**
 * Plan card. The DOM layers are the accessible / no-WebGL version; when the
 * paper effect runs (`.pricing.is-gl`) they are hidden and the GL sheet is
 * drawn exactly over this element.
 */
export function PricingSheet() {
  const { plan } = usePricing();
  return (
    <div
      className="pricing_sheet relative aspect-[535/530] w-535 shrink-0 rounded-20 l:w-full"
      data-pricing-sheet
      style={{ "--sheet": PRICING_PLANS.monthly.color, "--sheet-next": PRICING_PLANS.yearly.color } as CSSProperties}
    >
      {PRICING_PLAN_IDS.map((id) => {
        const { title, amount, period, note } = PRICING_PLANS[id];
        const active = id === plan;
        return (
          <div
            key={id}
            className={cn(
              "pricing_price absolute inset-0 flex flex-col justify-between p-40 s:p-24",
              note && "pb-32 s:pb-20",
              active && "is-active",
            )}
            data-plan-price={id}
            aria-hidden={!active}
          >
            <p className="pricing_card-title">{title}</p>
            <div className="flex flex-col items-start">
              <p className="flex items-end gap-4">
                <span className="pricing_amount">{amount}</span>
                <span className="pricing_period py-12">{period}</span>
              </p>
              {note && <p className="pricing_note -mt-10 self-end py-12">{note}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
