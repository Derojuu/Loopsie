/** Waitlist section content + the clock physics tuning from the original `Clock` module. */

export const WAITLIST_CONTENT = {
  title: "Ready for an easier way to work?",
  /** Fallback user count (the original fetched `/api/users-count`). */
  count: 159,
  label: "freelancers",
  note: "already using Loopsii",
  track: "waitlist-signup",
} as const;

/** Counter roll-up duration (ms, cubic ease-out). */
export const COUNTER_DURATION = 1400;

/** Shape colours (sky, coral, apricot, main, sage, lime-light). */
export const CLOCK_PALETTE = ["#bce6fa", "#fa8e66", "#f3bd77", "#c4f041", "#aac2aa", "#e0f661"] as const;

/** Shape outlines in a 100×100 box (`hero-shapes` module). */
export const CLOCK_SHAPES = {
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

export type ClockShape = keyof typeof CLOCK_SHAPES;

/** Spawn weights per shape (unlisted = 1). */
export const CLOCK_SHAPE_WEIGHTS: Partial<Record<ClockShape, number>> = { square: 8, circle: 2 };

/** Hand lengths as a fraction of the clock radius (physics), and their CSS heights. */
export const CLOCK_HANDS = {
  hour: { length: 0.55, height: "h-[27%]", width: "w-8", color: "bg-black", rounded: true },
  minute: { length: 0.68, height: "h-[34%]", width: "w-8", color: "bg-black", rounded: true },
  second: { length: 0.86, height: "h-[43%]", width: "w-4", color: "bg-coral", rounded: false },
} as const;

export type ClockHand = keyof typeof CLOCK_HANDS;

export const CLOCK_PARAMS = {
  timeScale: 11,
  count: 84,
  size: 0.07,
  sizeVariance: 0.1,
  drawScale: 1,
  gravity: 2000,
  wind: 0.3,
  sweep: 1.45,
  sweepAll: false,
  relax: 0.7,
  contactDamping: 6,
  contactFriction: 0.5,
  spin: 1.5,
  spinDrag: 3.2,
  spinContactDrag: 7,
  maxSpin: 11,
  sleep: 14,
  drag: 1.5,
  restitution: 0.24,
  friction: 0.23,
  maxSpeed: 1350,
  rim: 0.498,
  handWidth: 1,
  handBand: 0,
  pushLimit: 150,
  fluidForce: 30,
  fluidSplat: 2500,
  fluidRadius: 0.8,
  fluidFade: 0.95,
} as const;

/** Fixed physics step, max sub-steps per frame, and how long pointer input keeps the flow field alive. */
export const CLOCK_STEP = 1 / 240;
export const CLOCK_MAX_STEPS = 8;
export const CLOCK_FLUID_IDLE = 2500;
export const CLOCK_MAX_TEXTURE = 1024;

/** Dial ticks: 60 marks, every 5th is a long/thick hour mark. */
export const CLOCK_TICKS = Array.from({ length: 60 }, (_, i) => {
  const a = (i * Math.PI) / 30;
  const major = i % 5 === 0;
  const inner = major ? 43 : 45.5;
  const r = (v: number) => Math.round(v * 1e4) / 1e4;
  return {
    x1: r(50 + 48 * Math.cos(a)),
    y1: r(50 + 48 * Math.sin(a)),
    x2: r(50 + inner * Math.cos(a)),
    y2: r(50 + inner * Math.sin(a)),
    width: major ? 0.7 : 0.35,
  };
});
