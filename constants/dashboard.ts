/** Data for the mobile/tablet "dashboard" collage. Positions are in a 1920 x 1080 design space. */

/** Intrinsic sizes of `/public/dashboard/*.svg` (needed by next/image). */
export const DASH_ASSETS = {
  "check-off-2": [22, 22],
  "check-off": [22, 22],
  "check-on": [22, 22],
  "glyph-awaiting": [17.4222, 17.4222],
  "glyph-folder": [56, 56],
  "glyph-overdue": [17.4222, 17.4222],
  "glyph-paid": [17.4222, 17.4222],
  "glyph-upload-2": [56, 56],
  "glyph-upload": [56, 56],
  "icon-blocks": [19.2, 19.2],
  "icon-chevrons-left": [24, 24],
  "icon-clock": [11, 11],
  "icon-home": [19.2, 19.2],
  "icon-play": [19.2, 19.2],
  "icon-plus": [16, 16],
  "icon-search": [19.2, 19.2],
  "icon-timer": [19.2, 19.2],
  "icon-users": [19.2, 19.2],
  "invoice-paper": [211, 291],
  "label-loop": [11.2094, 12],
  "logo-mark": [1249, 393],
  "play-glyph": [13.1079, 15.8333],
  "tab-divider": [505, 1],
  "tab-underline": [45, 2],
  "timer-circle": [34.0613, 40.5006],
} as const;

export type DashAsset = keyof typeof DASH_ASSETS;

export const DASH_STAGE = { width: 1920, height: 1080 } as const;

/** Grid cell size (design px) of the backdrop grid. */
export const DASH_GRID_GAP = 44;

export const DASH_NAV_ICONS = ["icon-home", "icon-timer", "icon-blocks", "icon-users", "icon-play"] as const satisfies readonly DashAsset[];

export const DASH_CARD_POSITIONS = {
  scope: { x: 207, y: 174, z: 60 },
  feedback: { x: 513, y: 93, z: 80 },
  money: { x: 1304, y: 133, z: 60 },
  closing: { x: 486, y: 862, z: 100 },
  deal: { x: 1685, y: 370, z: 90 },
  communication: { x: 99, y: 616, z: 70 },
  kickoff: { x: 1172, y: 616, z: 70 },
  balance: { x: 804, y: 490, z: 110 },
  cta: { x: 818, y: 1030, z: 120 },
} as const;

export const DASH_SCOPE_FIELDS = [
  { label: "What", value: "Add a dark theme across all screens" },
  { label: "Why", value: "Client requested after design review" },
  { label: "When", value: "Jul 2, 2026", swatch: true },
] as const;

export const DASH_FEEDBACK = [
  { title: "Client left 2 comments on Homepage v2", meta: "awaiting your reply", dot: "bg-[#f6d0c7]", needsInput: true },
  { title: "New file uploaded to Kickoff checklist", meta: "2h ago", dot: "bg-[#e2f298]", needsInput: false },
  { title: "Kestrel approved the timeline", meta: "5h ago", dot: "bg-[#e2f298]", needsInput: false },
] as const;

export const DASH_MONEY_TILES = [
  { label: "Paid", glyph: "glyph-paid", bg: "bg-[#e2f298]", value: "$3,200", meta: "8 invoices" },
  { label: "Awaiting", glyph: "glyph-awaiting", bg: "bg-[#d0e5f2]", value: "$1,850", meta: "3 pending" },
  { label: "Overdue", glyph: "glyph-overdue", bg: "bg-[#f6d0c7]", value: "$980", meta: "2 overdue" },
] as const satisfies readonly { label: string; glyph: DashAsset; bg: string; value: string; meta: string }[];

export const DASH_INVOICES = [
  { client: "Kestrel Studio", number: "#INV-0428", color: "bg-[#f6d0c7]", pill: false },
  { client: "Nova Labs", number: "#INV-0431", color: "bg-[#e2f298]", pill: true },
  { client: "Orbit Agency", number: "#INV-0433", color: "bg-[#e2f298]", pill: true },
] as const;

export const DASH_CLOSING_BARS = [
  { label: "Hours", value: 54 },
  { label: "Money", value: 76 },
] as const;

export const DASH_INVOICE_LINES = [
  ["Homepage redesign", "$1,200"],
  ["Pricing page", "$180"],
  ["Dark theme add-on", "$180"],
] as const;

export const DASH_COMM_TABS = ["Recap", "Activity", "Transcript"] as const;

export const DASH_KICKOFF = [
  { title: "Brand guidelines", done: true, check: "check-on", glyph: "glyph-folder" },
  { title: "Logo files (SVG + PNG)", done: false, check: "check-off", glyph: "glyph-upload" },
  { title: "Website copy", done: false, check: "check-off-2", glyph: "glyph-upload-2" },
  { title: "CMS / hosting access", done: true, check: "check-on", glyph: "glyph-folder" },
] as const satisfies readonly { title: string; done: boolean; check: DashAsset; glyph: DashAsset }[];

export const DASH_BALANCE = [
  { week: "W1", value: 95 },
  { week: "W2", value: 67 },
  { week: "W3", value: 100 },
  { week: "W4", value: 50 },
  { week: "W5", value: 33 },
] as const;

/** Backdrop-grid line style (from the original shader uniforms). */
export const DASH_GRID_STYLE = { color: "255,110,110", alpha: 0.15 } as const;

/** Mouse-tilt settings (degrees) and easing used by the original `initTilt`. */
export const DASH_TILT = { max: 8, duration: 1.2 } as const;
