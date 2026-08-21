import type { ActivityType } from "@/lib/types";

export const TYPE_LABEL: Record<ActivityType, string> = {
  call: "Call",
  email: "Email",
  meeting: "Meeting",
  note: "Note",
  stage_change: "Stage change",
};

export const TYPE_COLOR_CLASS: Record<ActivityType, string> = {
  call: "bg-type-call-dim text-type-call",
  email: "bg-type-email-dim text-type-email",
  meeting: "bg-type-meeting-dim text-type-meeting",
  note: "bg-type-note-dim text-type-note",
  stage_change: "bg-type-stage-dim text-type-stage",
};
