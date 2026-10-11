import type { Slot, Substitution } from "@/lib/school";

export const normalizeClassroom = (value?: string) =>
  (value ?? "").replace(/כיתה\s*/g, "").replace(/['"׳״\-\s]/g, "");

export function classroomAssignments(subs: Substitution[], date: string, classroom: string, period: number) {
  return subs.filter((sub) => sub.date === date && sub.status !== "בוטל" && sub.period === period &&
    normalizeClassroom(sub.class_room) === normalizeClassroom(classroom));
}

export function substituteOriginalActivity(sub: Substitution, baseSlots: Slot[]): "שהייה" | "פרטני" | undefined {
  const activity = baseSlots.find((s) => s.teacher_id === sub.substitute_teacher_id &&
    s.day_of_week === sub.day && s.period === sub.period)?.activity_type;
  return activity === "שהייה" || activity === "פרטני" ? activity : undefined;
}