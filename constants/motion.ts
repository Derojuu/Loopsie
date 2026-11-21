/** Shared motion tokens mirrored from the original site scripts and CSS. */

/** `--smooth` easing from the original stylesheet. */
export const EASE_SMOOTH = "cubic-bezier(.76,0,.24,1)";

/** Expo-out curve used by the original Lenis instance. */
export const easeOutExpo = (t: number): number => (t === 1 ? 1 : 1 - 2 ** (-10 * t));

/** Lenis options mirrored from the original `Scroll` module. */
export const LENIS_OPTIONS = {
  duration: 1.4,
  easing: easeOutExpo,
  orientation: "vertical",
  gestureOrientation: "vertical",
  smoothWheel: true,
  syncTouch: false,
  syncTouchLerp: 0.08,
  wheelMultiplier: 1.6,
} as const;

/** Breakpoints matching the `l:`, `s:` and `pc:` variants. */
export const BREAKPOINTS = {
  tablet: 1023,
  phone: 479,
  desktop: 1024,
} as const;

export const MEDIA = {
  tablet: `(max-width: ${BREAKPOINTS.tablet}px)`,
  phone: `(max-width: ${BREAKPOINTS.phone}px)`,
  desktop: `(min-width: ${BREAKPOINTS.desktop}px)`,
  reducedMotion: "(prefers-reduced-motion: reduce)",
  finePointer: "(hover: hover) and (pointer: fine)",
} as const;
