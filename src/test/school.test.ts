import { describe, it, expect } from "vitest";
import { findSubstitutes, type Teacher, type Slot } from "@/lib/school";

const T = (id: string, subjects: string[], days: any[] = ["Sunday"], max = 10): Teacher => ({ id, name: id, phone: "", subjects, max_weekly_hours: max, working_days: days });

describe("findSubstitutes", () => {
  const teachers = [T("m", ["מתמטיקה"]), T("a", ["מתמטיקה"]), T("b", ["אנגלית"]), T("c", ["מתמטיקה"], ["Monday"]), T("d", ["מתמטיקה"])];
  const slots: Slot[] = [
    { day_of_week: "Sunday", period: 1, teacher_id: "m", activity_type: "הוראה", subject: "מתמטיקה" },
    { day_of_week: "Sunday", period: 1, teacher_id: "a", activity_type: "שהייה" },
    { day_of_week: "Sunday", period: 1, teacher_id: "b", activity_type: "חלון" },
    { day_of_week: "Sunday", period: 1, teacher_id: "d", activity_type: "הוראה" },
  ];
  const res = findSubstitutes(teachers, slots, "m", "Sunday", 1);
  it("excludes teachers not working that day", () => expect(res.find((r) => r.teacher.id === "c")).toBeUndefined());
  it("excludes teachers who are teaching", () => expect(res.find((r) => r.teacher.id === "d")).toBeUndefined());
  it("ranks subject match first", () => expect(res[0]?.teacher.id).toBe("a"));
});
