"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { CheckmarkSquare02Icon, ComputerVideoIcon, Timer02Icon, Video01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/utils/cn";
import { ADM_ACTIVITY, ADM_MONTH, ADM_TOTAL_ACTIVITIES, ADM_WEEKDAYS } from "@/constants/app-demo";
import { AdmIcon } from "@/components/sections/app-demo/AdmIcon";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const ARROWS: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };

type Cell = { kind: "blank" } | { kind: "future" } | { kind: "day"; index: number };

/** Month grid laid out Monday-first, padded to whole weeks. */
const CELLS: Cell[] = (() => {
  const { year, monthIndex, days, today } = ADM_MONTH;
  const lead = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const cells: Cell[] = Array.from({ length: lead }, () => ({ kind: "blank" }));
  for (let d = 1; d <= days; d++) cells.push(d <= today ? { kind: "day", index: d - 1 } : { kind: "future" });
  while (cells.length % 7) cells.push({ kind: "blank" });
  return cells;
})();
const WEEKS = Array.from({ length: CELLS.length / 7 }, (_, w) => CELLS.slice(w * 7, w * 7 + 7));

const dateLabel = (index: number) => {
  const { year, monthIndex, label } = ADM_MONTH;
  const date = new Date(year, monthIndex, index + 1);
  return `${DAY_NAMES[date.getDay()]}, ${label} ${index + 1}, ${year}`;
};

const lineIcon = (text: string) =>
  text.includes("tracked")
    ? Timer02Icon
    : text.includes("meeting")
      ? Video01Icon
      : text.includes("recording")
        ? ComputerVideoIcon
        : CheckmarkSquare02Icon;

/** "Total this month" card with the activity heat-map and its rich tooltips. */
export function ActivityCard() {
  const todayIndex = ADM_MONTH.today - 1;
  const [focusIndex, setFocusIndex] = useState(todayIndex);
  const [tipIndex, setTipIndex] = useState<number | null>(null);
  const cellRefs = useRef<(HTMLTableCellElement | null)[]>([]);

  const onKey = (e: KeyboardEvent, index: number) => {
    const next =
      e.key === "Home" ? 0 : e.key === "End" ? todayIndex : e.key in ARROWS ? index + ARROWS[e.key] : null;
    if (next === null) return;
    e.preventDefault();
    if (next < 0 || next > todayIndex) return;
    setFocusIndex(next);
    cellRefs.current[next]?.focus();
  };

  return (
    <div
      data-adm-enter="card"
      className="app:flex app:h-220 app:flex-col app:justify-between app:rounded-2xl app:border app:border-hairline app:bg-surface app:px-20 app:py-16 app:md:order-2 app:xl:order-none"
    >
      <p className="app:text-note app:text-label-secondary">Total this month</p>
      <div className="app:flex app:items-end app:justify-between app:gap-16">
        <div className="app:flex app:shrink-0 app:flex-col">
          <span className="app:text-display app:font-semibold app:text-label-primary">{ADM_TOTAL_ACTIVITIES}</span>
          <span className="app:text-body app:font-medium app:text-label-primary">activities</span>
        </div>
        <table
          aria-label="Activity this month"
          role="grid"
          className="app:-m-2 app:w-170 app:shrink-0 app:table-fixed app:border-separate app:border-spacing-2"
        >
          <thead>
            <tr>
              {ADM_WEEKDAYS.map((d) => (
                <th
                  key={d.abbr}
                  scope="col"
                  abbr={d.abbr}
                  className="app:p-0 app:pb-2 app:text-center app:text-[10px] app:leading-13 app:font-normal app:text-label-tertiary"
                >
                  {d.short}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {WEEKS.map((week, w) => (
              <tr key={w} className="app:h-22">
                {week.map((cell, col) => {
                  if (cell.kind === "blank") return <td key={col} className="app:p-0" />;
                  if (cell.kind === "future")
                    return (
                      <td
                        key={col}
                        data-adm-enter="day"
                        className="app:rounded-full app:border app:border-dashed app:border-gray-6 app:p-0"
                      />
                    );
                  const { index } = cell;
                  const day = ADM_ACTIVITY[index];
                  const label = dateLabel(index);
                  const lines = day.summary === "no activity" ? [] : day.summary.split(", ");
                  return (
                    <td
                      key={col}
                      ref={(el) => {
                        cellRefs.current[index] = el;
                      }}
                      role="gridcell"
                      data-track="demo-home-activity-day"
                      data-adm-enter="day"
                      aria-label={`${label}: ${day.summary}`}
                      tabIndex={index === focusIndex ? 0 : -1}
                      className={cn(
                        "adm-day app:relative app:rounded-full app:p-0 app:outline-none app:focus-visible:ring-2 app:focus-visible:ring-ink app:focus-visible:ring-offset-2 app:focus-visible:ring-offset-surface",
                        `app:${day.tone}`,
                      )}
                      onKeyDown={(e) => onKey(e, index)}
                      onFocus={() => {
                        setFocusIndex(index);
                        setTipIndex(index);
                      }}
                      onBlur={() => setTipIndex(null)}
                      onPointerEnter={() => setTipIndex(index)}
                      onPointerLeave={() => setTipIndex(null)}
                    >
                      {tipIndex === index && (
                        <span
                          role="tooltip"
                          className={cn("adm-tip adm-tip-up adm-tip-rich adm-tip-flush", col >= 3 && "adm-tip-end")}
                        >
                          <span className="app:flex app:w-212 app:flex-col app:gap-12 app:py-2">
                            <span>{label}</span>
                            <span className="app:flex app:flex-col app:gap-8 app:font-normal">
                              {lines.length ? (
                                lines.map((line) => (
                                  <span key={line} className="app:flex app:items-center app:gap-8">
                                    <AdmIcon icon={lineIcon(line)} className="app:shrink-0 app:opacity-70" />
                                    <span className="app:truncate">{line}</span>
                                  </span>
                                ))
                              ) : (
                                <span className="app:opacity-70">No activity</span>
                              )}
                            </span>
                          </span>
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
