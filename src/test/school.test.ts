import { describe, it, expect } from "vitest";
import { findSubstitutes, findWholeDaySubstitutes, teachingPeriods, dayFromDate, type Teacher, type Slot } from "@/lib/school";

const T = (id: string): Teacher => ({ id, name: id, phone: "", subjects: [], max_weekly_hours: 36, working_days: ["Sunday"] });

describe("findSubstitutes", () => {
  const teachers = ["m", "a", "b", "c", "d"].map(T);
  const slots: Slot[] = [
    { day_of_week: "Sunday", period: 1, teacher_id: "m", activity_type: "הוראה", subject: "הוראה כוללת" },
    { day_of_week: "Sunday", period: 1, teacher_id: "a", activity_type: "שהייה" },
    { day_of_week: "Sunday", period: 1, teacher_id: "b", activity_type: "פרטני" },
    { day_of_week: "Sunday", period: 1, teacher_id: "d", activity_type: "הוראה" },
  ];
  const ids = findSubstitutes(teachers, slots, "m", "Sunday", 1).map((r) => r.teacher.id).sort();
  it("only offers teachers in שהייה or פרטני", () => expect(ids).toEqual(["a", "b"]));
});

describe("teachingPeriods", () => {
  const slots: Slot[] = [
    { day_of_week: "Sunday", period: 1, teacher_id: "m", activity_type: "הוראה" },
    { day_of_week: "Sunday", period: 3, teacher_id: "m", activity_type: "הוראה" },
    { day_of_week: "Sunday", period: 5, teacher_id: "m", activity_type: "חלון" },
    { day_of_week: "Sunday", period: 2, teacher_id: "x", activity_type: "הוראה" },
  ];
  it("returns only periods the teacher actually teaches that day", () =>
    expect(teachingPeriods(slots, "m", "Sunday")).toEqual([1, 3]));
});

describe("findWholeDaySubstitutes", () => {
  const teachers = ["m", "a", "b", "c"].map(T);
  const slots: Slot[] = [
    // m teaches periods 1 and 3 on Sunday
    { day_of_week: "Sunday", period: 1, teacher_id: "m", activity_type: "הוראה" },
    { day_of_week: "Sunday", period: 3, teacher_id: "m", activity_type: "הוראה" },
    // a is free in שהייה in both periods
    { day_of_week: "Sunday", period: 1, teacher_id: "a", activity_type: "שהייה" },
    { day_of_week: "Sunday", period: 3, teacher_id: "a", activity_type: "שהייה" },
    // b is free in period 1 but teaches in period 3
    { day_of_week: "Sunday", period: 1, teacher_id: "b", activity_type: "פרטני" },
    { day_of_week: "Sunday", period: 3, teacher_id: "b", activity_type: "הוראה" },
    // c teaches in period 1, free in period 3
    { day_of_week: "Sunday", period: 1, teacher_id: "c", activity_type: "הוראה" },
    { day_of_week: "Sunday", period: 3, teacher_id: "c", activity_type: "פרטני" },
  ];
  const ids = findWholeDaySubstitutes(teachers, slots, "m", "Sunday").map((r) => r.teacher.id);
  it("only offers teachers free in שהייה/פרטני in every period the missing teacher teaches", () => expect(ids).toEqual(["a"]));
  it("returns no candidates when the missing teacher has no lessons that day", () =>
    expect(findWholeDaySubstitutes(teachers, [], "m", "Sunday")).toEqual([]));
});

describe("dayFromDate", () => {
  it("Saturday has no school", () => expect(dayFromDate("2026-10-10")).toBeNull());
  it("Friday is a school day", () => expect(dayFromDate("2026-10-09")).toBe("Friday"));
});

describe("availability", () => {
  const slots: Slot[] = [
    { day_of_week: "Sunday", period: 1, teacher_id: "m", activity_type: "הוראה" },
    { day_of_week: "Sunday", period: 1, teacher_id: "a", activity_type: "שהייה" },
    { day_of_week: "Sunday", period: 1, teacher_id: "b", activity_type: "שהייה" },
    { day_of_week: "Sunday", period: 1, teacher_id: "c", activity_type: "שהייה" },
  ];
  const teachers = [T("m"), { ...T("a"), no_substitute: true }, { ...T("b"), away_until: "2026-10-20" }, T("c")];
  it("management and away teachers are excluded until the date", () =>
    expect(findSubstitutes(teachers, slots, "m", "Sunday", 1, "2026-10-18").map((r) => r.teacher.id)).toEqual(["c"]));
  it("away teacher returns after the date", () =>
    expect(findSubstitutes(teachers, slots, "m", "Sunday", 1, "2026-10-25").map((r) => r.teacher.id).sort()).toEqual(["b", "c"]));
});
