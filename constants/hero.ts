/** Hero ("One app for your …") content + motion tokens, mirrored from the original markup and `home` module. */

/** Rotating words after "One app for your". Split into chars at render time. */
export const HERO_TITLES = [
  "invoices",
  "time tracking",
  "client calls",
  "proposals",
  "QA rounds",
  "recordings",
  "contracts",
  "follow-ups",
  "clients",
  "deliverables",
  "projects",
] as const;

export const HERO_SR_TITLE = "Loopsii, the all-in-one app for freelancers";

export const HERO_SUBTITLE =
  "The all-in-one app for freelancers. Like a personal manager, it keeps your clients, calls, tasks and hours connected.";

/** Colours a freshly entering title flashes before settling to black. */
export const HERO_TITLE_COLORS = ["#c4f041", "#fa8e66", "#9ec3d5", "#aac2aa"] as const;

/** Title rotation timings (seconds) and cadence (every Nth shapes step). */
export const HERO_TITLE_MOTION = {
  durationEnter: 0.6,
  durationLeave: 0.3,
  stagger: 0.02,
  enterDelay: 0.2,
  everySteps: 3,
} as const;

/** SVG paths (viewBox 0 0 100 100) for every shape a hero cell can morph into. */
export const HERO_SHAPES = {
  square: "M0,0 H100 V100 H0 Z",
  scoopBr: "M0,0 H100 V50 C72.39,50 50,72.39 50,100 H0 Z",
  scoopBl: "M0,0 H100 V100 H50 C50,72.39 27.61,50 0,50 Z",
  scoopTr: "M0,0 H50 C50,27.61 72.39,50 100,50 V100 H0 Z",
  scoopTl: "M50,0 H100 V100 H0 V50 C27.61,50 50,27.61 50,0 Z",
  circle:
    "M50,0 C77.61,0 100,22.39 100,50 C100,77.61 77.61,100 50,100 C22.39,100 0,77.61 0,50 C0,22.39 22.39,0 50,0 Z",
  diamond: "M50,0 L100,50 L50,100 L0,50 Z",
  triTl: "M0,0 H100 L0,100 Z",
  triTr: "M0,0 H100 V100 Z",
  triBr: "M100,0 V100 H0 Z",
  triBl: "M0,0 V100 H100 Z",
  arch: "M0,100 V50 C0,22.39 22.39,0 50,0 C77.61,0 100,22.39 100,50 V100 Z",
  leaf: "M100,0 C44.77,0 0,44.77 0,100 C55.23,100 100,55.23 100,0 Z",
  quarter: "M0,0 H100 V44.7 C100,75.25 75.25,100 44.7,100 H0 Z",
} as const;

export type HeroShape = keyof typeof HERO_SHAPES;

export const HERO_SHAPE_NAMES = Object.keys(HERO_SHAPES) as HeroShape[];

/** Weighted odds used when a cell picks its next shape. */
export const HERO_SHAPE_WEIGHTS: Record<HeroShape, number> = {
  square: 8,
  circle: 2,
  scoopBr: 1,
  scoopBl: 1,
  scoopTr: 1,
  scoopTl: 1,
  diamond: 1,
  triTl: 1,
  triTr: 1,
  triBr: 1,
  triBl: 1,
  arch: 1,
  leaf: 1,
  quarter: 1,
};

export type HeroColor = "main" | "lime-light" | "coral" | "apricot" | "sky" | "steel" | "sage";

export interface HeroCell {
  row: number;
  col: number;
  shape: HeroShape;
  color: HeroColor;
  /** Off-frame cells only revealed when the frame opens up on scroll. */
  filler?: boolean;
}

