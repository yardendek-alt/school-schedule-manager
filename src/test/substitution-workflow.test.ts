import { describe, expect, it } from "vitest";
import { currentSelections, planPeriods, workflowBusy, type AbsencePlan } from "@/lib/substitution-workflow";
import { findSubstitutes, type Slot, type Substitution, type Teacher } from "@/lib/school";

const plans: [AbsencePlan, AbsencePlan] = [
  { teacherId: "m", mode: "day", periods: [], reason: "מחלה" },
  { teacherId: "n", mode: "hours", periods: [3], reason: "מחלה" },
];
const slots: Slot[] = [
  { teacher_id: "m", day_of_week: "Sunday", period: 3, activity_type: "הוראה" },
  { teacher_id: "m", day_of_week: "Sunday", period: 4, activity_type: "הוראה" },
  { teacher_id: "n", day_of_week: "Sunday", period: 3, activity_type: "הוראה" },
  { teacher_id: "n", day_of_week: "Sunday", period: 4, activity_type: "שהייה" },
  { teacher_id: "a", day_of_week: "Sunday", period: 3, activity_type: "פרטני" },
  { teacher_id: "b", day_of_week: "Sunday", period: 3, activity_type: "שהייה" },
];
const sub: Substitution = { id: "one", date: "2026-10-11", day: "Sunday", period: 3, original_teacher_id: "m", substitute_teacher_id: "a", status: "אושר", reason: "" };
const teachers: Teacher[] = ["m", "n", "a", "b"].map((id) => ({ id, name: id, phone: "", subjects: [], working_days: ["Sunday"], max_weekly_hours: 36 }));

describe("planned substitution workflow", () => {
  it("respects full-day and selected-hour plans", () => {
    expect(planPeriods(plans[0], slots, "Sunday")).toEqual([3, 4]);
    expect(planPeriods(plans[1], slots, "Sunday")).toEqual([3]);
    const busy = workflowBusy([], sub.date, plans, plans[0], slots, "Sunday");
    expect(busy.has("m")).toBe(true);
    expect(busy.has("n@3")).toBe(true);
    expect(busy.has("n@4")).toBe(false);
  });
  it("keeps the existing selection eligible while editing its original teacher", () => {
    const busy = workflowBusy([sub], sub.date, plans, plans[0], slots, "Sunday");
    expect(findSubstitutes(teachers, slots, "m", "Sunday", 3, sub.date, busy).map((c) => c.teacher.id).sort()).toEqual(["a", "b"]);
    expect(currentSelections([sub], sub.date, "m", [3])).toEqual({ 3: "a" });
  });
  it("blocks a saved substitute for the next teacher at that hour only on that date", () => {
    const busy = workflowBusy([sub], sub.date, plans, plans[1], slots, "Sunday");
    expect(findSubstitutes(teachers, slots, "n", "Sunday", 3, sub.date, busy).map((c) => c.teacher.id)).toEqual(["b"]);
    expect(workflowBusy([sub], "2026-10-18", plans, plans[1], slots, "Sunday").has("a@3")).toBe(false);
  });
});