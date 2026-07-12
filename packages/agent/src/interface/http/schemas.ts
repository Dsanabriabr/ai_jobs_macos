import { z } from "zod";

const cadenceSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("manual") }),
  z.object({
    kind: z.literal("daily"),
    hour: z.number().int().min(0).max(23),
    minute: z.number().int().min(0).max(59),
  }),
  z.object({
    kind: z.literal("weekly"),
    weekday: z.number().int().min(0).max(6),
    hour: z.number().int().min(0).max(23),
    minute: z.number().int().min(0).max(59),
  }),
  z.object({
    kind: z.literal("monthly"),
    dayOfMonth: z.number().int().min(1).max(28),
    hour: z.number().int().min(0).max(23),
    minute: z.number().int().min(0).max(59),
  }),
  z.object({
    kind: z.literal("quarterly"),
    monthOfQuarter: z.number().int().min(1).max(3),
    dayOfMonth: z.number().int().min(1).max(28),
    hour: z.number().int().min(0).max(23),
    minute: z.number().int().min(0).max(59),
  }),
  z.object({
    kind: z.literal("semiannual"),
    monthOfHalf: z.number().int().min(1).max(6),
    dayOfMonth: z.number().int().min(1).max(28),
    hour: z.number().int().min(0).max(23),
    minute: z.number().int().min(0).max(59),
  }),
  z.object({
    kind: z.literal("annual"),
    month: z.number().int().min(1).max(12),
    dayOfMonth: z.number().int().min(1).max(28),
    hour: z.number().int().min(0).max(23),
    minute: z.number().int().min(0).max(59),
  }),
]);

export const searchPolicySchema = z.object({
  queries: z.array(z.string().min(1)).min(1),
  cadence: cadenceSchema,
  resultLimitPerQuery: z.number().int().min(1).max(50),
  geoLocation: z.string().min(2).max(64).optional(),
});

export type SearchPolicyBody = z.infer<typeof searchPolicySchema>;
