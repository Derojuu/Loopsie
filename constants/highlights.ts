/** Content + illustration data for the "Everything around your work, handled" stack. */

export type HighlightVisual = "income" | "chapters" | "timeline" | "requests" | "agent" | "dictate";

export interface HighlightCard {
  title: string;
  lead: string;
  points: readonly string[];
  /** Background utility of the illustration panel. */
  media: string;
  visual: HighlightVisual;
}

export const HIGHLIGHTS_TITLE = "Everything around your work, handled";

export const HIGHLIGHT_CARDS: readonly HighlightCard[] = [
  {
    title: "Know where your money stands",
    lead: "See what’s paid, invoiced, and still unbilled, and how close you are to your income goal.",
    points: ["Paid & outstanding income", "Income goals", "Project profitability", "Unbilled work"],
    media: "bg-steel",
    visual: "income",
  },
  {
    title: "Keep clients in the loop",
    lead: "Give clients one place to follow progress, review deliverables, and share feedback.",
    points: ["Project progress", "Deliverables & files", "Feedback & approvals", "Shared project updates"],
    media: "bg-main",
    visual: "chapters",
  },
  {
    title: "Know when you can take on more",
    lead: "See your projects and availability together, so you can spot overlaps and plan ahead.",
    points: ["Project schedules", "Workload & availability", "Timeline overlaps", "Future capacity"],
    media: "bg-coral",
    visual: "timeline",
  },
  {
    title: "Make sure extra work gets counted",
    lead: "Capture change requests as they happen and know what’s included in scope, and what should be billed.",
    points: ["Change requests", "Included vs billable work", "Scope history", "Extra work tracking"],
    media: "bg-sage",
    visual: "requests",
  },
  {
    title: "Put your AI to work",
    lead: "Connect Claude, Codex, or any AI agent to your workspace. Your meetings, tasks, and hours — readable by the tools you already think with.",
    points: ["Meetings & transcripts", "Tasks, time & clients", "MCP server", "CLI for scripts & agents"],
    media: "bg-apricot",
    visual: "agent",
  },
  {
    title: "Talk instead of typing",
    lead: "Hold fn and dictate emails, briefs, and prompts in any app on your Mac, minus the ums and uhs.",
    points: [
      "Works wherever you can type",
      "Your clients’ names, spelled right",
      "Emails laid out like emails",
      "Double-press fn to go hands-free",
    ],
    media: "bg-sky",
    visual: "dictate",
  },
];

/* ------------------------------------------------------------------ */
/* Stack (desktop scroll depth)                                        */
/* ------------------------------------------------------------------ */

export const STACK = {
  /** Distance (px) the title is pinned below the nav. */
  pinOffset: 40,
  /** Fallback `--stack-top` (rem-scaled px) when the cards do not fit. */
  tightTop: 20,
  /** Bottom room (rem-scaled px) the stack keeps in the viewport. */
  bottomRoom: 20,
  /** Minimum `--spacing` multiplier when shrinking the cards to fit. */
  minScale: 0.6,
  shadeStops: [0, 0.075, 0.15, 0.225, 0.3],
  fadeStops: [1, 0.75, 0.55, 0.4, 0.3],
  snap: { idle: 350, pass: 0.3, time: 1 },
} as const;

/* ------------------------------------------------------------------ */
/* 1. Income gauge                                                     */
/* ------------------------------------------------------------------ */

export const INCOME_GOAL = 10000;

export const INCOME_SEGMENTS = [
  { key: "paid", label: "Paid", value: 3800, stroke: "stroke-main", chip: "bg-main" },
  { key: "invoiced", label: "Invoiced", value: 2000, stroke: "stroke-steel", chip: "bg-steel" },
  { key: "unbilled", label: "Unbilled", value: 1300, stroke: "stroke-sky", chip: "bg-sky" },
  { key: "inconv", label: "In conv.", value: 1150, stroke: "stroke-[#d2d2d2]", chip: "bg-[#d2d2d2]" },
] as const;

export type IncomeKey = (typeof INCOME_SEGMENTS)[number]["key"];

/** Keys that count as income (everything but "in conversation"). */
export const INCOME_KEYS = ["paid", "invoiced", "unbilled"] as const;

/** Drift limits as fractions of the goal. */
export const INCOME_LIMITS = {
  income: [0.3, 0.85],
  step: [0.05, 0.15],
  inconv: [0.05, 0.18],
  segmentMin: 0.03,
  gapMin: 0.03,
} as const;

export const GAUGE_ARC = "M 29.6875 237.5 A 207.8125 207.8125 0 0 1 445.3125 237.5";

/* ------------------------------------------------------------------ */
/* 2. Chapters (kanban)                                                */
/* ------------------------------------------------------------------ */

export const PRIORITY_COLORS = {
  Low: "#d9d9d9",
  Normal: "rgba(158,195,213,0.5)",
  Medium: "rgba(158,195,213,0.5)",
  Hight: "rgba(255,110,110,0.5)",
  Urgent: "rgba(255,110,110,0.5)",
  Approved: "rgba(170,194,170,0.6)",
} as const;

