import type { ReactNode } from "react";
import { DASH_NAV_ICONS } from "@/constants/dashboard";
import { cn } from "@/utils/cn";
import { DashImg } from "@/components/sections/dashboard/DashImg";

/** Static app chrome (sidebar + top bar) the cards float over. */
export function DashFrame({ grid }: { grid: ReactNode }) {
  return (
    <div className="dash-frame absolute inset-0 overflow-clip rounded-20 bg-white">
      <div className="absolute left-69 top-75 h-985 w-1862 bg-[#fafafa]" />
      {grid}
      <aside className="absolute left-10 top-0 flex h-1080 w-58 flex-col bg-[#efefef]">
        <div className="flex h-75 items-center px-19 pt-10">
          <DashImg name="logo-mark" className="w-97 max-w-none -translate-x-19" />
        </div>
        <div className="p-10">
          <div className="flex h-41 w-full items-center rounded-10 border border-solid border-[#e7e7e7] px-8">
            <DashImg name="icon-search" className="size-19" />
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-5 p-10" aria-hidden="true">
          {DASH_NAV_ICONS.map((icon, i) => (
            <span key={icon} className={cn("flex h-41 items-center rounded-10 px-10", i === 0 && "bg-[#e2e2e2]")}>
              <DashImg name={icon} className="size-19 shrink-0" />
            </span>
          ))}
        </nav>
        <div className="border-t border-solid border-[#e7e7e7] p-10">
          <div className="flex items-center rounded-7 p-10">
            <DashImg name="icon-chevrons-left" className="size-19 rotate-180" />
          </div>
        </div>
        <div className="px-5 py-14">
          <div className="flex items-center p-10">
            <span className="flex size-29 items-center justify-center rounded-full bg-sage ui-12 font-medium text-black">ST</span>
          </div>
        </div>
      </aside>
      <header className="absolute left-68 top-0 flex h-75 w-1853 items-center justify-between pt-21 pb-16 pl-16 pr-26">
        <p className="ui-14 font-medium text-[#111827] opacity-0" aria-hidden="true">
          Dashboard
        </p>
        <div className="flex items-center gap-12">
          <div className="flex items-center">
            <DashImg name="timer-circle" className="-mr-1 h-41 w-34 max-w-none" />
            <div className="flex h-34 items-center justify-center rounded-full bg-lime-light px-16 py-8">
              <span className="ui-14 font-medium text-[#151515]">Start Timer</span>
            </div>
          </div>
          <div className="flex h-34 items-center justify-center gap-6 rounded-full border border-solid border-[#e7e7e7] px-16 py-8">
            <DashImg name="icon-plus" className="size-16" />
            <span className="ui-14 font-medium text-[#3d3d3d]">New</span>
          </div>
        </div>
      </header>
      <div className="pointer-events-none absolute inset-0 z-10 rounded-20 border-10 border-solid border-[#e8e8e3]" />
    </div>
  );
}
