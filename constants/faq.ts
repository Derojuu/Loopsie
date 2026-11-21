import { LINKS } from "@/constants/site";

/** Plain text, or an inline link inside an answer. */
export type FaqAnswerPart = string | { text: string; href: string; track: string };

export interface FaqItemData {
  /** Slug used for `#faq-<id>`, `data-track` and the answer region id. */
  id: string;
  question: string;
  answer: readonly FaqAnswerPart[];
}

export const FAQ_INTRO = {
  note: "FAQ",
  heading: "Good questions, straight answers.",
} as const;

/** Index of the question that starts expanded. */
export const FAQ_INITIAL_OPEN = 0;

export const FAQ_ITEMS: readonly FaqItemData[] = [
  {
    id: "bot",
    question: "Does Loopsii add a bot to my client calls?",
    answer: [
      "No. Loopsii for Mac records on your Mac, so your client sees just you. No mystery guest called “Notetaker” in the corner.",
    ],
  },
  {
    id: "mac",
    question: "Do I need a Mac to use Loopsii?",
    answer: [
      "Only for call and screen recordings, and for dictation in other apps. Loopsii for Mac works on Apple silicon with macOS 14.4 or later, and screencasts need macOS 15. Everything else runs in any browser. There’s no Windows or iOS app today. Both are Up next on the roadmap, with no dates.",
    ],
  },
  {
    id: "price",
    question: "How much does Loopsii cost?",
    answer: [
      "$12 a month, or $120 a year to save 17%. One plan with everything in it, so there are no tiers to decode. Try Loopsii free for 14 days, no card needed.",
    ],
  },
  {
    id: "recordings",
    question: "What happens to my call recordings and transcripts?",
    answer: [
      "Transcription runs on your Mac. The transcript syncs to your account, so Loopsii can write your notes. By default, the audio and a video of the call upload too. You can turn either off in the settings of Loopsii for Mac. Chat messages from Google Meet and Zoom calls are saved to the meeting in your account, even with both uploads off. Turn off “Save the in-call chat” to stop that. Your meeting content never trains third-party AI models.",
    ],
  },
  {
    id: "ai",
    question: "Can I use Loopsii with Claude or ChatGPT?",
    answer: [
      "Yes, and with Codex, Cursor or any other MCP client, through ",
      { text: "the Loopsii connector", href: LINKS.connect, track: "faq-ai-link" },
      ". Ask them what you agreed on last Tuesday’s call instead of scrolling through the transcript. They can read, add and edit your clients, projects, tasks and hours, but never delete anything.",
    ],
  },
  {
    id: "dictation",
    question: "Can I dictate instead of typing?",
    answer: [
      "Yes. In Loopsii for Mac, hold fn, speak and let go. Clean, punctuated text lands wherever your cursor is, in any app, with filler words like “um” left out. Press fn twice to keep talking hands-free. In the browser, the mic in Ask Loopsii does the same.",
    ],
  },
  {
    id: "studios",
    question: "Can my studio use Loopsii?",
    answer: [
      "Not as a team yet. Loopsii is built for freelancers, one person today. Teams may come later. Until then, your studio of one is very welcome.",
    ],
  },
];

/** Answer flattened to plain text (for structured data). */
export const faqAnswerText = (item: FaqItemData): string =>
  item.answer.map((part) => (typeof part === "string" ? part : part.text)).join("");

/** FAQPage JSON-LD built from the same data as the visible list. */
export const FAQ_STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: faqAnswerText(item) },
  })),
} as const;
