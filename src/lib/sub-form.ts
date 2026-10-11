import type { Substitution } from "@/lib/school";

export const normalizeClassroom = (value?: string) =>
  (value ?? "").replace(/כיתה\s*/g, "").replace(/['"׳״\-\s]/g, "");

export function classroomAssignments(subs: Substitution[], date: string, classroom: string, period: number) {
  return subs.filter((sub) => sub.date === date && sub.status !== "בוטל" && sub.period === period &&
    normalizeClassroom(sub.class_room) === normalizeClassroom(classroom));
}