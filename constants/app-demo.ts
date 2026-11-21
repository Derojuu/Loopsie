import {
  CheckmarkSquare02Icon,
  DashboardSquare02Icon,
  File01Icon,
  FileAddIcon,
  FolderAddIcon,
  Home01Icon,
  PlayIcon,
  TaskAdd01Icon,
  Timer02Icon,
  UserAdd01Icon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons";

/** Sample workspace data for the desktop app demo (mirrors the Svelte demo's seed, frozen at Nov 20, 2026). */

export const ADM_USER = { first: "Maya", initials: "MO" } as const;

export const ADM_GREETING = ["Golden", "hour,", ADM_USER.first] as const;

/** Sidebar rooms, in order. `home` is the active room. */
export const ADM_NAV = [
  { key: "home", label: "Home", icon: Home01Icon },
  { key: "activity", label: "Activity", icon: Timer02Icon },
  { key: "tasks", label: "Tasks", icon: CheckmarkSquare02Icon },
  { key: "projects", label: "Projects", icon: DashboardSquare02Icon },
  { key: "clients", label: "Clients", icon: UserMultipleIcon },
  { key: "recordings", label: "Recordings", icon: PlayIcon },
  { key: "documents", label: "Documents", icon: File01Icon },
] as const;

/** Projects in the tracker picker (`accent` = dot colour, `bg` = chip background). */
export const ADM_PROJECTS = [
  { id: "p-northwind", name: "Northwind design system", accent: "#d2c3ff", bg: "#e9e3ff" },
  { id: "p-harbor", name: "Harbor & Vale booking site", accent: "#fff08f", bg: "#f9fad0" },
  { id: "p-pixelbrew", name: "Pixelbrew brand refresh", accent: "#abeaff", bg: "#d0f1fc" },
  { id: "p-larkspur", name: "Larkspur patient app", accent: "#beff8f", bg: "#dfffcd" },
  { id: "p-ottoline", name: "Ottoline Books store", accent: "#ffc1c1", bg: "#ffe0e0" },
] as const;

export type AdmProjectId = (typeof ADM_PROJECTS)[number]["id"];

export const admProject = (id: AdmProjectId | null) => ADM_PROJECTS.find((p) => p.id === id) ?? null;

/** Items of the topbar "New" menu (`door` = toast shown instead of opening the real flow). */
export const ADM_NEW_MENU = [
  { type: "document", label: "New Document", icon: FileAddIcon, door: "Creating documents works in the app." },
  { type: "client", label: "New Client", icon: UserAdd01Icon, door: "Creating clients works in the app." },
  { type: "project", label: "New Project", icon: FolderAddIcon, door: "Creating projects works in the app." },
  { type: "task", label: "New Task", icon: TaskAdd01Icon, door: "Creating tasks works in the app." },
] as const;

export const ADM_UPCOMING = {
  day: 26,
  month: "Nov",
  weekday: "Thu",
  items: [
    { title: "Component workshop with Northwind", time: "10:00 – 11:00", color: "rgb(210,195,255)" },
    { title: "Weekly sync with Harbor & Vale", time: "15:30 – 16:00", color: "rgb(255,240,143)" },
  ],
} as const;

export const ADM_WEEKDAYS = [
  { short: "M", abbr: "Mon" },
  { short: "T", abbr: "Tue" },
  { short: "W", abbr: "Wed" },
  { short: "T", abbr: "Thu" },
  { short: "F", abbr: "Fri" },
  { short: "S", abbr: "Sat" },
  { short: "S", abbr: "Sun" },
] as const;

export type AdmDayTone = "bg-gray-4" | "bg-gray-8" | "bg-gray-11" | "bg-ink";

/** Activity for Nov 1–20, 2026 (`summary` is the accessible description of the day). */
export const ADM_ACTIVITY: readonly { tone: AdmDayTone; summary: string }[] = [
  { tone: "bg-gray-4", summary: "no activity" },
  { tone: "bg-gray-11", summary: "2h 31m tracked, 2 tasks created, 2 tasks completed" },
  { tone: "bg-gray-11", summary: "1h 24m tracked, 2 tasks created, 3 tasks completed" },
  { tone: "bg-ink", summary: "3h 0m tracked, 3 tasks created, 3 tasks completed" },
  { tone: "bg-ink", summary: "1h 15m tracked, 3 tasks created, 4 tasks completed" },
  { tone: "bg-gray-8", summary: "2h 45m tracked, 1 task created, 1 task completed" },
  { tone: "bg-gray-4", summary: "no activity" },
  { tone: "bg-gray-4", summary: "no activity" },
  { tone: "bg-gray-11", summary: "2h 0m tracked, 2 tasks created, 3 tasks completed" },
  { tone: "bg-ink", summary: "1h 35m tracked, 3 tasks created, 3 tasks completed" },
  { tone: "bg-ink", summary: "2h 30m tracked, 3 tasks created, 4 tasks completed" },
  { tone: "bg-gray-8", summary: "1h 30m tracked, 1 task created, 1 task completed" },
  { tone: "bg-gray-11", summary: "2h 0m tracked, 1 task created, 2 tasks completed" },
  { tone: "bg-gray-4", summary: "no activity" },
  { tone: "bg-gray-8", summary: "1 screen recording · 6m" },
  { tone: "bg-gray-8", summary: "5h 30m tracked" },
  { tone: "bg-gray-11", summary: "4h 30m tracked, 1 meeting · 23m, 1 screen recording · 2m" },
  { tone: "bg-gray-8", summary: "4h 0m tracked" },
  { tone: "bg-gray-11", summary: "3h 30m tracked, 1 meeting · 31m, 1 screen recording · 4m" },
  { tone: "bg-gray-8", summary: "1h 40m tracked, 1 meeting · 38m" },
];

/** Month shown in the activity grid. */
export const ADM_MONTH = { year: 2026, monthIndex: 10, label: "Nov", days: 30, today: 20 } as const;

export const ADM_TOTAL_ACTIVITIES = 73;

export type AdmRecording =
  | {
      kind: "meeting";
      title: string;
      date: string;
      duration: string;
      projectId: AdmProjectId;
      waveform: readonly number[];
    }
  | { kind: "screen"; title: string; date: string; duration: string; projectId: AdmProjectId; thumb: "booking" | "logos" };

export const ADM_RECORDINGS: readonly AdmRecording[] = [
  {
    kind: "meeting",
    title: "Design system kickoff with Northwind",
    date: "Nov 20, 2026 · 21:20 – 21:58",
    duration: "38 min",
    projectId: "p-northwind",
    waveform: [6, 13, 16, 6, 13, 16, 6, 13, 16, 9, 10, 13, 6, 16, 7, 10, 4, 16, 10, 9, 16, 10, 9, 13],
  },
  {
    kind: "screen",
    title: "Booking flow walkthrough",
    date: "Nov 19, 2026 · 16:10",
    duration: "4 min",
    projectId: "p-harbor",
    thumb: "booking",
  },
  {
    kind: "meeting",
    title: "Weekly sync with Harbor & Vale",
    date: "Nov 19, 2026 · 15:30 – 16:01",
    duration: "31 min",
    projectId: "p-harbor",
    waveform: [7, 12, 16, 13, 9, 4, 16, 12, 4, 13, 9, 4, 16, 12, 9, 7, 13, 16, 6, 16, 13, 6, 9, 13],
  },
  {
    kind: "screen",
    title: "Logo options, round two",
    date: "Nov 17, 2026 · 12:40",
    duration: "2 min",
    projectId: "p-pixelbrew",
    thumb: "logos",
  },
];

export const ADM_NOTICE = {
  title: "Recording notes ready",
  subtitle: "Design system kickoff with Northwind",
} as const;

/** "Ask Loopsii" launcher tuning (CSS custom properties from the original component). */
export const ADM_ASK_LABEL = "Ask Loopsii";

export const ADM_ASK_VARS = {
  "--ring-a": "#aac2aa",
  "--ring-b": "#bce6fa",
  "--ring-c": "#f3bd77",
  "--ring-d": "#c4f041",
  "--ring-width": "1px",
  "--ring-glow": "4.5px",
  "--ring-glow-opacity": "0.35",
  "--ring-spin": "4s",
  "--ring-flow": "20s",
  "--glow-width": "101%",
  "--glow-height": "18px",
  "--glow-drop": "4px",
  "--glow-blur": "13px",
  "--glow-opacity": "0.45",
  "--glow-hover": "0.3",
  "--hover-fill": "0.03",
  "--hover-light": "0.1",
  "--hover-glow": "8px",
  "--hover-glow-alpha": "0.4",
  "--label-in": "560ms",
  "--label-out": "360ms",
  "--label-ease":
    "linear(0,0.0138,0.0499,0.1014,0.1629,0.2301,0.2997,0.3692,0.437,0.5015,0.5621,0.6181,0.6693,0.7156,0.7572,0.7941,0.8266,0.8551,0.8798,0.9011,0.9194,0.935,0.9481,0.9591,0.9683,0.9759,0.9821,0.9871,0.9911,0.9943,0.9968,0.9988,1.0002,1.0013,1.002,1.0025,1.0028,1.0029,1.003,1.0029,1)",
  "--text-delay": "80ms",
  "--text-in": "420ms",
  "--text-stagger": "22ms",
  "--text-rise": "4px",
  "--text-blur": "2.5px",
} as const;

/** Toast lifetime (ms), from the original `toast()` helper. */
export const ADM_TOAST_MS = 2800;

/** Max tilt in degrees (`--adm-tilt`) when no value is set in CSS. */
export const ADM_TILT_FALLBACK = 2;
