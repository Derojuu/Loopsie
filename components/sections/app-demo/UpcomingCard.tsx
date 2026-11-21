"use client";

import type { CSSProperties } from "react";
import { ADM_UPCOMING } from "@/constants/app-demo";
import { ScrollFade } from "@/components/sections/app-demo/ScrollFade";
import { useWorkspace } from "@/components/sections/app-demo/workspace-context";

/** "Upcoming meetings" home card. */
export function UpcomingCard() {
  const { door } = useWorkspace();

  return (
    <div
      data-adm-enter="card"
      className="app:flex app:h-220 app:min-w-0 app:flex-col app:gap-20 app:overflow-hidden app:rounded-2xl app:border app:border-hairline app:bg-surface app:px-20 app:py-16 app:md:order-3 app:md:col-span-2 app:xl:order-none app:xl:col-span-1"
    >
      <p className="app:text-note app:text-label-secondary">Upcoming meetings</p>
      <ScrollFade
        paint="rgb(255,255,255)"
        className="app:-mr-20 app:-mb-16 app:-ml-6 app:flex app:min-h-0 app:flex-1 app:flex-col app:gap-12 app:overflow-y-auto app:pr-20 app:pb-16 app:pl-6"
      >
        <div className="app:flex app:items-start app:gap-24 app:xl:gap-40">
          <div className="app:flex app:shrink-0 app:items-center app:gap-8">
            <span className="app:w-44 app:text-display app:font-semibold app:text-label-primary">{ADM_UPCOMING.day}</span>
            <span className="app:flex app:w-56 app:flex-col app:gap-2 app:text-micro app:whitespace-nowrap">
              <span className="app:font-medium app:text-label-primary">{ADM_UPCOMING.month}</span>
              <span className="app:text-label-tertiary">{ADM_UPCOMING.weekday}</span>
            </span>
          </div>
          <div className="app:flex app:min-w-0 app:flex-1 app:flex-col app:justify-center app:gap-12">
            {ADM_UPCOMING.items.map((item) => (
              <div key={item.title} className="app:flex app:items-center app:gap-12">
                <button
                  type="button"
                  data-track="demo-home-upcoming-open"
                  className="adm-hover-tint app:-mx-6 app:flex app:min-w-0 app:flex-1 app:cursor-pointer app:items-center app:gap-12 app:rounded-lg app:px-6 app:py-2 app:text-left"
                  style={{ "--adm-tint": "var(--app-color-surface-secondary)" } as CSSProperties}
                  onClick={() => door("Calendar events work in the app.")}
                >
                  <span className="app:h-37 app:w-4 app:shrink-0 app:rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="app:flex app:min-w-0 app:flex-col app:gap-3">
                    <span className="app:line-clamp-2 app:text-note app:font-medium app:text-label-primary">{item.title}</span>
                    <span className="app:text-micro app:text-label-tertiary">{item.time}</span>
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </ScrollFade>
    </div>
  );
}
