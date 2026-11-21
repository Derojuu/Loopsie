/** "What is Loopsii" intro content, mirrored from the original markup. */

export const INTRO_LABEL = "What is Loopsii";

export const INTRO_TITLE =
  "Loopsii helps freelance designers and developers manage their entire workflow in one app. There’s less to organize and more time to do the work.";

export const INTRO_NOTE =
  "Every project follows a familiar loop. Loopsii keeps it moving, so you don’t have to think about what comes next.";

export interface IntroOrbitIcon {
  viewBox: string;
  width: number;
  height: number;
  d: string;
  evenOdd?: boolean;
  /** Tailwind width class (fluid spacing units). */
  sizeClass: string;
}

export interface IntroOrbitItem {
  /** Tailwind position/size classes (fluid spacing units, scaled by the logo parent's `--spacing`). */
  className: string;
  /** Tailwind classes for the coloured bubble. */
  shapeClassName: string;
  icon: IntroOrbitIcon;
}

/** Floating feature bubbles orbiting the intro logo. */
export const INTRO_ORBIT_ITEMS: readonly IntroOrbitItem[] = [
  {
    className: "left-69 -top-171 size-133",
    shapeClassName: "rounded-full bg-steel rotate-[-300deg]",
    icon: {
      viewBox: "0 0 13 16",
      width: 13,
      height: 16,
      d: "M0 0H8V5H13V16H0ZM10 0L13 3H10ZM3 8H10V10H3ZM3 12H8V14H3Z",
      evenOdd: true,
      sizeClass: "w-13",
    },
  },
  {
    className: "left-181 -top-77 size-140",
    shapeClassName: "rounded-full bg-lime-light",
    icon: {
      viewBox: "0 0 14 16",
      width: 14,
      height: 16,
      d: "M2 0H12V3H2ZM0 5H14V7L7.75 15.04V10.8A1.5 1.5 0 1 0 6.25 10.8V15.04L0 7Z",
      sizeClass: "w-14",
    },
  },
  {
    className: "left-248 top-62 size-110",
    shapeClassName: "bg-apricot rotate-[-38deg]",
    icon: {
      viewBox: "0 0 16 16",
      width: 16,
      height: 16,
      d: "M0 2H3V0H5V2H11V0H13V2H16V16H0ZM2 7H14V14H2ZM4 9H7V12H4Z",
      evenOdd: true,
      sizeClass: "w-16",
    },
  },
  {
    className: "left-211 top-203 size-110",
    shapeClassName: "bg-sky",
    icon: {
      viewBox: "0 0 16 16",
      width: 16,
      height: 16,
      d: "M0 9.38296C0.70385 13.0935 3.96388 15.8992 7.87916 15.8992C12.3085 15.8992 15.8992 12.3085 15.8992 7.87916C15.8992 3.96388 13.0935 0.70385 9.38296 0V6.87666C9.38296 8.26086 8.26086 9.38296 6.87666 9.38296H0Z",
      sizeClass: "w-16",
    },
  },
  {
    className: "left-60 top-238 size-119",
    shapeClassName: "bg-sage rotate-[-77deg]",
    icon: {
      viewBox: "0 0 12 20",
      width: 12,
      height: 20,
      d: "M0 0L0.0100002 6L4 10L0.0100002 14.01L0 20H12V14L8 10L12 6.01V0H0ZM10 14.5V18H2V14.5L6 10.5L10 14.5Z",
      sizeClass: "w-12",
    },
  },
  {
    className: "-left-102 top-188 size-140",
    shapeClassName: "rounded-full bg-main",
    icon: {
      viewBox: "0 0 16 16",
      width: 16,
      height: 16,
      d: "M8 0A8 8 0 0 1 16 8A8 8 0 0 1 8 16H0V8A8 8 0 0 1 8 0ZM2.75 8A1.25 1.25 0 1 0 5.25 8A1.25 1.25 0 1 0 2.75 8ZM6.75 8A1.25 1.25 0 1 0 9.25 8A1.25 1.25 0 1 0 6.75 8ZM10.75 8A1.25 1.25 0 1 0 13.25 8A1.25 1.25 0 1 0 10.75 8Z",
      evenOdd: true,
      sizeClass: "w-16",
    },
  },
  {
    className: "-left-142 top-43 size-110",
    shapeClassName: "bg-apricot rotate-[-38deg]",
    icon: {
      viewBox: "0 0 16 16",
      width: 16,
      height: 16,
      d: "M9.6 16L16 0L0 6.4L3.73 10.13L12.8 3.2L5.87 12.27Z",
      sizeClass: "w-16",
    },
  },
  {
    className: "-left-65 -top-99 size-110",
    shapeClassName: "bg-sky",
    icon: {
      viewBox: "0 0 16 10",
      width: 16,
      height: 10,
      d: "M0 0H16V10H0ZM5.5 5A2.5 2.5 0 1 0 10.5 5A2.5 2.5 0 1 0 5.5 5ZM2 5A1 1 0 1 0 4 5A1 1 0 1 0 2 5ZM12 5A1 1 0 1 0 14 5A1 1 0 1 0 12 5Z",
      evenOdd: true,
      sizeClass: "w-16",
    },
  },
];

/** Orbit / reveal motion tokens from the `intro` module. */
export const INTRO_MOTION = {
  orbitDuration: 40,
  minOrbitScale: 0.45,
  revealEase: "power4",
  revealStagger: 0.04,
  lineOffset: 0.05,
  noteOffset: 0.15,
  orbitEase: "back(1.7)",
  orbitStagger: 0.05,
} as const;
