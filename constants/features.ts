/** Feature phases and cards for the "What's included" section (`#features`). */

export type FeatureIconId =
  | "deposit-invoice"
  | "reusable"
  | "agreements"
  | "client-portal"
  | "todays-plate"
  | "meetings-hub"
  | "ai-meeting"
  | "time-tracking"
  | "gantt"
  | "dictation"
  | "qa-change-log"
  | "retro-notes"
  | "final-invoice"
  | "deliverables"
  | "follow-ups"
  | "pipeline"
  | "earnings-forecast"
  | "capacity-check";

export type FeatureCardColor = "sky" | "steel" | "coral" | "main" | "lime-light" | "sage" | "apricot";

export interface FeatureCardData {
  title: string;
  /** Hand-written label (e.g. "Up next") that swaps out for the description on hover. */
  note?: string;
  description: string;
  /** Tailwind background colour token (`bg-<color>`). */
  color: FeatureCardColor;
  icon: FeatureIconId;
  /** Icon width in design pixels (scaled by `--spacing` and `--icon-scale`). */
  iconWidth: number;
}

export interface FeatureGroupData {
  id: string;
  phase: string;
  /** Heading lines; desktop breaks between them. */
  title: readonly [string, string];
  track: string;
  cards: readonly FeatureCardData[];
}

export const FEATURES_INTRO = {
  note: "What's included",
  heading: "Everything you need, at every project stage.",
} as const;

/** Index of the phase that starts expanded on mobile. */
export const FEATURES_INITIAL_OPEN = 0;

export const FEATURE_GROUPS: readonly FeatureGroupData[] = [
  {
    id: "negotiation",
    phase: "Negotiation",
    title: ["Turn a conversation", "into a project"],
    track: "features-negotiation",
    cards: [
      {
        title: "Clients & projects",
        description: "Every client and project, organized by stage.",
        color: "sky",
        icon: "deposit-invoice",
        iconWidth: 322,
      },
      {
        title: "Proposal builder",
        description: "Proposals with line-item estimates, built from templates.",
        color: "steel",
        icon: "reusable",
        iconWidth: 152,
      },
      {
        title: "Agreements",
        description: "Contracts clients sign in the browser, with an audit trail.",
        color: "coral",
        icon: "agreements",
        iconWidth: 230,
      },
      {
        title: "Client portal",
        note: "Up next",
        description: "One place where clients follow progress and approve work.",
        color: "main",
        icon: "client-portal",
        iconWidth: 251,
      },
    ],
  },
  {
    id: "working",
    phase: "Working",
    title: ["Keep every", "project moving"],
    track: "features-working",
    cards: [
      {
        title: "Screen recordings",
        description: "Loom-style recordings with a link, transcript and summary.",
        color: "lime-light",
        icon: "todays-plate",
        iconWidth: 251,
      },
      {
        title: "Ask Loopsii",
        description: "Answers from every call, doc and project.",
        color: "steel",
        icon: "meetings-hub",
        iconWidth: 224,
      },
      {
        title: "AI Meeting Assistant",
        description: "Records any call, no bot. Then notes and suggested tasks.",
        color: "sage",
        icon: "ai-meeting",
        iconWidth: 159,
      },
      {
        title: "Time tracking",
        description: "Timer and timesheets, tied to projects and tasks.",
        color: "sky",
        icon: "time-tracking",
        iconWidth: 146,
      },
      {
        title: "Gantt timeline & milestones",
        description: "Visual schedule sized for solo work, not 50-person teams.",
        color: "coral",
        icon: "gantt",
        iconWidth: 315,
      },
      {
        title: "Dictation",
        description: "Hold fn, talk, and clean text appears in any app on your Mac.",
        color: "main",
        icon: "dictation",
        iconWidth: 150,
      },
      {
        title: "Change requests",
        note: "Up next",
        description: "Every extra request logged, scoped and billable.",
        color: "apricot",
        icon: "qa-change-log",
        iconWidth: 259,
      },
    ],
  },
  {
    id: "closure",
    phase: "Closure",
    title: ["Wrap up, deliver,", "and get paid"],
    track: "features-closure",
    cards: [
      {
        title: "Time reports",
        description: "Summary and detailed reports, exported to PDF or CSV.",
        color: "coral",
        icon: "retro-notes",
        iconWidth: 245,
      },
      {
        title: "Invoices",
        description: "Invoices from tracked time, exported as PDF.",
        color: "steel",
        icon: "final-invoice",
        iconWidth: 151,
      },
      {
        title: "Deliverables page",
        note: "Up next",
        description: "Final files with versions, shared in the client portal.",
        color: "sage",
        icon: "deliverables",
        iconWidth: 189,
      },
    ],
  },
  {
    id: "planning",
    phase: "Planning",
    title: ["Know what's", "coming next"],
    track: "features-planning",
    cards: [
      {
        title: "Pre-meeting briefs",
        description: "A recap of past calls and open tasks before each meeting.",
        color: "steel",
        icon: "follow-ups",
        iconWidth: 142,
      },
      {
        title: "Pipeline",
        note: "Up next",
        description: "Deals by stage, with the odds of closing.",
        color: "main",
        icon: "pipeline",
        iconWidth: 152,
      },
      {
        title: "Income goals",
        note: "Up next",
        description: "Paid, awaiting and pipeline income against a monthly goal.",
        color: "coral",
        icon: "earnings-forecast",
        iconWidth: 120,
      },
      {
        title: "Capacity check",
        note: "Up next",
        description: "Hours booked against hours available, week by week.",
        color: "sky",
        icon: "capacity-check",
        iconWidth: 296,
      },
    ],
  },
] as const;
