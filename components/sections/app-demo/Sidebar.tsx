"use client";

import { Notification01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/utils/cn";
import { ADM_NAV, ADM_USER } from "@/constants/app-demo";
import { AdmIcon } from "@/components/sections/app-demo/AdmIcon";
import { LoopsiiLogo } from "@/components/sections/app-demo/AdmArt";
import { ScrollFade } from "@/components/sections/app-demo/ScrollFade";
import { useWorkspace } from "@/components/sections/app-demo/workspace-context";

const SIDEBAR_PAINT = "rgb(239,239,239)";

function Tip({ children }: { children: string }) {
  return (
    <span role="tooltip" className="ui-tip ui-tip-right">
      {children}
    </span>
  );
}

/** Collapsed app sidebar: logo, search, room links, account and notifications. */
export function Sidebar() {
  const { door } = useWorkspace();

  return (
    <div className="sidebar app:relative app:z-40 app:flex app:flex-col app:bg-sidebar-bg">
      <div className="app:flex app:h-58 app:items-center app:justify-center">
        <button
          type="button"
          data-track="demo-sidebar-logo"
          aria-label="Loopsii — home"
          className="sidebar-logo app:block app:rounded-md app:text-label-primary app:focus-visible:outline-none app:focus-visible:ring-2 app:focus-visible:ring-ink app:focus-visible:ring-offset-2 app:focus-visible:ring-offset-sidebar-bg"
        >
          <LoopsiiLogo className="app:block app:h-21 app:w-26" />
        </button>
      </div>
      <div className="app:p-8">
        <button
          type="button"
          aria-label="Search"
          className="search-trigger app:relative app:flex app:h-34 app:w-full app:items-center app:rounded-lg app:border app:border-hairline app:px-7"
          data-track="demo-sidebar-search"
          onClick={(e) => {
            e.currentTarget.blur();
            door("Search works in the app.");
          }}
        >
          <span className="nav-icon app:w-16">
            <AdmIcon icon={Search01Icon} />
          </span>
          <Tip>Search ⌘K</Tip>
        </button>
      </div>
      <ScrollFade paint={SIDEBAR_PAINT} className="app:flex-1 app:space-y-4 app:p-8">
        {ADM_NAV.map((item) => {
          const active = item.key === "home";
          return (
            <button
              key={item.key}
              type="button"
              data-track={`demo-sidebar-${item.key}`}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "nav-link app:relative app:flex app:h-34 app:w-full app:items-center app:rounded-lg app:px-8 app:text-note app:font-normal",
                active && "active",
              )}
            >
              <span className="nav-icon app:w-16">
                <AdmIcon icon={item.icon} />
              </span>
              <Tip>{item.label}</Tip>
            </button>
          );
        })}
      </ScrollFade>
      <div className="app:relative app:flex app:px-4 app:pb-12 app:pt-50">
        <button
          type="button"
          data-track="demo-sidebar-account"
          aria-label="Account"
          className="user-row app:relative app:flex app:h-34 app:min-w-0 app:flex-1 app:items-center app:rounded-lg app:px-8"
          onClick={() => door("The account menu works in the app.")}
        >
          <span
            aria-hidden="true"
            className="app:relative app:flex app:shrink-0 app:items-center app:justify-center app:overflow-hidden app:rounded-full app:bg-lime app:font-medium app:text-label-primary"
            style={{ width: 24, height: 24, fontSize: 10 }}
          >
            {ADM_USER.initials}
          </span>
          <Tip>Account</Tip>
        </button>
        <button
          type="button"
          data-track="demo-sidebar-notifications"
          aria-label="Notifications"
          className="sidebar-bell app:absolute app:bottom-50 app:left-7 app:flex app:size-34 app:items-center app:justify-center app:rounded-lg app:text-label-primary"
        >
          <AdmIcon icon={Notification01Icon} />
          <Tip>Notifications</Tip>
        </button>
      </div>
    </div>
  );
}
