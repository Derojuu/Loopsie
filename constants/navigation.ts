import { LINKS, SECTION_IDS, SOCIALS } from "@/constants/site";

/** In-page section links shown in the centre of the nav bar (desktop only). */
export const NAV_LINKS = [
  { label: "Why Loopsii", id: SECTION_IDS.why, track: "nav-why-loopsii" },
  { label: "Features", id: SECTION_IDS.features, track: "nav-features" },
  { label: "Pricing", id: SECTION_IDS.pricing, track: "nav-pricing" },
] as const;

/** Social links in the legal panel revealed when the nav morphs into the footer card. */
export const NAV_SOCIALS = [
  { label: "LinkedIn", href: SOCIALS.linkedin, track: "nav-linkedin" },
  { label: "X", href: SOCIALS.x, track: "nav-x" },
  { label: "Instagram", href: SOCIALS.instagram, track: "nav-instagram" },
] as const;

export const NAV_LEGAL_LINKS = [
  { label: "Privacy Policy", href: LINKS.privacy, track: "nav-privacy" },
  { label: "Terms & Conditions", href: LINKS.terms, track: "nav-terms" },
] as const;

export const NAV_COPYRIGHT = "© Loopsii 2026";

export const NAV_PANEL = {
  title: "Start your loop here",
  note: "One account, all your clients, one simple workflow",
} as const;

/** Decorative frame lines / corner dots of the open panel (order matters for the dot stagger). */
export const NAV_PANEL_LINES = [
  "nav_line nav_line-y absolute inset-y-0 left-40 w-px origin-top bg-black/20 s:left-24",
  "nav_line nav_line-y absolute inset-y-0 right-40 w-px origin-top bg-black/20 s:right-24",
  "nav_line nav_line-x absolute inset-x-0 top-40 h-px bg-black/20 s:top-24",
  "nav_line nav_line-x absolute inset-x-0 bottom-40 h-px bg-black/20 s:bottom-24",
] as const;

export const NAV_PANEL_DOTS = [
  "nav_dot absolute left-36 top-36 size-8 bg-black s:left-21 s:top-21 s:size-6",
  "nav_dot absolute right-36 top-36 size-8 bg-black s:right-21 s:top-21 s:size-6",
  "nav_dot absolute bottom-36 left-36 size-8 bg-black s:bottom-21 s:left-21 s:size-6",
  "nav_dot absolute bottom-36 right-36 size-8 bg-black s:bottom-21 s:right-21 s:size-6",
] as const;

/** Scroll thresholds / timings mirrored from the original `Nav` + `NavMorph` modules. */
export const NAV_MOTION = {
  /** `Nav`: bar turns "mini" past this scrollY … */
  miniEnter: 100,
  /** … and back to full size below this one (hysteresis). */
  miniLeave: 60,
  /** Mini bar padding, in `px * bodyFontSize / 16`. */
  miniPad: 4,
  /** Mini button padding factor. */
  miniButton: 0.7,
  /** `NavMorph`: nav shrinks to the compact pill after this many px of scroll. */
  compactAt: 150,
  /** Fallback ScrollTrigger start for the footer morph. */
  openStart: "top 55%",
} as const;
