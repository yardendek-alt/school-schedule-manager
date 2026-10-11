import { describe, expect, it } from "vitest";
import { classroomAssignments, plannedFormData, substituteOriginalActivity } from "@/lib/sub-form";
import type { Substitution } from "@/lib/school";

const assignment: Substitution = {
  id: "replacement", date: "2026-10-12", day: "Monday", period: 3,
  original_teacher_id: "mazal", substitute_teacher_id: "yael", class_room: "א1",
  reason: "", status: "אושר",
};

describe("daily form classroom placement", () => {
  it("places Yael covering Mazal in grade א1 at the assigned period", () => {
    expect(classroomAssignments([assignment], "2026-10-12", "א'1", 3).map((s) => s.substitute_teacher_id)).toEqual(["yael"]);
    expect(classroomAssignments([assignment], "2026-10-12", "א'2", 3)).toEqual([]);
    expect(classroomAssignments([assignment], "2026-10-12", "א'1", 4)).toEqual([]);
    expect(classroomAssignments([assignment], "2026-10-13", "א'1", 3)).toEqual([]);
  });
  it("matches classroom prefixes and Hebrew punctuation", () => {
    expect(classroomAssignments([{ ...assignment, class_room: "כיתה א׳1" }], "2026-10-12", "א'1", 3)).toHaveLength(1);
  });
});

describe("substitute's original activity", () => {
  it.each(["שהייה", "פרטני"] as const)("returns %s from the original weekly slot", (activity_type) => {
    expect(substituteOriginalActivity(assignment, [
      { teacher_id: "yael", day_of_week: "Monday", period: 2, activity_type: "הוראה" },
      { teacher_id: "yael", day_of_week: "Tuesday", period: 3, activity_type: "הוראה" },
      { teacher_id: "yael", day_of_week: "Monday", period: 3, activity_type },
    ])).toBe(activity_type);
  });
});

describe("explicit daily absence plans", () => {
  const plans = [{ teacherId: "mazal", mode: "hours" as const, periods: [3, 4], reason: "מחלה" }];
  const slots = [3, 4, 5].map((period) => ({ teacher_id: "mazal", day_of_week: "Monday" as const,
    period, activity_type: "הוראה" as const, class_room: "כיתה א׳1" }));

  it("lists only explicitly chosen teachers, including those without any substitute", () => {
    const data = plannedFormData(plans, slots, [{ ...assignment, original_teacher_id: "temporary-away" }], assignment.date, "Monday");
    expect(data.missingTeacherIds).toEqual(["mazal"]);
    expect(data.assignments).toEqual([]);
    expect(data.uncovered.map((slot) => slot.period)).toEqual([3, 4]);
  });

  it("locates uncovered teaching hours by planned classroom and period", () => {
    const data = plannedFormData(plans, slots, [assignment], assignment.date, "Monday");
    expect(data.assignments.map((sub) => sub.id)).toEqual(["replacement"]);
    expect(data.uncovered.map((slot) => [slot.class_room, slot.period])).toEqual([["כיתה א׳1", 4]]);
  });

  it("does not count canceled or other-date assignments as coverage", () => {
    const data = plannedFormData(plans, slots, [{ ...assignment, status: "בוטל" },
      { ...assignment, id: "tomorrow", date: "2026-10-13", period: 4 }], assignment.date, "Monday");
    expect(data.uncovered.map((slot) => slot.period)).toEqual([3, 4]);
  });

  it("requires coverage only for teaching hours, not prep or individual activity", () => {
    const data = plannedFormData([{ teacherId: "mazal", mode: "day", periods: [], reason: "מחלה" }],
      slots.map((slot) => ({ ...slot, activity_type: slot.period === 3 ? "הוראה" : slot.period === 4 ? "שהייה" : "פרטני" })),
      [], assignment.date, "Monday");
    expect(data.uncovered.map((slot) => slot.period)).toEqual([3]);
  });
});