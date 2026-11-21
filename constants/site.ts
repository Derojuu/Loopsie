export const SITE_URL = "https://loopsii.com";

export const SITE_NAME = "Loopsii";

export const SITE_TITLE = "Loopsii: the all-in-one app for freelancers";

export const SITE_DESCRIPTION =
  "Loopsii is the all-in-one app for freelancers: CRM, project management, time tracking, AI notes from client calls and dictation. 14-day free trial, no card needed.";

export const OG_IMAGE = { url: "/og.jpg", width: 1800, height: 945 } as const;

export const THEME_COLOR = "#f0f0f0";

/** External destinations used by CTAs, nav and footer links. */
export const LINKS = {
  home: "https://loopsii.com/",
  signUp: "https://app.loopsii.com/sign-up",
  connect: "https://loopsii.com/connect",
  privacy: "https://loopsii.com/privacy",
  terms: "https://loopsii.com/terms",
} as const;

export const SOCIALS = {
  linkedin: "https://www.linkedin.com/company/loopsii/",
  x: "https://x.com/loopsiiapp",
  instagram: "https://www.instagram.com/loopsii.app/",
  tiktok: "https://www.tiktok.com/@loopsii.app",
} as const;

/** Section anchors used by the navigation. */
export const SECTION_IDS = {
  why: "why-loopsii",
  features: "features",
  testimonials: "testimonials",
  pricing: "pricing",
  faq: "faq",
} as const;