/** The 21-column × 3-row shape grid (DOM order matters for the shuffle). */
export const HERO_CELLS: readonly HeroCell[] = [
  { row: 1, col: 6, shape: "square", color: "sky" },
  { row: 1, col: 7, shape: "square", color: "sage" },
  { row: 1, col: 8, shape: "triBr", color: "coral" },
  { row: 1, col: 10, shape: "square", color: "main" },
  { row: 1, col: 11, shape: "square", color: "sage" },
  { row: 1, col: 12, shape: "square", color: "main" },
  { row: 1, col: 13, shape: "diamond", color: "coral" },
  { row: 1, col: 14, shape: "square", color: "apricot" },
  { row: 2, col: 7, shape: "circle", color: "main" },
  { row: 2, col: 8, shape: "square", color: "apricot" },
  { row: 2, col: 9, shape: "triTl", color: "coral" },
  { row: 2, col: 10, shape: "square", color: "sky" },
  { row: 2, col: 12, shape: "square", color: "sky" },
  { row: 2, col: 13, shape: "quarter", color: "sage" },
  { row: 2, col: 14, shape: "quarter", color: "sage" },
  { row: 2, col: 15, shape: "square", color: "main" },
  { row: 3, col: 6, shape: "square", color: "sage" },
  { row: 3, col: 7, shape: "square", color: "lime-light" },
  { row: 3, col: 9, shape: "square", color: "sage" },
  { row: 3, col: 10, shape: "square", color: "coral" },
  { row: 3, col: 11, shape: "arch", color: "sage" },
  { row: 3, col: 12, shape: "square", color: "lime-light" },
  { row: 3, col: 13, shape: "square", color: "sky" },
  { row: 3, col: 14, shape: "square", color: "main" },
  { row: 3, col: 16, shape: "square", color: "lime-light" },
  { row: 1, col: 1, shape: "square", color: "main", filler: true },
  { row: 2, col: 1, shape: "leaf", color: "main", filler: true },
  { row: 3, col: 1, shape: "triTr", color: "coral", filler: true },
  { row: 1, col: 2, shape: "square", color: "lime-light", filler: true },
  { row: 2, col: 2, shape: "square", color: "coral", filler: true },
  { row: 3, col: 2, shape: "triBl", color: "main", filler: true },
  { row: 1, col: 3, shape: "square", color: "steel", filler: true },
  { row: 2, col: 3, shape: "leaf", color: "lime-light", filler: true },
  { row: 3, col: 3, shape: "circle", color: "sky", filler: true },
  { row: 2, col: 4, shape: "diamond", color: "sky", filler: true },
  { row: 3, col: 4, shape: "triBl", color: "lime-light", filler: true },
  { row: 1, col: 5, shape: "scoopTl", color: "steel", filler: true },
  { row: 2, col: 5, shape: "scoopTl", color: "lime-light", filler: true },
  { row: 3, col: 5, shape: "diamond", color: "sky", filler: true },
  { row: 1, col: 17, shape: "square", color: "main", filler: true },
  { row: 2, col: 17, shape: "square", color: "lime-light", filler: true },
  { row: 3, col: 17, shape: "diamond", color: "lime-light", filler: true },
  { row: 2, col: 19, shape: "scoopBl", color: "main", filler: true },
  { row: 3, col: 19, shape: "scoopBr", color: "steel", filler: true },
  { row: 1, col: 20, shape: "circle", color: "lime-light", filler: true },
  { row: 2, col: 20, shape: "quarter", color: "apricot", filler: true },
  { row: 3, col: 20, shape: "square", color: "sage", filler: true },
  { row: 1, col: 21, shape: "square", color: "apricot", filler: true },
  { row: 2, col: 21, shape: "square", color: "lime-light", filler: true },
];

export const HERO_GRID_COLS = 21;

/** Fixed (non-moving) cell where the Loopsii mark sits — the intro logo starts here. */
export const HERO_LOOP_CELL = { row: 2, col: 11 } as const;

/** Shuffle / breathe parameters of the shapes timeline. */
export const HERO_SHAPES_MOTION = {
  forwardSteps: 3,
  hRun: 1,
  vRun: 2,
  verticalBias: 5,
  antiBacktrack: true,
  breatheCycles: 4,
  stepDuration: 0.5,
  stepHold: 0.2,
  compactHold: 0.8,
  stepStagger: 0,
  shapeChangesPerStep: 2,
  spotlightRadius: 100,
  spotlightScale: 0.72,
} as const;

/** Desktop fit constants (rows, min cell ratio, reserved gaps in rem-px). */
export const HERO_FIT = { rows: 3, minCellRatio: 0.4, gap: 80, slack: 240 } as const;

export interface HeroLabel {
  text: string;
  className: string;
  textClassName: string;
}

/** Corner labels pinned to the shapes frame. */
export const HERO_LABELS: readonly HeroLabel[] = [
  {
    text: "Edits",
    className: "-left-[0.5px] -top-[0.5px] -translate-x-1/2 -translate-y-1/2",
    textClassName: "bottom-12 right-12 l:right-auto l:left-12",
  },
  {
    text: "Time management",
    className: "-right-[0.5px] -top-[0.5px] translate-x-1/2 -translate-y-1/2",
    textClassName: "bottom-12 left-12 text-nowrap l:left-auto l:right-12",
  },
  {
    text: "Communication",
    className: "-right-[0.5px] -bottom-[0.5px] translate-x-1/2 translate-y-1/2",
    textClassName: "top-12 left-12 l:left-auto l:right-12",
  },
  {
    text: "Invoices",
    className: "-left-[0.5px] -bottom-[0.5px] -translate-x-1/2 translate-y-1/2",
    textClassName: "top-12 right-12 l:right-auto l:left-12",
  },
];

/** WebGL background grid + fluid trail parameters (`grid` / `fluid` modules). */
export const HERO_GRID_GL = {
  cellSize: 34,
  thickness: 1,
  thicknessBoost: 0.5,
  color: "#FF6E6E",
  colorHot: "#FF6E6E",
  baseAlpha: 0.15,
  hotAlpha: 0.4,
  maxDpr: 1.5,
} as const;

export const HERO_FLUID = {
  simRes: 128,
  dyeRes: 256,
  iterations: 3,
  densityDissipation: 0.95,
  velocityDissipation: 0.95,
  pressureDissipation: 0.8,
  curlStrength: 14,
  radius: 0.35,
  splatForce: 950,
  idleMs: 2500,
} as const;
