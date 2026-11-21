/** Testimonials carousel content (order matches the original page). */

export interface Testimonial {
  readonly name: string;
  readonly role: string;
  readonly title: string;
  readonly quote: string;
  readonly image: string;
}

export const TESTIMONIALS_HEADING = "Heard from the early ones.";

export const TESTIMONIALS = [
  {
    name: "Isabel Moranta",
    role: "Design director",
    title: "Organized and on track.",
    quote:
      "As a creative working on multiple projects at once, Loopsii has been super helpful for keeping everything organized and on track. It’s intuitive, easy to use, and makes managing the day-to-day so much easier. Love having everything in one place. Definitely recommend giving it a try.",
    image: "/testimonials/isabel.webp",
  },
  {
    name: "Marina Matijaca",
    role: "Creative director",
    title: "For the money I’m paying… it’s a steal.",
    quote:
      "I send clients a Loopsii recording instead of another call, and they leave comments right on it. I tell Claude to tell Loopsii what to do, my favorite kind of admin. All for less than one coffee in SF. I checked, mine was $12.75.",
    image: "/testimonials/marina.webp",
  },
  {
    name: "Andres Vlaeminck",
    role: "AI developer",
    title: "This one stays.",
    quote:
      "I didn’t expect to get attached to a project tool. My hours turn into invoices, my tasks sit next to the code I write in Cursor, and admin now takes about 10 minutes a week. More time for actual work.",
    image: "/testimonials/andres.webp",
  },
  {
    name: "Nika Korobchuk",
    role: "Product designer",
    title: "No more 2-hour calls.",
    quote:
      "Kudos to Loopsii for how easy it is to make an invoice. I send mine at the end of the month and it takes a couple of minutes. And screen recordings help so much with communication, so nobody has to sit through 2-hour calls.",
    image: "/testimonials/nika.webp",
  },
  {
    name: "Anna Sakharnatska",
    role: "Product manager",
    title: "One tab instead of twenty.",
    quote:
      "I work with several teams at once, each with its own workspace, task board and tools, so I used to juggle a million tabs. With Loopsii it’s all in one place. My favorite part is the meeting assistant. The notes are super accurate, and I can literally listen back to the moment a task came up in the call.",
    image: "/testimonials/anna.webp",
  },
] as const satisfies readonly Testimonial[];

/** The track renders the set this many times so the infinite loop never shows a gap. */
export const TESTIMONIALS_LOOP_COPIES = 2;

/** Autoplay delay in ms (original `p = 5e3`). */
export const TESTIMONIALS_AUTOPLAY_MS = 5000;

/** Nav arrow sweep layers, in hover order (after the base layer). */
export const TESTIMONIALS_ARROW_SWEEP = ["bg-sage", "bg-sky", "bg-apricot", "bg-black"] as const;

/** Arrow glyph morph targets (same art as the CTA button arrow). */
export const TESTIMONIALS_ARROW_PATHS = {
  default: "M6.82353 2.1L-0.00146866 8.946L1.57353 10.521L8.41953 3.654V9.24H10.5195V0H1.27953V2.1H6.82353Z",
  top: "M10.167 0.3537L10.167 0.3467L10.174 0.3467L10.174 0.3537L10.167 0.3537Z",
  bottom: "M1.0195 9.4854L1.0244 9.4805L1.0293 9.4854L1.0244 9.4903L1.0195 9.4854Z",
} as const;

/** Outline path at the design size, replaced by a measured one at runtime. */
export const TESTIMONIALS_OUTLINE_FALLBACK =
  "M127.61 0.50L386.67 0.50A12.83 12.83 0 0 1 399.50 13.33L399.50 267.93A12.83 12.83 0 0 1 386.67 280.76L386.67 281.76A12.83 12.83 0 0 1 399.50 294.59L399.50 343.59A12.83 12.83 0 0 1 386.67 356.43L13.33 356.43A12.83 12.83 0 0 1 0.50 343.59L0.50 127.61A12.83 12.83 0 0 1 13.33 114.78L114.78 114.78L114.78 13.33A12.83 12.83 0 0 1 127.61 0.50Z";
