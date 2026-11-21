import { Button } from "@/components/ui/Button";
import { WAITLIST_CONTENT } from "@/constants/waitlist";
import { WaitlistCounter } from "@/components/sections/waitlist/WaitlistCounter";
import { WaitlistClock } from "@/components/sections/waitlist/WaitlistClock";

interface WaitlistProps {
  /** Optional JSON endpoint (`{ count }`) for the live user count. */
  countEndpoint?: string;
}

/** Closing sign-up CTA next to the live user count and the shape-sweeping clock. */
export function Waitlist({ countEndpoint }: WaitlistProps) {
  return (
    <section className="waitlist relative z-2 py-section s:py-80" aria-labelledby="waitlist-title">
      <div className="container max-w-none px-cont">
        <div className="flex items-stretch gap-20 l:flex-col-reverse l:gap-10">
          <div className="flex flex-1 flex-col items-start justify-between gap-60 rounded-20 bg-white p-30 l:flex-row l:items-center l:rounded-30 s:flex-col s:items-start s:gap-20">
            <h2 id="waitlist-title" className="h3 waitlist_title max-w-491 l:max-w-298 s:max-w-258">
              {WAITLIST_CONTENT.title}
            </h2>
            <Button track={WAITLIST_CONTENT.track} />
          </div>
          <div className="flex aspect-[910/812] w-910 shrink-0 flex-col items-center gap-50 overflow-clip rounded-20 bg-steel p-30 l:w-full l:rounded-30 s:relative s:aspect-auto s:h-435 s:items-start s:p-20">
            <div className="flex w-full items-start gap-20 text-black l:justify-between s:flex-col s:gap-10">
              <WaitlistCounter value={WAITLIST_CONTENT.count} endpoint={countEndpoint} />
              <div className="flex flex-col">
                <p className="h3 waitlist_label">{WAITLIST_CONTENT.label}</p>
                <p className="waitlist_note text-note font-hand">{WAITLIST_CONTENT.note}</p>
              </div>
            </div>
            <WaitlistClock />
          </div>
        </div>
      </div>
    </section>
  );
}
