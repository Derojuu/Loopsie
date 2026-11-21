import { PRICING_FEATURES, PRICING_FEATURES_TITLE, PRICING_TITLE } from "@/constants/pricing";
import { PricingRoot } from "@/components/sections/pricing/PricingRoot";
import { PricingToggle } from "@/components/sections/pricing/PricingToggle";
import { PricingSheet } from "@/components/sections/pricing/PricingSheet";
import { PricingCta } from "@/components/sections/pricing/PricingCta";

/** "One Plan. Everything included." pricing section with the WebGL paper-flip plan card. */
export function Pricing() {
  return (
    <PricingRoot>
      <div className="container max-w-none px-cont">
        <div className="flex flex-col items-center gap-74 text-center l:gap-40 s:gap-24">
          <h2 className="h2 pricing_title max-w-691 l:max-w-480 s:max-w-300">{PRICING_TITLE}</h2>
          <PricingToggle />
        </div>
        <div className="mx-auto mt-40 w-1070 l:mt-32 l:w-full">
          <div className="pricing_cards flex l:flex-col l:gap-10">
            <PricingSheet />
            <div className="pricing_panel flex aspect-[535/530] w-535 shrink-0 flex-col justify-between rounded-20 bg-white p-40 l:aspect-auto l:w-full l:gap-40 l:p-30 s:p-24">
              <p className="pricing_card-title">{PRICING_FEATURES_TITLE}</p>
              <ul className="flex flex-col divide-y divide-black/20">
                {PRICING_FEATURES.map((feature) => (
                  <li
                    key={feature}
                    className="text-copy leading-1.4 flex items-start gap-15 py-16 first:pt-0 last:pb-0 l:py-10"
                  >
                    <span className="flex h-[1lh] shrink-0 items-center" aria-hidden="true">
                      <span className="size-[0.5em] bg-black s:size-[0.375em]" />
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <PricingCta />
        </div>
      </div>
    </PricingRoot>
  );
}
