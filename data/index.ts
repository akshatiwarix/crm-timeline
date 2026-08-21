import { z } from "zod";
import { accountSchema, rawActivitySchema } from "@/lib/types";
import accountsJson from "./corpus/accounts.json";
import activitiesJson from "./corpus/activities.json";

/** The committed demo corpus, validated at import time — never generated at request time. */
export const ACCOUNTS = z.array(accountSchema).parse(accountsJson);
export const ACTIVITIES = z.array(rawActivitySchema).parse(activitiesJson);
