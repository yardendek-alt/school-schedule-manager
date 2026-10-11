import { describe, expect, it } from "vitest";
import { classroomAssignments, substituteOriginalActivity } from "@/lib/sub-form";
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