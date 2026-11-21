import Image from "next/image";
import {
  DASH_BALANCE,
  DASH_CARD_POSITIONS as POS,
  DASH_CLOSING_BARS,
  DASH_COMM_TABS,
  DASH_FEEDBACK,
  DASH_INVOICES,
  DASH_INVOICE_LINES,
  DASH_KICKOFF,
  DASH_MONEY_TILES,
  DASH_SCOPE_FIELDS,
} from "@/constants/dashboard";
import { cn } from "@/utils/cn";
import { DashCard } from "@/components/sections/dashboard/DashCard";
import { DashImg } from "@/components/sections/dashboard/DashImg";

export function ScopeCard() {
  return (
    <DashCard label="Scope" pos={POS.scope} innerClassName="flex flex-col items-start p-10">
      <div className="flex w-327 flex-col rounded-16 bg-white p-20">
        <div className="flex w-full flex-col gap-12">
          {DASH_SCOPE_FIELDS.map((f) => (
            <div key={f.label} className="flex w-full flex-col gap-5">
              <p className="w-full ui-10 font-medium text-[#9e9e96]">{f.label}</p>
              <div
                className={cn(
                  "flex h-32 items-center rounded-10 border border-solid border-[#e8e8e3] bg-[#f6f6f4] px-16",
                  "swatch" in f && "justify-between pr-14",
                )}
              >
                <p className="ui-11 text-[#73736e]">{f.value}</p>
                {"swatch" in f && <div className="size-16 rounded-4 bg-[#d0e5f2]" />}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-30 flex w-full items-center gap-8 font-medium">
          <div className="flex flex-1 flex-col gap-4 rounded-10 bg-[#e2f298] p-12 text-[#0f6e57]">
            <p className="ui-11">Cost</p>
            <p className="ui-14">+$180</p>
          </div>
          <div className="flex flex-1 flex-col gap-4 rounded-10 bg-[#d0e5f2] p-12 text-[#0d457d]">
            <p className="ui-11">Timeline</p>
            <p className="ui-14">+3 days</p>
          </div>
        </div>
      </div>
    </DashCard>
  );
}

export function FeedbackCard() {
  return (
    <DashCard label="Feedback" pos={POS.feedback} innerClassName="flex w-512 flex-col gap-10 bg-steel! p-10">
      {DASH_FEEDBACK.map((row) => (
        <div key={row.title} className="flex w-full items-center justify-between rounded-10 bg-white p-15">
          <div className="flex items-center gap-20">
            <div className={cn("size-18 shrink-0 rounded-full", row.dot)} />
            <div className="flex flex-col gap-5">
              <p className="ui-12 font-medium text-[#1c1c1a]">{row.title}</p>
              <p className="ui-10 text-[#9e9e96]">{row.meta}</p>
            </div>
          </div>
          <div className={cn("flex h-18 w-67 items-center justify-center rounded-full px-4 py-3", row.dot)}>
            <p className={cn("ui-10 leading-1.1 text-black", row.needsInput ? "opacity-50" : "opacity-0")} aria-hidden={!row.needsInput}>
              Needs input
            </p>
          </div>
        </div>
      ))}
    </DashCard>
  );
}

export function MoneyCard() {
  return (
    <DashCard label="Money" pos={POS.money} innerClassName="flex flex-col gap-20 p-10">
      <div className="flex items-center gap-6">
        {DASH_MONEY_TILES.map((t) => (
          <div key={t.label} className="flex w-160 flex-col gap-15 rounded-10 bg-white p-15">
            <div className="flex items-center gap-6">
              <div className={cn("relative flex size-28 shrink-0 items-center justify-center rounded-full", t.bg)}>
                <DashImg name={t.glyph} className="size-17" />
              </div>
              <p className="ui-12 font-medium text-[#73736e]">{t.label}</p>
            </div>
            <div className="flex w-full flex-col gap-5">
              <p className="ui-17 font-semibold text-[#1c1c1a]">{t.value}</p>
              <p className="ui-10 text-[#9e9e96]">{t.meta}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex w-full flex-col gap-10">
        {DASH_INVOICES.map((inv) => (
          <div key={inv.number} className="flex w-full items-center justify-between rounded-10 bg-white p-15">
            <div className="flex items-center gap-10">
              <div className={cn("size-18 shrink-0 rounded-full", inv.color)} />
              <div className="flex flex-col gap-5">
                <p className="ui-12 font-medium text-[#1c1c1a]">{inv.client}</p>
                <p className="ui-10 text-[#9e9e96]">{inv.number}</p>
              </div>
            </div>
            <div className={cn("h-18 w-64 rounded-full", inv.color, !inv.pill && "opacity-0")} />
          </div>
        ))}
      </div>
    </DashCard>
  );
}

export function ClosingCard() {
  return (
    <DashCard label="Closing" pos={POS.closing} innerClassName="flex w-198 flex-col gap-50 bg-main! p-15">
      <div className="flex w-full flex-col gap-16">
        {DASH_CLOSING_BARS.map((bar) => (
          <div key={bar.label} className="flex w-full items-center gap-20">
            <p className="w-38 shrink-0 ui-12 font-medium text-[#73736e]">{bar.label}</p>
            <div className="h-16 flex-1 rounded-full bg-white">
              <div className="h-16 rounded-full bg-black" style={{ width: `${bar.value}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="flex w-113 flex-col gap-3">
        <p className="ui-34 font-semibold text-[#1c1c1a]">$92/hr</p>
        <p className="ui-10 text-black opacity-50">effective rate</p>
      </div>
    </DashCard>
  );
}

export function DealCard() {
  return (
    <DashCard label="Deal" pos={POS.deal} innerClassName="flex flex-col gap-20 bg-steel! p-20">
      <div className="relative h-291 w-211">
        <DashImg name="invoice-paper" className="absolute inset-0 h-full w-full" />
        <p className="absolute left-15 top-15 ui-26 leading-1 font-semibold tracking-[-0.02em] text-black opacity-50">Invoice</p>
        <p className="absolute left-16 top-40 ui-10 leading-1.1 text-black opacity-50">#7684</p>
        <p className="absolute left-15 top-86 whitespace-nowrap ui-13 text-[#73736e]">Homepage redesign</p>
        <div className="absolute right-15 top-86 flex items-center rounded-full bg-[#f6d0c7] px-6 py-4">
          <p className="ui-10 font-medium text-[#e8927a]">unpaid</p>
        </div>
        <div className="absolute left-15 top-134 flex w-181 flex-col gap-4">
          {DASH_INVOICE_LINES.map(([name, price]) => (
            <div key={name} className="contents">
              <p className="ui-11 text-[#73736e]">{name}</p>
              <p className="ui-11 font-medium text-[#1c1c1a]">{price}</p>
            </div>
          ))}
          <p className="ui-10 text-[#9e9e96]">Subtotal</p>
          <p className="ui-13 font-semibold text-[#1c1c1a]">$1,560</p>
        </div>
      </div>
      <div className="flex items-start gap-10">
        <div className="flex rounded-full bg-[#1c1c1a] px-20 py-10">
          <p className="ui-10 font-medium text-white">Create + send</p>
        </div>
        <div className="flex rounded-full border-1 border-solid border-[#1c1c1a] px-19 py-9">
          <p className="ui-10 font-medium text-black">Mark as paid</p>
        </div>
      </div>
    </DashCard>
  );
}

export function CommunicationCard() {
  return (
    <DashCard label="Communication" pos={POS.communication} innerClassName="flex w-555 flex-col gap-40 p-10">
      <div className="grid w-full grid-cols-3">
        <div className="flex aspect-square flex-col justify-between rounded-10 bg-white p-15">
          <p className="ui-10 leading-1.1 text-black opacity-50">2 days ago</p>
          <div className="flex flex-col gap-10">
            <p className="ui-26 leading-1 font-medium tracking-[-0.02em] text-black opacity-50">
              Project
              <br />
              Discovery
            </p>
            <div className="flex items-start gap-5">
              <DashImg name="icon-clock" className="size-12" />
              <p className="ui-12 leading-1.1 font-semibold text-black">1 hour 6 min</p>
            </div>
          </div>
        </div>
        <div className="relative overflow-clip rounded-10">
          <Image className="object-cover" src="/images/photo-1.png" alt="" fill sizes="180px" />
        </div>
        <div className="relative rounded-10">
          <Image className="rounded-10 object-cover" src="/images/photo-2.png" alt="" fill sizes="180px" />
          <div className="absolute left-0 top-1/2 flex h-114 w-86 -translate-x-1/2 -translate-y-1/2 rotate-30 items-center justify-center rounded-[50%] bg-black/30 backdrop-blur-[calc(var(--spacing)*2.5)]">
            <div className="flex h-82 w-61 items-center justify-center rounded-[50%] bg-[#c4f041]">
              <DashImg name="play-glyph" className="h-16 w-13 max-w-none translate-x-1 -rotate-30" />
            </div>
          </div>
        </div>
      </div>
      <div className="flex w-full flex-col gap-20">
        <div className="flex w-full flex-col gap-3 px-15">
          <div className="flex w-188 items-center gap-10">
            <div className="relative flex items-center justify-center">
              <p className="ui-10 leading-1.1 font-semibold text-black">Chapters</p>
              <DashImg name="tab-underline" className="absolute -bottom-3 left-0 h-2 w-45 max-w-none" />
            </div>
            {DASH_COMM_TABS.map((tab) => (
              <p key={tab} className="ui-10 leading-1.1 text-black opacity-30">
                {tab}
              </p>
            ))}
          </div>
          <DashImg name="tab-divider" className="h-1 w-full" />
        </div>
        <div className="flex w-full items-start justify-between rounded-10 bg-white p-15">
          <div className="flex h-18 items-center justify-center rounded-7 bg-sky px-4">
            <p className="ui-10 leading-none text-black">0:00:00</p>
          </div>
          <p className="w-355 ui-12 text-[#73736e]">Goals, scope &amp; timeline walkthrough</p>
        </div>
      </div>
    </DashCard>
  );
}

export function KickoffCard() {
  return (
    <DashCard label="Kickoff" pos={POS.kickoff} innerClassName="flex w-555 flex-col items-start p-10">
      <div className="grid w-full grid-cols-2 gap-8">
        {DASH_KICKOFF.map((item) => (
          <div key={item.title} className="flex flex-col gap-30 rounded-12 bg-white p-15">
            <div className="flex w-full items-start gap-20">
              <div className="flex min-w-0 flex-1 items-center gap-16">
                <DashImg name={item.check} className="size-22 shrink-0" />
                <p className="whitespace-nowrap ui-12 font-medium text-[#1c1c1a]">{item.title}</p>
              </div>
              <div
                className={cn(
                  "flex shrink-0 items-center rounded-full px-10 py-4 ui-10 font-medium",
                  item.done ? "bg-[#e2f298] text-[#0f6e57]" : "bg-[#e8e8e3] text-[#9e9e96]",
                )}
              >
                {item.done ? "uploaded" : "waiting"}
              </div>
            </div>
            <div
              className={cn(
                "relative flex h-80 w-full items-center justify-center overflow-clip rounded-11",
                item.done ? "bg-lime-light" : "bg-[#e8e8e3]",
              )}
            >
              <DashImg name={item.glyph} className="size-56" />
            </div>
          </div>
        ))}
      </div>
    </DashCard>
  );
}

export function BalanceCard() {
  return (
    <DashCard label="Balance" pos={POS.balance} innerClassName="flex items-start gap-24 bg-main! p-20">
      {DASH_BALANCE.map((col) => (
        <div key={col.week} className="flex flex-col items-start gap-20">
          <div className="relative h-241 w-20 rounded-full bg-white">
            <div className="absolute bottom-0 left-0 w-20 rounded-full bg-steel" style={{ height: `${col.value}%` }} />
          </div>
          <p className="ui-12 text-[#9e9e96]">{col.week}</p>
        </div>
      ))}
    </DashCard>
  );
}
