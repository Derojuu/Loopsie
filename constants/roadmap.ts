/** Roadmap section content + tuning mirrored from the original `roadmap` module. */

export const ROADMAP_INTRO = {
  note: "The roadmap",
  heading: "No fake launch dates. Just the actual plan.",
} as const;

export type RoadmapTone = "steel" | "apricot" | "sage" | "coral";

export interface RoadmapCardData {
  /** Number on the right reel (`0N`). */
  num: number;
  tone: RoadmapTone;
  badge: string;
  items: readonly string[];
}

export const ROADMAP_CARDS = [
  {
    num: 1,
    tone: "steel",
    badge: "Live",
    items: [
      "Clients, projects and task boards.",
      "Time tracking, timesheets and reports.",
      "Call and screen recording on Mac. No bot.",
      "AI notes, tasks and search across calls.",
    ],
  },
  {
    num: 2,
    tone: "apricot",
    badge: "Up Next",
    items: ["Income goals and deal pipeline.", "Client portal for approvals and files."],
  },
  {
    num: 3,
    tone: "sage",
    badge: "Up Next",
    items: ["Capacity view across all projects.", "Change requests and scope tracking."],
  },
  {
    num: 4,
    tone: "coral",
    badge: "Up Next",
    items: ["Desktop app for Windows.", "Full web platform in both desktop apps.", "Mobile app for iOS."],
  },
] as const satisfies readonly RoadmapCardData[];

/** Literal class names per tone so Tailwind can see them. */
export const ROADMAP_TONE_CLASSES: Record<RoadmapTone, { bg: string; text: string }> = {
  steel: { bg: "bg-steel", text: "text-steel" },
  apricot: { bg: "bg-apricot", text: "text-apricot" },
  sage: { bg: "bg-sage", text: "text-sage" },
  coral: { bg: "bg-coral", text: "text-coral" },
};

export interface RoadmapRingData {
  variant: "pc" | "l" | "s";
  size: number;
  radius: number;
  /** Arc length (in viewBox units) per degree of wheel rotation. */
  arc: number;
  dash: number;
  /** Initial gradient half-span around the centre (updated at runtime). */
  x1: number;
  x2: number;
}

/** The three dotted rings (desktop / tablet / phone). */
export const ROADMAP_RINGS = [
  { variant: "pc", size: 2700, radius: 1340, arc: 23.3874, dash: 10.9935, x1: 1115, x2: 1585 },
  { variant: "l", size: 1307, radius: 643.5, arc: 11.2312, dash: 10.9977, x1: 652.5, x2: 654.5 },
  { variant: "s", size: 923, radius: 451.5, arc: 7.8802, dash: 11.0206, x1: 460.5, x2: 462.5 },
] as const satisfies readonly RoadmapRingData[];

/** Ring glow tuning (`$` in the original module). */
export const ROADMAP_GLOW = { full: 2, rise: 12, fall: 3, reach: 0.6, tint: 6 } as const;

/** Minimum space (in rem-ish body units) kept under the wheel before the intro is moved out of the pin. */
export const ROADMAP_FIT_MARGIN = 20;

/** Idle-snap tuning shared with the other pinned sections. */
export const ROADMAP_SNAP = { idle: 350, pass: 0.3, time: 1 } as const;

/** Touch devices keep the section height a multiple of the 34px background grid. */
export const ROADMAP_GRID = 34;
