import { FAQ_INTRO, FAQ_STRUCTURED_DATA } from "@/constants/faq";
import { SECTION_IDS } from "@/constants/site";
import { FaqList } from "@/components/sections/faq/FaqList";

/** "Good questions, straight answers." — two-column FAQ accordion with FAQPage JSON-LD. */
export function Faq() {
  return (
    <section id={SECTION_IDS.faq} className="faq relative z-2 py-section">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_STRUCTURED_DATA).replace(/</g, "\\u003c") }}
      />
      <div className="container max-w-none px-cont">
        <div className="grid grid-cols-2 gap-20 l:flex l:flex-col l:gap-0">
          <div className="faq_intro flex flex-col gap-16 pc:sticky pc:self-start l:mb-100 s:mb-50 s:gap-20">
            <p className="faq_note text-note font-hand">{FAQ_INTRO.note}</p>
            <h2 className="h2 faq_heading max-w-560 s:max-w-329">{FAQ_INTRO.heading}</h2>
          </div>
          <FaqList />
        </div>
      </div>
    </section>
  );
}
