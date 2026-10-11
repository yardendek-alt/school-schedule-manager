import { describe, expect, it } from "vitest";
import { classroomAssignments } from "@/lib/sub-form";
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