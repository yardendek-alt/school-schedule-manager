import { describe, expect, it } from "vitest";
import { busyOnDate, DAYS, PERIODS, findSubstitutes, findWholeDaySubstitutes, type Slot, type Substitution, type Teacher } from "@/lib/school";

const olga: Teacher = { id: "olga", name: "אולגה", phone: "", subjects: [], max_weekly_hours: 0, working_days: DAYS, dedicated_substitute: true };
const missing: Teacher = { ...olga, id: "missing", name: "missing", dedicated_substitute: false };
const slots: Slot[] = DAYS.flatMap((day_of_week) => PERIODS.map((period) => ({ teacher_id: missing.id, day_of_week, period, activity_type: "הוראה" as const })));
const sub: Substitution = { id: "booking", date: "2026-10-13", day: "Tuesday", period: 3, original_teacher_id: "other", substitute_teacher_id: olga.id, reason: "", status: "אושר" };

describe("אולגה dedicated substitute", () => {
  it("is available every school period without a base schedule", () => {
    for (const day of DAYS) for (const period of PERIODS) {
      expect(findSubstitutes([missing, olga], slots, missing.id, day, period).map((c) => c.teacher.name)).toEqual(["אולגה"]);
    }
    expect(findWholeDaySubstitutes([missing, olga], slots, missing.id, "Tuesday").map((c) => c.teacher.name)).toEqual(["אולגה"]);
  });
  it("cannot cover another teacher at the same date and hour", () => {
    expect(findSubstitutes([missing, olga], slots, missing.id, "Tuesday", 3, sub.date, busyOnDate([sub], sub.date))).toEqual([]);
  });
  it("remains available at another hour and on another date", () => {
    expect(findSubstitutes([missing, olga], slots, missing.id, "Tuesday", 4, sub.date, busyOnDate([sub], sub.date)).map((c) => c.teacher.name)).toEqual(["אולגה"]);
    expect(findSubstitutes([missing, olga], slots, missing.id, "Tuesday", 3, "2026-10-20", busyOnDate([sub], "2026-10-20")).map((c) => c.teacher.name)).toEqual(["אולגה"]);
  });
  it("still excludes her when marked absent", () => {
    expect(findSubstitutes([missing, olga], slots, missing.id, "Tuesday", 3, sub.date, busyOnDate([], sub.date, [olga.id]))).toEqual([]);
  });
});