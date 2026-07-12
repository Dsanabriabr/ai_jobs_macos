export type DigestCadence =
  | { kind: "manual" }
  | { kind: "daily"; hour: number; minute: number }
  | { kind: "weekly"; weekday: number; hour: number; minute: number }
  | { kind: "monthly"; dayOfMonth: number; hour: number; minute: number }
  | { kind: "quarterly"; monthOfQuarter: number; dayOfMonth: number; hour: number; minute: number }
  | { kind: "semiannual"; monthOfHalf: number; dayOfMonth: number; hour: number; minute: number }
  | { kind: "annual"; month: number; dayOfMonth: number; hour: number; minute: number };
