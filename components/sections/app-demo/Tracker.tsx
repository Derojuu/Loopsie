"use client";

import { useState } from "react";
import { ArrowDown01Icon, PlusSignIcon, Tick02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/utils/cn";
import { ADM_PROJECTS, admProject, type AdmProjectId } from "@/constants/app-demo";
import { AdmIcon } from "@/components/sections/app-demo/AdmIcon";
import { ProjectDot, TimerBlob, TrackerBlob } from "@/components/sections/app-demo/AdmArt";
import { ADM_MENU_ROW, usePopover } from "@/components/sections/app-demo/usePopover";
import { formatClock, useWorkspace } from "@/components/sections/app-demo/workspace-context";

function Check({ visible }: { visible: boolean }) {
  return (
    <span className={cn("app:shrink-0 app:text-label-primary", !visible && "app:invisible")}>
      <AdmIcon icon={Tick02Icon} />
    </span>
  );
}

/** "Time tracker" home card: project picker plus a big start/stop timer. */
export function Tracker() {
  const { timer, elapsed, startTimer, stopTimer, door } = useWorkspace();
  const { open: pickerOpen, setOpen: setPickerOpen, triggerRef: pickerTrigger, panelRef: pickerPanel } = usePopover<HTMLButtonElement, HTMLDivElement>();
  const [projectId, setProjectId] = useState<AdmProjectId | null>(null);
  const running = timer.running;
  const label = running ? (admProject(timer.projectId)?.name ?? "No project") : (admProject(projectId)?.name ?? "Project");

  const choose = (id: AdmProjectId | null) => {
    setProjectId(id);
    setPickerOpen(false);
  };

  return (
    <div
      data-adm-enter="card"
      className="tracker app:relative app:flex app:h-220 app:flex-col app:justify-between app:rounded-2xl app:border app:border-hairline app:bg-surface app:px-20 app:py-16"
    >
      <div className="app:pointer-events-none app:absolute app:inset-0 app:overflow-hidden app:rounded-2xl app:will-change-transform">
        <TrackerBlob />
      </div>
      <div className="app:relative app:flex app:items-center app:justify-between">
        <span className="app:text-note app:text-label-secondary">Time tracker</span>
        <div className="app:relative">
          <button
            ref={pickerTrigger}
            type="button"
            className="proj app:flex app:items-center app:gap-4 app:text-note app:text-label-secondary"
            data-track="demo-home-tracker-project"
            aria-haspopup="listbox"
            aria-expanded={pickerOpen}
            onClick={() => setPickerOpen((o) => !o)}
          >
            <span className="app:max-w-120 app:truncate">{label}</span>
            <AdmIcon icon={ArrowDown01Icon} size={14} />
          </button>
          {pickerOpen && (
            <div
              ref={pickerPanel}
              data-popover=""
              tabIndex={-1}
              role="listbox"
              aria-label="Project"
              className="app:rounded-2xl app:border app:border-hairline app:bg-surface app:shadow-[0_4px_12px_rgba(0,0,0,0.08)] app:p-8 app:absolute app:right-0 app:z-20 app:mt-4 app:flex app:max-h-320 app:w-208 app:max-w-[calc(100cqw-64px)] app:flex-col app:overflow-y-auto"
              data-scrollbar=""
            >
              <button
                type="button"
                role="option"
                aria-selected={projectId === null}
                data-track="demo-home-tracker-project-clear"
                className={ADM_MENU_ROW}
                onClick={() => choose(null)}
              >
                <span className="app:block app:w-16 app:shrink-0 app:text-hairline">
                  <ProjectDot />
                </span>
                <span className="app:min-w-0 app:flex-1 app:truncate app:text-note app:text-label-tertiary">No project</span>
                <Check visible={projectId === null} />
              </button>
              {ADM_PROJECTS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="option"
                  aria-selected={projectId === p.id}
                  data-track="demo-home-tracker-project-pick"
                  className={ADM_MENU_ROW}
                  onClick={() => choose(p.id)}
                >
                  <span className="app:block app:w-16 app:shrink-0" style={{ color: p.accent }}>
                    <ProjectDot />
                  </span>
                  <span className="app:min-w-0 app:flex-1 app:truncate app:text-note app:text-label-primary">{p.name}</span>
                  <Check visible={projectId === p.id} />
                </button>
              ))}
              <button
                type="button"
                role="option"
                aria-selected={false}
                data-track="demo-home-tracker-project-new"
                className={ADM_MENU_ROW}
                onClick={() => {
                  setPickerOpen(false);
                  door("Creating projects works in the app.");
                }}
              >
                <span className="app:block app:w-16 app:shrink-0 app:text-label-primary">
                  <AdmIcon icon={PlusSignIcon} />
                </span>
                <span className="app:min-w-0 app:flex-1 app:truncate app:text-note app:text-label-primary">New project</span>
              </button>
            </div>
          )}
        </div>
      </div>
      <button
        type="button"
        className="start app:relative app:flex app:items-center app:self-start"
        title={running ? "Stop timer" : "Start timer"}
        data-track={running ? "demo-home-timer-stop" : "demo-home-timer-start"}
        onClick={(e) => e.detail > 1 || (running ? stopTimer() : startTimer(projectId))}
      >
        <span className="app:relative app:-mr-6 app:h-34 app:w-34 app:shrink-0">
          <TimerBlob running={running} />
        </span>
        <span
          className={cn(
            "app:text-title-3 app:font-semibold app:text-label-primary app:relative app:z-2",
            running && "app:tabular-nums",
          )}
        >
          {running ? formatClock(elapsed) : "Start"}
        </span>
      </button>
    </div>
  );
}