export type Priority = keyof typeof PRIORITY_COLORS;

/** Options of the priority dropdown (typo kept from the source). */
export const PRIORITY_OPTIONS = ["Low", "Normal", "Medium", "Hight", "Urgent"] as const;

export interface ChapterCard {
  tag: string;
  tagBg: string;
  /** The card whose tag the client edits through the dropdown. */
  editable?: boolean;
}

export const CHAPTER_COLUMNS: readonly { label: string; bg: string; cards: readonly ChapterCard[] }[] = [
  {
    label: "Not Started",
    bg: "bg-steel",
    cards: [
      { tag: "Urgent", tagBg: "bg-[rgba(255,110,110,0.5)]" },
      { tag: "Low", tagBg: "bg-[#d9d9d9]", editable: true },
    ],
  },
  { label: "In Progress", bg: "bg-coral", cards: [{ tag: "Normal", tagBg: "bg-[rgba(158,195,213,0.5)]" }] },
  {
    label: "Client Approval",
    bg: "bg-main",
    cards: [
      { tag: "Urgent", tagBg: "bg-[rgba(255,110,110,0.5)]" },
      { tag: "Medium", tagBg: "bg-[rgba(158,195,213,0.5)]" },
    ],
  },
  { label: "Done", bg: "bg-sage", cards: [{ tag: "Urgent", tagBg: "bg-[rgba(255,110,110,0.5)]" }] },
];

