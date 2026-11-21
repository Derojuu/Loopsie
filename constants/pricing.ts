/** Pricing section content (mirrors the original `data-pricing-plans` JSON). */

export interface PricingPlan {
  readonly title: string;
  readonly amount: string;
  readonly period: string;
  readonly note: string;
  /** Sheet colour (also used for the WebGL paper texture). */
  readonly color: string;
}

export const PRICING_PLANS = {
  monthly: { title: "Monthly plan", amount: "$12", period: "/ month", note: "", color: "#c4f041" },
  yearly: { title: "Yearly plan", amount: "$10", period: "/ month", note: "billed $120 yearly", color: "#bce6fa" },
} as const satisfies Record<string, PricingPlan>;

export type PricingPlanId = keyof typeof PRICING_PLANS;

/** Plan order: index 0 sits on top initially; the paper sheets are stacked in this order. */
export const PRICING_PLAN_IDS = ["monthly", "yearly"] as const satisfies readonly PricingPlanId[];

export const PRICING_OPTIONS = [
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly" },
] as const satisfies readonly { id: PricingPlanId; label: string }[];

export const PRICING_TITLE = "One Plan. Everything included.";
export const PRICING_SAVE_LABEL = "Save 17%";
export const PRICING_FEATURES_TITLE = "What’s included";

export const PRICING_FEATURES = [
  "Unlimited projects, clients & time tracking",
  "Meeting and screen recording with AI summaries",
  "Dictation in any app on your Mac",
  "Tasks, invoices & client management",
  "AI assistant to manage your workflow",
] as const;

export const PRICING_CTA = {
  label: "Try it free for 14 days",
  track: "pricing-signup",
} as const;
