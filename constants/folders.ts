/** Data for the "Go back to doing the work" folders tile. */

export const FOLDERS_COPY = {
  title: "Go back to doing the work",
  text: "Loopsii handles the rest. Set it up once, stop rebuilding your process for every new client.",
  label: "Project",
} as const;

export type FolderAsset = "folder-196" | "folder-204" | "folder-205" | "folder-206" | "folder-207" | "folder-208" | "folder-209";

/** Whether each folder artwork is mirrored horizontally. */
export const FOLDER_FLIP: Record<FolderAsset, boolean> = {
  "folder-204": true,
  "folder-205": false,
  "folder-206": true,
  "folder-207": true,
  "folder-208": false,
  "folder-209": true,
  "folder-196": false,
};

/** Tab columns (label x in tile units) and the artworks whose tab sits there. */
export const FOLDER_COLUMNS: readonly { x: number; assets: readonly FolderAsset[] }[] = [
  { x: 728, assets: ["folder-204", "folder-207"] },
  { x: 410, assets: ["folder-205", "folder-208"] },
  { x: 101, assets: ["folder-206", "folder-209", "folder-196"] },
];

export const FOLDERS_MOTION = {
  /** Vertical distance between two folders (tile units). */
  step: 88,
  /** `--top` of slot 0. */
  firstTop: -240,
  /** Folders rendered up front; spares fill the slots below. */
  initial: 12,
  spares: 8,
  /** Every third move slides a full page of folders. */
  bigSlide: 8,
  hold: 1.4,
  /** How far folders below the pointer drop on hover. */
  hoverDrop: 70,
} as const;

export interface FolderItem {
  asset: FolderAsset;
  /** Label x (tile units); omitted for the top folders whose tab is off-tile. */
  labelX?: number;
}

/** The 12 authored folders followed by the 8 spares the original script appended on load. */
export const FOLDER_ITEMS: readonly FolderItem[] = [
  { asset: "folder-207" },
  { asset: "folder-208" },
  { asset: "folder-209" },
  { asset: "folder-204", labelX: 728 },
  { asset: "folder-205", labelX: 410 },
  { asset: "folder-206", labelX: 101 },
  { asset: "folder-207", labelX: 728 },
  { asset: "folder-208", labelX: 410 },
  { asset: "folder-209", labelX: 101 },
  { asset: "folder-204", labelX: 728 },
  { asset: "folder-205", labelX: 410 },
  { asset: "folder-196", labelX: 101 },
  // spares
  { asset: "folder-204", labelX: 728 },
  { asset: "folder-205", labelX: 410 },
  { asset: "folder-206", labelX: 101 },
  { asset: "folder-207", labelX: 728 },
  { asset: "folder-208", labelX: 410 },
  { asset: "folder-209", labelX: 101 },
  { asset: "folder-204", labelX: 728 },
  { asset: "folder-205", labelX: 410 },
];
