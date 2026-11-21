"use client";

import { useEffect, useState } from "react";
import { cn } from "@/utils/cn";
import { ADM_NOTICE } from "@/constants/app-demo";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { NoticeMark } from "@/components/sections/app-demo/AdmArt";
import { AdmIcon } from "@/components/sections/app-demo/AdmIcon";

interface NoticeCardProps {
  shown: boolean;
  onDismiss: () => void;
  onReview: () => void;
}

/** Slide-in time before the card accepts pointer input (ms). */
const SETTLE_MS = 520;

/** macOS-style "Recording notes ready" notification pinned to the top-right of the frame. */
export function NoticeCard({ shown, onDismiss, onReview }: NoticeCardProps) {
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (!shown) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = window.setTimeout(() => setSettled(true), reduced ? 200 : SETTLE_MS);
    return () => {
      window.clearTimeout(id);
      setSettled(false);
    };
  }, [shown]);

  return (
    <div className={cn("mrc adm-notice", shown && "is-shown", settled && "is-settled")} inert={!shown}>
      <div className="mnc has-badge">
        <button type="button" className="mnc-badge" aria-label="Dismiss" data-track="demo-mac-dismiss" onClick={onDismiss}>
          <AdmIcon icon={Cancel01Icon} size={12} />
        </button>
        <div className="mnc-card">
          <div className="mnc-head">
            <NoticeMark />
            <div className="mnc-text">
              <p className="mnc-title">{ADM_NOTICE.title}</p>
              <p className="mnc-sub">{ADM_NOTICE.subtitle}</p>
            </div>
          </div>
          <div className="mnc-btns">
            <button type="button" className="mnc-btn" data-track="demo-mac-review" onClick={onReview}>
              Review
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
