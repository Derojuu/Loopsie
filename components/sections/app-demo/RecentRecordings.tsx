"use client";

import { MoreVerticalIcon } from "@hugeicons/core-free-icons";
import { ADM_RECORDINGS, admProject, type AdmRecording } from "@/constants/app-demo";
import { AdmIcon } from "@/components/sections/app-demo/AdmIcon";
import { ThumbBooking, ThumbLogos } from "@/components/sections/app-demo/AdmArt";
import { useWorkspace } from "@/components/sections/app-demo/workspace-context";

function Cover({ item }: { item: AdmRecording }) {
  if (item.kind === "meeting") {
    return (
      <div className="app:@container app:flex app:aspect-video app:w-full app:flex-col app:justify-between app:rounded-xl app:border app:border-alpha-black-10 app:bg-poster app:px-15 app:pb-15 app:pt-9">
        <p className="app:line-clamp-3 app:text-[7.4cqw] app:leading-1.2 app:text-poster-ink">{item.title}</p>
        <div className="app:flex app:items-center app:justify-between app:gap-12">
          <span className="app:flex app:h-18 app:w-[59cqw] app:min-w-0 app:items-center app:justify-between">
            {item.waveform.map((h, i) => (
              <span key={i} className="app:w-4 app:shrink-0 app:bg-poster-muted" style={{ height: h }} />
            ))}
          </span>
          <span className="app:shrink-0 app:rounded-[3px] app:bg-poster-muted app:px-8 app:py-4 app:text-[10px] app:font-medium app:leading-12 app:text-poster-muted-ink">
            {item.duration}
          </span>
        </div>
      </div>
    );
  }
  const Thumb = item.thumb === "booking" ? ThumbBooking : ThumbLogos;
  return (
    <div className="app:relative app:aspect-video app:w-full app:overflow-hidden app:rounded-xl app:border app:border-hairline app:bg-gray-4">
      <Thumb />
      <span className="app:absolute app:bottom-16 app:right-15 app:rounded-[3px] app:bg-gray-11 app:px-8 app:py-4 app:text-[10px] app:font-medium app:leading-12 app:text-surface">
        {item.duration}
      </span>
    </div>
  );
}

/** "Recent recordings" strip: meeting posters and screen-recording thumbnails. */
export function RecentRecordings() {
  const { door } = useWorkspace();

  return (
    <section className="app:flex app:flex-col app:gap-24">
      <h3 className="app:text-title-3 app:font-semibold app:text-label-primary">Recent recordings</h3>
      <div className="app:-m-8 app:grid app:grid-rows-[auto] app:auto-rows-[0px] app:grid-cols-[repeat(auto-fit,minmax(296px,1fr))] app:gap-x-4 app:gap-y-0 app:overflow-hidden">
        {ADM_RECORDINGS.map((item) => {
          const project = admProject(item.projectId);
          const open = () =>
            door(
              item.kind === "meeting"
                ? "Opening this meeting works in the app."
                : "Playing screen recordings works in the app.",
            );
          return (
            <div
              key={item.title}
              data-adm-enter="recording"
              className="adm-hover-card app:group app:flex app:flex-col app:gap-12 app:rounded-[20px] app:p-8"
            >
              <div className="app:relative">
                <button
                  type="button"
                  tabIndex={-1}
                  aria-hidden="true"
                  className="app:block app:w-full app:text-left"
                  data-track="demo-home-recording-cover"
                  onClick={open}
                >
                  <Cover item={item} />
                </button>
              </div>
              <div className="app:flex app:items-start app:justify-between app:gap-8">
                <div className="app:flex app:min-w-0 app:flex-col app:gap-4">
                  {project && (
                    <button
                      type="button"
                      data-track="demo-home-recording-project"
                      className="app:flex app:w-fit app:max-w-full app:items-center app:rounded-full app:font-medium app:h-22 app:text-micro app:px-10 app:text-label-primary app:cursor-pointer app:transition-opacity app:hover:opacity-80"
                      style={{ backgroundColor: project.bg }}
                      onClick={() => door("Choosing a project works in the app.")}
                    >
                      <span className="app:truncate">{project.name}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="app:flex app:min-w-0 app:flex-col app:gap-4 app:text-left"
                    data-track="demo-home-recording-open"
                    onClick={open}
                  >
                    <span className="app:truncate app:text-body app:font-semibold app:text-label-secondary">{item.title}</span>
                    <span className="app:flex app:items-center app:gap-6 app:text-micro app:text-label-tertiary">
                      <span className="app:truncate">{item.date}</span>
                    </span>
                  </button>
                </div>
                <div className="app:relative app:shrink-0">
                  <button
                    type="button"
                    aria-label="Recording actions"
                    className="app:block app:cursor-pointer app:rounded-md app:p-4 app:text-label-primary app:transition-colors app:hover:bg-hover"
                    data-track="demo-home-recording-menu"
                    onClick={() => door("Renaming and deleting recordings works in the app.")}
                  >
                    <AdmIcon icon={MoreVerticalIcon} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
