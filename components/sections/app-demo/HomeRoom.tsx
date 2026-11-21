import { Fragment } from "react";
import { ADM_GREETING } from "@/constants/app-demo";
import { Tracker } from "@/components/sections/app-demo/Tracker";
import { UpcomingCard } from "@/components/sections/app-demo/UpcomingCard";
import { ActivityCard } from "@/components/sections/app-demo/ActivityCard";
import { RecentRecordings } from "@/components/sections/app-demo/RecentRecordings";

/** The demo's "Home" room: greeting, three cards and recent recordings. */
export function HomeRoom() {
  return (
    <div className="app:mx-auto app:flex app:min-h-full app:w-full app:max-w-1400 app:flex-col app:gap-32">
      <section className="app:flex app:flex-col app:items-center">
        <h3 className="app:text-center app:text-display app:font-semibold app:text-label-primary">
          {ADM_GREETING.map((word, i) => (
            <Fragment key={word}>
              {i > 0 && " "}
              <span className="mask">
                <span className="word" data-adm-enter="word">
                  {word}
                </span>
              </span>
            </Fragment>
          ))}
        </h3>
      </section>
      <div className="app:grid app:gap-24 app:md:grid-cols-[301fr_356fr] app:xl:grid-cols-[301fr_450fr_356fr]">
        <Tracker />
        <UpcomingCard />
        <ActivityCard />
      </div>
      <RecentRecordings />
    </div>
  );
}
