import type { DigestCadence } from "../domain/entities/DigestCadence.js";

/** Returns true if cadence says a run is due relative to lastSuccessfulRunAt. */
export function isCadenceDue(
  cadence: DigestCadence,
  lastSuccessfulRunAt: Date | null,
  now: Date = new Date(),
): boolean {
  if (cadence.kind === "manual") return false;

  if (!lastSuccessfulRunAt) return true;

  const last = lastSuccessfulRunAt;

  switch (cadence.kind) {
    case "daily":
      return isDailyDue(cadence.hour, cadence.minute, last, now);
    case "weekly":
      return (
        now.getDay() === cadence.weekday &&
        isDailyDue(cadence.hour, cadence.minute, last, now) &&
        daysBetween(last, now) >= 6
      );
    case "monthly":
      return (
        now.getDate() === cadence.dayOfMonth &&
        isDailyDue(cadence.hour, cadence.minute, last, now) &&
        monthsBetween(last, now) >= 1
      );
    case "quarterly":
      return monthsBetween(last, now) >= 3 && isDailyDue(cadence.hour, cadence.minute, last, now);
    case "semiannual":
      return monthsBetween(last, now) >= 6 && isDailyDue(cadence.hour, cadence.minute, last, now);
    case "annual":
      return (
        now.getMonth() + 1 === cadence.month &&
        now.getDate() === cadence.dayOfMonth &&
        isDailyDue(cadence.hour, cadence.minute, last, now) &&
        monthsBetween(last, now) >= 11
      );
    default:
      return false;
  }
}

function isDailyDue(hour: number, minute: number, last: Date, now: Date): boolean {
  const scheduled = new Date(now);
  scheduled.setHours(hour, minute, 0, 0);
  if (now < scheduled) return false;
  return last < scheduled;
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000));
}

function monthsBetween(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}
