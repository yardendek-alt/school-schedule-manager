import { describe, it, expect } from "vitest";
import { busyOnDate, findSubstitutes, findWholeDaySubstitutes, teachingPeriods, dayFromDate, type Teacher, type Slot } from "@/lib/school";

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
    { day_of_week: "Sunday", period: 6, teacher_id: "m", activity_type: "שהייה" },
    { day_of_week: "Sunday", period: 7, teacher_id: "m", activity_type: "פרטני" },
    { day_of_week: "Sunday", period: 2, teacher_id: "x", activity_type: "הוראה" },
  ];
  it("returns only periods the teacher actually teaches that day", () =>
    expect(teachingPeriods(slots, "m", "Sunday")).toEqual([1, 3]));
});

describe("only teaching hours need coverage", () => {
  it.each(["שהייה", "פרטני"] as const)("does not offer replacements for an absent %s period", (activity_type) => {
    const slots: Slot[] = [
      { teacher_id: "m", day_of_week: "Sunday", period: 3, activity_type },
      { teacher_id: "a", day_of_week: "Sunday", period: 3, activity_type: "שהייה" },
    ];
    expect(findSubstitutes([T("m"), T("a")], slots, "m", "Sunday", 3)).toEqual([]);
    expect(findWholeDaySubstitutes([T("m"), T("a")], slots, "m", "Sunday")).toEqual([]);
  });
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

describe("multiple absences on the same date", () => {
  const teachers = ["m", "n", "a", "b"].map(T);
  const slots: Slot[] = [
    { day_of_week: "Sunday", period: 3, teacher_id: "m", activity_type: "הוראה" },
    { day_of_week: "Sunday", period: 3, teacher_id: "n", activity_type: "שהייה" },
    { day_of_week: "Sunday", period: 3, teacher_id: "a", activity_type: "שהייה" },
    { day_of_week: "Sunday", period: 3, teacher_id: "b", activity_type: "פרטני" },
  ];
  const sub = { id: "1", date: "2026-10-11", day: "Sunday" as const, period: 3, original_teacher_id: "x", substitute_teacher_id: "a", reason: "", status: "אושר" as const };
  it("absent teachers and already-booked substitutes are not offered", () =>
    expect(findSubstitutes(teachers, slots, "m", "Sunday", 3, "2026-10-11", busyOnDate([sub], "2026-10-11", ["n"])).map((r) => r.teacher.id)).toEqual(["b"]));
  it("booking on another date does not block", () =>
    expect(findSubstitutes(teachers, slots, "m", "Sunday", 3, "2026-10-12", busyOnDate([sub], "2026-10-12")).map((r) => r.teacher.id).sort()).toEqual(["a", "b", "n"]));
});

describe("covered teacher only busy at covered hours", () => {
  const sub = { id: "1", date: "2026-10-11", day: "Sunday" as const, period: 3, original_teacher_id: "x", substitute_teacher_id: "a", reason: "", status: "אושר" as const };
  const b = busyOnDate([sub], "2026-10-11");
  it("busy at hour 3", () => expect(b.has("x@3")).toBe(true));
  it("not busy all day", () => expect(b.has("x")).toBe(false));
});
