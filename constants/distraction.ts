/** Copy and tuning for the "Too many things pulling you away" section. */

export const DISTRACTION_TITLE = "Too many things pulling you away";
export const DISTRACTION_SUBTITLE = "from the work that actually matters";

/** Pill tags that pop in between the parentheses. */
export const DISTRACTION_TAGS = [
  "Forgot to start the timer",
  "Where's that file?",
  "How long was that call?",
  "Did I send that invoice?",
  "What changed last round?",
  "Following up. Again.",
  "Is this profitable?",
  "\"Just one more change\"",
  "Where's that client task?",
  "Chasing feedback",
  "Did I log those hours?",
] as const;

/** Tag the pop-in stagger radiates from (falls back to the centre). */
export const DISTRACTION_STAGGER_FROM = "Just one more change";

/** Background photo drawn (blurred + shaded) on the canvas. */
export const DISTRACTION_PHOTO = "/images/cover.png";

/** Photo treatment mirrored from the original WebGL pass (`Be` defaults). */
export const DISTRACTION_PHOTO_PARAMS = {
  /** Gaussian sigma in px for a 1920px-wide source. */
  blur: 35.5,
  zoom: 1,
  /** RGB multiplier. */
  shade: 0.41,
  /** Focus point in UV space (y up). */
  x: 0.495,
  y: 0.529,
  /** Render resolution relative to CSS pixels. */
  dpr: 0.5,
} as const;

/** Minimum tag scale used by `fitTags` on desktop. */
export const DISTRACTION_MIN_TAG_SCALE = 0.6;
/** Padding around the nav band used for the colour inversion triggers. */
export const DISTRACTION_NAV_PAD = 40;
