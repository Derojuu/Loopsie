import { Fragment } from "react";
import { cn } from "@/utils/cn";
import { HERO_SR_TITLE, HERO_TITLES } from "@/constants/hero";

/** Visual "One app for your <rotating word>" headline (chars generated from {@link HERO_TITLES}). */
export function HeroTitle() {
  return (
    <>
      <h1 className="sr-only">{HERO_SR_TITLE}</h1>
      <div className="col-span-8 flex flex-col h1 l:col-span-12" aria-hidden="true">
        <div className="hero_split">One app for</div>
        <div className="flex flex-row">
          <div className="pr-[0.2em]">your</div>
          <div className="hero_titles relative">
            {HERO_TITLES.map((title, titleIndex) => (
              <div key={title} className="hero_title">
                {title.split(" ").map((word, wordIndex) => (
                  <Fragment key={wordIndex}>
                    {wordIndex > 0 ? " " : null}
                    {[...word].map((char, charIndex) => (
                      <div
                        key={charIndex}
                        className={cn("hero_title-char relative inline-block", titleIndex > 0 && "invisible opacity-0")}
                      >
                        {char}
                      </div>
                    ))}
                  </Fragment>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
