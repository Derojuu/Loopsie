import type { ComponentType } from "react";
import type { FeatureIconId } from "@/constants/features";
import { DepositInvoiceIcon } from "@/components/sections/features/icons/DepositInvoiceIcon";
import { ReusableIcon } from "@/components/sections/features/icons/ReusableIcon";
import { AgreementsIcon } from "@/components/sections/features/icons/AgreementsIcon";
import { ClientPortalIcon } from "@/components/sections/features/icons/ClientPortalIcon";
import { TodaysPlateIcon } from "@/components/sections/features/icons/TodaysPlateIcon";
import { MeetingsHubIcon } from "@/components/sections/features/icons/MeetingsHubIcon";
import { AiMeetingIcon } from "@/components/sections/features/icons/AiMeetingIcon";
import { TimeTrackingIcon } from "@/components/sections/features/icons/TimeTrackingIcon";
import { GanttIcon } from "@/components/sections/features/icons/GanttIcon";
import { DictationIcon } from "@/components/sections/features/icons/DictationIcon";
import { QaChangeLogIcon } from "@/components/sections/features/icons/QaChangeLogIcon";
import { RetroNotesIcon } from "@/components/sections/features/icons/RetroNotesIcon";
import { FinalInvoiceIcon } from "@/components/sections/features/icons/FinalInvoiceIcon";
import { DeliverablesIcon } from "@/components/sections/features/icons/DeliverablesIcon";
import { FollowUpsIcon } from "@/components/sections/features/icons/FollowUpsIcon";
import { PipelineIcon } from "@/components/sections/features/icons/PipelineIcon";
import { EarningsForecastIcon } from "@/components/sections/features/icons/EarningsForecastIcon";
import { CapacityCheckIcon } from "@/components/sections/features/icons/CapacityCheckIcon";

/** Feature icon id → inline SVG component. */
export const FEATURE_ICONS: Record<FeatureIconId, ComponentType> = {
  "deposit-invoice": DepositInvoiceIcon,
  "reusable": ReusableIcon,
  "agreements": AgreementsIcon,
  "client-portal": ClientPortalIcon,
  "todays-plate": TodaysPlateIcon,
  "meetings-hub": MeetingsHubIcon,
  "ai-meeting": AiMeetingIcon,
  "time-tracking": TimeTrackingIcon,
  "gantt": GanttIcon,
  "dictation": DictationIcon,
  "qa-change-log": QaChangeLogIcon,
  "retro-notes": RetroNotesIcon,
  "final-invoice": FinalInvoiceIcon,
  "deliverables": DeliverablesIcon,
  "follow-ups": FollowUpsIcon,
  "pipeline": PipelineIcon,
  "earnings-forecast": EarningsForecastIcon,
  "capacity-check": CapacityCheckIcon,
};