export const CHAPTERS_MOTION = {
  lift: { borderColor: "#ff6e6e", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", scale: 1.04, rotation: -2 },
  drop: { borderColor: "rgba(255,110,110,0)", boxShadow: "0 4px 12px rgba(0,0,0,0)", scale: 1, rotation: 0 },
  column: { idle: "rgba(0,0,0,0.02)", target: "rgba(0,0,0,0.06)" },
  /** Cursor offsets from the dragged card's origin. */
  youGrip: { x: 110, y: 48 },
  clientGrip: { x: 64, y: 48 },
  drag: { duration: 1.2, arc: 22 },
} as const;

/** Server-rendered positions (unit space) before the animation measures the board. */
export const CHAPTERS_START = {
  card: { x: 185, y: 251 },
  you: { x: 295, y: 299 },
  client: { x: 78, y: 304 },
} as const;

/* ------------------------------------------------------------------ */
/* 3. Timeline                                                          */
/* ------------------------------------------------------------------ */

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

export const TIMELINE = {
  monthWidth: 177.5,
  /** Days the view advances per cycle. */
  stepDays: 15,
  origin: { x: 40, y: 40 },
  /** World x of the "today" line. */
  today: 357,
  hatchEnd: 583,
  lanes: [112, 180, 248],
  youRest: { x: 470, y: 358 },
  youGrip: { x: -8, y: 22 },
  widths: [220, 260, 300, 340],
  names: ["Brand book", "Web app", "Pitch deck", "Onboarding", "Icons v2", "Print kit"],
  colors: ["bg-coral", "bg-apricot", "bg-sky", "bg-main", "bg-steel", "bg-sage"],
  spawnChance: 0.85,
  weights: { active: { weight: 600, color: "#1c1c1a" }, muted: { weight: 400, color: "#6b6b66" } },
  startDate: [2026, 8, 8],
  freeHours: 60,
  canStart: "Sep 8",
  hatch: { x: 399, y: 148, w: 184 },
} as const;

export const TIMELINE_BARS = [
  { label: "Rebrand · Project 001", bg: "bg-main", x: 10, w: 346, lane: 0 },
  { label: "Landing · Project 002", bg: "bg-steel", x: 156, w: 387, lane: 1 },
  { label: "App icons", bg: "bg-sage", x: 74, w: 279, lane: 2 },
] as const;

export const TIMELINE_MONTHS = [
  { label: "Jul", x: 10 },
  { label: "Aug", x: 187.5 },
  { label: "Sep", x: 365, active: true },
  { label: "Oct", x: 542.5 },
  { label: "Nov", x: 720 },
] as const;

/* ------------------------------------------------------------------ */
/* 4. Change requests                                                  */
/* ------------------------------------------------------------------ */

export const REQUEST_SOURCES = {
  chat: { icon: "/highlights/icon-message.svg", color: "bg-sky" },
  figma: { icon: "/highlights/icon-pencil.svg", color: "bg-apricot" },
  call: { icon: "/highlights/icon-mic.svg", color: "bg-lime-light" },
} as const;

export interface ChangeRequest {
  source: keyof typeof REQUEST_SOURCES;
  quote: string;
  meta: string;
  link?: string;
  tag: string;
}

/** Rows rendered on the server. */
export const REQUESTS_INITIAL: readonly ChangeRequest[] = [
  { source: "chat", quote: "Can the logo be a bit bigger?", meta: "via chat · Jul 3", tag: "included" },
  { source: "chat", quote: "One more pass on the homepage?", meta: "via chat · Jul 1", tag: "included" },
  { source: "figma", quote: "Can we add a pricing page?", meta: "comment on Figma · Jul 2", tag: "billable · $180" },
];

/** Rows that keep arriving while the card is on screen. */
export const REQUESTS_FEED: readonly ChangeRequest[] = [
  { source: "chat", quote: "Can the logo be a bit bigger?", meta: "via chat · Jul 3", tag: "included" },
  { source: "call", quote: "Add an FAQ block under pricing", meta: "caught on call · Jul 3 · ", link: "play 04:32", tag: "billable · auto-logged" },
  { source: "figma", quote: "Swap the hero photo for video", meta: "comment on Figma · Jul 4", tag: "billable · $240" },
  { source: "chat", quote: "Typo on the About page", meta: "via chat · Jul 4", tag: "included" },
  { source: "chat", quote: "One more pass on the homepage?", meta: "via chat · Jul 5", tag: "included" },
  { source: "figma", quote: "Can we add a pricing page?", meta: "comment on Figma · Jul 6", tag: "billable · $180" },
  { source: "call", quote: "Also add a dark theme", meta: "caught on call · Jul 6 · ", link: "play 12:04", tag: "billable · auto-logged" },
];

export const REQUESTS_MOTION = {
  rowStep: 93,
  firstY: 52,
  hold: 2.6,
  enter: { rotationX: -55, z: -120, transformOrigin: "50% 100%" },
  leave: { rotationX: 18, transformOrigin: "50% 0%" },
} as const;

/* ------------------------------------------------------------------ */
/* 5. AI agent                                                          */
/* ------------------------------------------------------------------ */

export interface AgentExchange {
  question: string;
  tools: readonly [string, string];
  line: string;
  quote: string | null;
  source: string;
  tag: string;
}

export const AGENT_EXCHANGES: readonly AgentExchange[] = [
  {
    question: "What did we agree with Anna about the pricing page?",
    tools: ["search", "get_meeting"],
    line: "Anna signed off on a three-tier pricing page.",
    quote: "“Let’s add a pricing page — three tiers, no calculator. Keep it to one screen.”",
    source: "Anna · Kickoff call · Jul 2 · play 12:04",
    tag: "from transcript",
  },
  {
    question: "How many hours went into the Rebrand this week?",
    tools: ["list_time_entries", "get_project"],
    line: "14h 20m on Rebrand this week, 9h of it on design.",
    quote: null,
    source: "Timer · Sep 1–5 · 6 sessions",
    tag: "from time log",
  },
  {
    question: "What is still open before the Kestrel handoff?",
    tools: ["list_tasks", "get_project"],
    line: "Two tasks left: final QA pass and handoff docs.",
    quote: "“Handoff docs by Friday, QA once the dark theme lands.”",
    source: "You · Standup note · Sep 4",
    tag: "from tasks",
  },
];

export const AGENT_MOTION = {
  hold: 3.2,
  typeSpeed: 0.028,
  maxShift: 56,
  viewport: 320,
} as const;

/* ------------------------------------------------------------------ */
/* 6. Dictation                                                         */
/* ------------------------------------------------------------------ */

/**
 * `said` grammar: tokens separated by spaces; `raw|clean` (raw = heard,
 * clean = written; empty clean = dropped filler), `+word` = written only,
 * `/` = paragraph gap before next written word, `//` = line break.
 */
export const DICTATE_SCENES = [
  {
    app: "Mail",
    label: "Re: Pricing page",
    color: "bg-steel",
    said: "um| hi|Hi anna|Anna, / the|The pricing page is ready for you to review|review. uh| let|Let me know if anything needs changing|changing. / thanks|Thanks, // stas|Stas",
  },
  {
    app: "Slack",
    label: "#kestrel-handoff",
    color: "bg-coral",
    said: "for|For the handoff we need|need: // number| one| +1. the|The qa|QA pass // number| two| +2. uh| the|The docs // number| three| +3. the|The invoice",
  },
  {
    app: "Claude",
    label: "New chat",
    color: "bg-apricot",
    said: "uh| draft|Draft a change request for the extra landing page mark|Mark asked for|for. um| the|The budget is two| thousand| no| wait| two|$2,500. thousand| five| hundred| dollars|",
  },
  {
    app: "Notion",
    label: "Kestrel launch",
    color: "bg-sage",
    said: "uh| move|Move the castrel|Kestrel launch to friday|Friday the twentieth|20th and let the client know|know.",
  },
] as const;

export const DICTATE_MOTION = {
  wordStep: 0.13,
  tick: 0.08,
  hold: 2.4,
  finishing: [0.1, 0.4, 0.8, 1, 0.8, 0.4, 0.1, 0],
  ink: "28, 28, 26",
  /** Timeline offset the loop starts from. */
  startAt: 0.5,
} as const;
