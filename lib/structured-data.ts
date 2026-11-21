import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, SOCIALS } from "@/constants/site";

const ALTERNATE_NAMES = ["Loopsy", "Loopsi", "Loopsie", "Лупсі"];

/** JSON-LD graph mirrored from the original page head. */
export const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    alternateName: ALTERNATE_NAMES,
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/favicon.svg`,
    sameAs: Object.values(SOCIALS),
    description:
      "Loopsii is the all-in-one app for freelancers: CRM, project management, time tracking, AI notes from client calls and dictation. Clients, projects, tasks, time tracking, proposals, agreements and invoices on the web, plus Loopsii for Mac, which records client calls and screencasts with no bot joining.",
  },
  { "@context": "https://schema.org", "@type": "WebSite", name: SITE_NAME, url: `${SITE_URL}/` },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    alternateName: ALTERNATE_NAMES,
    applicationCategory: "BusinessApplication",
    operatingSystem: "macOS 14.4 or later, Web",
    url: `${SITE_URL}/`,
    description: `${SITE_DESCRIPTION.replace(" 14-day free trial, no card needed.", "")} Manage clients and projects through four stages, plan tasks on boards, lists and a Gantt timeline, track time with timesheets and reports, write proposals and agreements that clients sign in the browser, bill tracked time on PDF invoices, and record client calls on your Mac without a bot joining: Loopsii turns them into notes and suggested tasks. Claude, ChatGPT and other AI assistants can work with your workspace through the Loopsii connector.`,
    audience: { "@type": "Audience", audienceType: "Freelance designers and developers" },
    offers: [
      {
        "@type": "Offer",
        name: "Monthly plan",
        description: "14-day free trial, no card required.",
        price: "12",
        priceCurrency: "USD",
        priceSpecification: { "@type": "UnitPriceSpecification", price: "12", priceCurrency: "USD", billingDuration: "P1M" },
      },
      {
        "@type": "Offer",
        name: "Yearly plan",
        description: "14-day free trial, no card required. A 17% discount on monthly billing: $10 a month instead of $12.",
        price: "120",
        priceCurrency: "USD",
        priceSpecification: { "@type": "UnitPriceSpecification", price: "120", priceCurrency: "USD", billingDuration: "P1Y" },
      },
    ],
  },
];
