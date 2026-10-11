import { describe, it, expect } from "vitest";
import { findSubstitutes, dayFromDate, type Teacher, type Slot } from "@/lib/school";

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

describe("dayFromDate", () => {
  it("Saturday has no school", () => expect(dayFromDate("2026-10-10")).toBeNull());
  it("Friday is a school day", () => expect(dayFromDate("2026-10-09")).toBe("Friday"));
});
