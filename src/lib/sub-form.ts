import type { Day, Slot, Substitution, Teacher } from "@/lib/school";
import { planPeriods, type AbsencePlan } from "@/lib/substitution-workflow";

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

// Printed form uses single-letter marks: ש = שהייה, פ = פרטני
export function activityShortLabel(activity?: "שהייה" | "פרטני"): string {
  return activity === "פרטני" ? "פ" : activity === "שהייה" ? "ש" : "";
}

// Dedicated substitutes (no own class) are marked with a מ"מ suffix: אולגה-מ"מ
export function substituteFormLabel(sub: Substitution, teachers: Teacher[], baseSlots: Slot[]): string {
  const teacher = teachers.find((t) => t.id === sub.substitute_teacher_id);
  if (teacher?.dedicated_substitute) return `${teacher.name}-מ"מ`;
  const short = activityShortLabel(substituteOriginalActivity(sub, baseSlots));
  return `${teacher?.name ?? ""}${short ? ` (${short})` : ""}`;
}

export function plannedFormData(plans: AbsencePlan[], baseSlots: Slot[], subs: Substitution[], date: string, day: Day) {
  const plannedSlots = plans.flatMap((plan) => {
    const periods = planPeriods(plan, baseSlots, day);
    return baseSlots.filter((slot) => slot.teacher_id === plan.teacherId && slot.day_of_week === day &&
      slot.activity_type === "הוראה" && periods.includes(slot.period));
  });
  const assignments = subs.filter((sub) => sub.date === date && sub.status !== "בוטל" &&
    plannedSlots.some((slot) => slot.teacher_id === sub.original_teacher_id && slot.period === sub.period &&
      normalizeClassroom(slot.class_room) === normalizeClassroom(sub.class_room)));
  const uncovered = plannedSlots.filter((slot) => !assignments.some((sub) =>
    sub.original_teacher_id === slot.teacher_id && sub.period === slot.period &&
    normalizeClassroom(sub.class_room) === normalizeClassroom(slot.class_room)));
  return { assignments, uncovered, missingTeacherIds: [...new Set(plans.map((plan) => plan.teacherId))] };
}