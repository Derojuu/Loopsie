import type { FaqItemData } from "@/constants/faq";
import { cn } from "@/utils/cn";

interface FaqItemProps {
  item: FaqItemData;
  open: boolean;
  onToggle: () => void;
}

/** One question row: question + plus/close toggle, collapsible answer region. */
export function FaqItem({ item, open, onToggle }: FaqItemProps) {
  const answerId = `faq-${item.id}-answer`;

  return (
    <div id={`faq-${item.id}`} className={cn("faq_item border-b border-black/20 py-24 l:py-20", open && "is-open")}>
      <div className="faq_aside relative pr-60 s:pr-56" data-track={`faq-${item.id}`} onClick={onToggle}>
        <h3 className="h3 faq_question">{item.question}</h3>
        <button
          type="button"
          className="faq_toggle absolute top-0 right-0 size-36 s:size-28"
          aria-expanded={open}
          aria-controls={answerId}
          aria-label={item.question}
        />
      </div>
      <div className="faq_body" id={answerId} role="region" aria-label={item.question} inert={!open}>
        <div className="faq_body-inner">
          <p className="faq_answer max-w-720 pt-16 pr-60 l:pr-0">
            {item.answer.map((part, i) =>
              typeof part === "string" ? (
                part
              ) : (
                <a key={i} href={part.href} data-track={part.track}>
                  {part.text}
                </a>
              ),
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
