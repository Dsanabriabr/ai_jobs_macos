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

const termNodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  weight: z.number().min(-1).max(1),
  role: z.enum([
    "skill",
    "seniority",
    "work_model",
    "constraint_boost",
    "locale_pt",
    "penalty",
  ]),
  lang: z.enum(["en", "pt", "any"]),
});

const candidateProfileSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  primaryLocale: z.enum(["pt-BR", "en"]),
  languages: z.array(z.enum(["pt-BR", "en"])).min(1),
  workModel: z.enum(["pj_contractor", "clt", "either"]),
  visaConstraint: z.enum(["no_us_visa", "open", "needs_sponsorship"]),
  preferredGeos: z.array(z.string().min(2)).min(1),
  timezone: z.string().min(1),
  notes: z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => value ?? null),
});

export const searchPolicySchema = z.object({
  mode: z.enum(["persona_graph", "manual_queries"]),
  queries: z.array(z.string().min(1)).default([]),
  cadence: cadenceSchema,
  resultLimitPerQuery: z.number().int().min(1).max(50),
  geoLocation: z.string().min(2).max(64).optional(),
  profile: candidateProfileSchema,
  termGraph: z.object({
    nodes: z.array(termNodeSchema).min(1),
  }),
  maxPlannedQueries: z.number().int().min(1).max(20),
}).superRefine((policy, ctx) => {
  if (policy.mode === "manual_queries" && policy.queries.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "queries required when mode is manual_queries",
      path: ["queries"],
    });
  }
});

export type SearchPolicyBody = z.infer<typeof searchPolicySchema>;
