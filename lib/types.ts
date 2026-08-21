import { z } from "zod";

export const ACTIVITY_TYPES = ["call", "email", "meeting", "note", "stage_change"] as const;

export const activityTypeSchema = z.enum(ACTIVITY_TYPES);

export type ActivityType = z.infer<typeof activityTypeSchema>;

export const rawActivitySchema = z.object({
  accountId: z.string().min(1),
  type: z.string().min(1),
  timestamp: z.string(),
  text: z.string(),
  fromStage: z.string().optional(),
  toStage: z.string().optional(),
});

export type RawActivity = z.infer<typeof rawActivitySchema>;

export const normalizedActivitySchema = z.object({
  id: z.string(),
  accountId: z.string(),
  type: activityTypeSchema,
  timestamp: z.date().nullable(),
  text: z.string(),
  fromStage: z.string().optional(),
  toStage: z.string().optional(),
});

export type NormalizedActivity = z.infer<typeof normalizedActivitySchema>;

export type ActivityCluster = {
  primary: NormalizedActivity;
  merged: NormalizedActivity[];
};

export type TimelineGroup = {
  monthLabel: string;
  clusters: ActivityCluster[];
  summary: string;
  gapBeforeDays?: number;
};

export const accountSchema = z.object({
  id: z.string(),
  name: z.string(),
  industry: z.string(),
});

export type Account = z.infer<typeof accountSchema>;
