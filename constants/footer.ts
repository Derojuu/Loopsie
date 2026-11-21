/** Packed colour + depth video rendered as a dot-matrix through the global canvas. */
export const FOOTER_VIDEO = "/video/footer-dual.mp4";

/** Footer shader parameters, mirrored from the original `footer` GL module. */
export const FOOTER_PARAMS = {
  cellSize: 8,
  bgColor: "#b1d3fe",
  bgDot1: "#9fc0f2",
  bgDot2: "#c9dcff",
  figureColor: "#ffc2aa",
  cellColor: "#aac2aa",
  crossColor: "#ffffff",
  depthHi: 0.49,
  depthLo: 0.22,
  lumaDark: 0.53,
  jitter: 0.26,
  scale: 1,
  offsetY: 0.5,
  dotSize: 0.35,
  armW: 0.07,
  pad: 0.16,
  animSpeed: 0,
  fluidStrength: 0.6,
  fluidSwell: 0.12,
  pulseStrength: 1,
  pulseDecay: 0.92,
  pulseScramble: 14,
  typeSplats: 6,
  typeRadius: 58,
  typeForce: 500,
  revealJitter: 0.61,
  revealSpan: 1,
} as const;

/** Mouse-driven fluid simulation feeding the footer's "energy" texture (desktop only). */
export const FLUID_PARAMS = {
  simRes: 128,
  dyeRes: 256,
  iterations: 3,
  densityDissipation: 0.95,
  velocityDissipation: 0.95,
  pressureDissipation: 0.8,
  curlStrength: 14,
  radius: 0.35,
  splatForce: 950,
  /** Stop simulating after this long without input (ms). */
  idleMs: 2500,
} as const;

/** Canvas pixel-ratio caps from the original `Sizes` / `GL` modules. */
export const CANVAS_DPR = { max: 1.5, mobileMax: 1.5 } as const;
