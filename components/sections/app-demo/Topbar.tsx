"use client";

import { FileImportIcon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/utils/cn";
import { ADM_NEW_MENU } from "@/constants/app-demo";
import { AdmIcon } from "@/components/sections/app-demo/AdmIcon";
import { TimerBlob } from "@/components/sections/app-demo/AdmArt";
import { ADM_MENU_ROW, usePopover } from "@/components/sections/app-demo/usePopover";
import { formatClock, useWorkspace } from "@/components/sections/app-demo/workspace-context";

/** Card header: breadcrumbs, global timer and the "New" menu. */
export function Topbar() {
  const { timer, elapsed, toggleTimer, door } = useWorkspace();
  const { open: menuOpen, setOpen: setMenuOpen, triggerRef: menuTrigger, panelRef: menuPanel } = usePopover<HTMLButtonElement, HTMLDivElement>();
  const running = timer.running;

  const pick = (text: string) => {
    setMenuOpen(false);
    door(text);
  };

  return (
    <header className="topbar app:relative app:flex app:shrink-0 app:items-center app:justify-between app:gap-12 app:px-32 app:py-16 app:max-sm:px-16">
      <div className="app:flex app:min-w-0 app:items-center app:gap-8">
        <nav aria-label="Breadcrumb" className="crumbs app:grid app:min-w-0 app:text-note" data-adm-enter="bar">
          <div className="crumb-row app:flex app:min-w-0 app:items-center app:gap-6">
            <span className="app:text-foreground">Home</span>
          </div>
        </nav>
      </div>
      <div className="app:flex app:shrink-0 app:items-center app:gap-12">
        <button
          type="button"
          data-adm-enter="bar"
          className="timer-button app:flex app:items-center"
          title={running ? "Stop timer" : "Start timer"}
          data-track={running ? "demo-topbar-timer-stop" : "demo-topbar-timer-start"}
          onClick={(e) => e.detail > 1 || toggleTimer()}
        >
          <span className="app:relative app:-mr-1 app:h-34 app:w-34 app:shrink-0">
            <TimerBlob running={running} />
          </span>
          <span
            className={cn(
              "app:flex app:h-34 app:items-center app:justify-center app:rounded-full app:bg-lime app:px-16 app:text-note app:font-medium app:text-label-button",
              running ? "app:w-103" : "app:max-sm:hidden",
            )}
          >
            {running ? <span className="app:tabular-nums">{formatClock(elapsed)}</span> : "Start Timer"}
          </span>
        </button>
        <div className="app:relative" data-adm-enter="bar">
          <button
            ref={menuTrigger}
            type="button"
            className="new-button app:flex app:h-34 app:items-center app:gap-6 app:rounded-full app:border app:border-hairline app:px-16 app:text-note app:font-medium app:text-label-secondary"
            data-track="demo-topbar-new"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <AdmIcon icon={PlusSignIcon} />
            <span className="app:hidden app:sm:inline">New</span>
          </button>
          {menuOpen && (
            <div
              ref={menuPanel}
              role="menu"
              tabIndex={-1}
              className="app:rounded-2xl app:border app:border-hairline app:bg-surface app:shadow-[0_4px_12px_rgba(0,0,0,0.08)] app:p-8 app:absolute app:right-0 app:z-50 app:mt-4 app:w-176"
            >
              {ADM_NEW_MENU.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  role="menuitem"
                  data-track={`demo-topbar-new-${item.type}`}
                  className={ADM_MENU_ROW}
                  onClick={() => pick(item.door)}
                >
                  <AdmIcon icon={item.icon} className="app:text-gray-9" /> {item.label}
                </button>
              ))}
              <div role="separator" className="app:m-8 app:h-px app:bg-hairline" />
              <button
                type="button"
                role="menuitem"
                data-track="demo-topbar-new-import"
                className={ADM_MENU_ROW}
                onClick={() => pick("Importing works in the app.")}
              >
                <AdmIcon icon={FileImportIcon} className="app:text-gray-9" /> Import
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
