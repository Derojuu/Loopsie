/** Data for the "Your workflow shouldn't cost this much" (why-loopsii) section. */

export const STACK_NOTE = "the copy-paste tax";
export const STACK_TITLE = "Your workflow shouldn’t cost this much";

export interface StackApp {
  /** Matches `data-app` and the link ids. */
  id: string;
  role: string;
  /** Swatch colour class. */
  swatch: string;
  /** Grid placement classes (verbatim from the source). */
  place: string;
  /** Rotating pool of [brand, yearly price]; the first entry is shown initially. */
  brands: readonly (readonly [string, number])[];
}

export const STACK_APPS: readonly StackApp[] = [
  {
    id: "notion",
    role: "Docs & task lists",
    swatch: "bg-sage",
    place: "col-start-1 row-start-1",
    brands: [
      ["Notion", 120],
      ["ClickUp", 84],
      ["Asana", 132],
      ["Trello", 60],
    ],
  },
  {
    id: "loom",
    role: "Screen recordings",
    swatch: "bg-steel",
    place: "col-start-3 row-start-1 s:col-start-2",
    brands: [
      ["Loom", 180],
      ["Tella", 156],
      ["Claap", 384],
    ],
  },
  {
    id: "bonsai",
    role: "Invoices & contracts",
    swatch: "bg-main",
    place: "col-start-2 row-start-2 s:col-start-1",
    brands: [
      ["Bonsai", 228],
      ["HoneyBook", 348],
      ["FreshBooks", 248],
      ["Dubsado", 335],
    ],
  },
  {
    id: "toggl",
    role: "Time tracking",
    swatch: "bg-coral",
    place: "col-start-4 row-start-2 s:col-start-2",
    brands: [
      ["Toggl Track", 108],
      ["Harvest", 108],
      ["Clockify", 48],
    ],
  },
  {
    id: "granola",
    role: "AI meeting notes",
    swatch: "bg-apricot",
    place: "col-start-3 row-start-3 s:col-start-1",
    brands: [
      ["Granola", 168],
      ["Otter", 100],
      ["Fireflies", 120],
      ["tl;dv", 216],
    ],
  },
  {
    id: "wispr",
    role: "Voice dictation",
    swatch: "bg-sky",
    place: "col-start-1 row-start-3 s:col-start-2",
    brands: [
      ["Wispr Flow", 144],
      ["Superwhisper", 85],
      ["Aqua Voice", 120],
      ["Willow", 144],
    ],
  },
] as const;

export interface StackLink {
  id: string;
  /** Curve + arrow-head paths in the 400×300 `stack_links` viewBox. */
  curve: string;
  head: string;
  note: readonly [string, string];
  /** Placement classes for the hand-written note. */
  noteClass: string;
}

export const STACK_LINKS: readonly StackLink[] = [
  {
    id: "loom-toggl",
    curve: "M299 62C327 62 350 79 350 100",
    head: "M348.1 96.5L350 100L351.9 96.5",
    note: ["pick the client", "& project again"],
    noteClass: "col-start-4 row-start-1 self-start mt-16 ml-18",
  },
  {
    id: "notion-bonsai",
    curve: "M99 62C127 62 150 79 150 100",
    head: "M148.1 96.5L150 100L151.9 96.5",
    note: ["copy the scope", "into the contract"],
    noteClass: "col-start-2 row-start-1 self-start mt-16 ml-18",
  },
  {
    id: "granola-toggl",
    curve: "M299 238C327 238 350 221 350 200",
    head: "M348.1 203.5L350 200L351.9 203.5",
    note: ["log the call", "time by hand"],
    noteClass: "col-start-4 row-start-3 self-end mb-16 ml-18",
  },
  {
    id: "toggl-bonsai",
    curve: "M301 155C272 192 228 192 199 155",
    head: "M199.7 158.9L199 155L202.7 156.6",
    note: ["re-type the hours", "on the invoice"],
    noteClass: "col-start-3 row-start-2 self-start justify-self-center mt-22 text-center",
  },
] as const;

/** Vertical grid line indices (`--i`). */
export const STACK_VLINES = [1, 2, 3, 4, 5, 6, 7] as const;
/** Horizontal grid line indices (`--i`); extra rows only show on smaller grids. */
export const STACK_HLINES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export const STACK_SIDES = [
  {
    lines: ["Your whole stack,", "in one app"],
    className:
      "stack_side col-span-2 col-start-1 row-span-4 row-start-5 mr-24 justify-self-end text-right l:row-span-1 l:row-start-6 l:self-center s:col-span-1 s:mr-12",
  },
  {
    lines: ["Everything on it,", "connected."],
    className:
      "stack_side col-span-2 col-start-7 row-span-4 row-start-5 ml-25 justify-self-start l:col-start-3 l:row-span-1 l:row-start-6 l:self-center s:col-span-1 s:col-start-2 s:ml-12",
  },
] as const;

export const STACK_HUB = "Client project";

/** Orbiting pills around the hub (offsets in grid `--spacing` units). */
export const STACK_NODES = [
  { label: "Call", x: 0, y: -238 },
  { label: "Notes", x: 206.11, y: -119 },
  { label: "Tasks", x: 206.11, y: 119 },
  { label: "Hours", x: 0, y: 238 },
  { label: "Invoice", x: -206.11, y: 119 },
  { label: "Recording", x: -206.11, y: -119 },
] as const;

export const STACK_LOOPSII = {
  name: "Loopsii",
  tagline: "All of the above",
  price: 120,
} as const;

export const STACK_CTA = {
  title: "Move in without leaving anything behind",
  body: "Bring your recordings, meeting notes, docs and hours with you — dates, projects and links intact. Import twice, get no duplicates.",
  button: "Try it free for 14 days",
  track: "stack-signup",
} as const;

/** Timing constants mirrored from the original module. */
export const STACK_MOTION = {
  linkStagger: 0.08,
  rotateEvery: 1.5,
  markFrames: 21,
  orbitStep: 1.2,
  orbitPause: 2.4,
  clipHidden: "inset(-20% 100% -20% 0%)",
  clipShown: "inset(-20% 0% -20% 0%)",
} as const;
