import { busyOnDate, teachingPeriods, type Day, type Slot, type Substitution } from "@/lib/school";

export interface AbsencePlan {
  teacherId: string;
  mode: "day" | "hours";
  periods: number[];
  reason: string;
}

export function planPeriods(plan: AbsencePlan, slots: Slot[], day: Day) {
  const teaching = teachingPeriods(slots, plan.teacherId, day);
  return plan.mode === "day" ? teaching : teaching.filter((p) => plan.periods.includes(p));
}

export function workflowBusy(subs: Substitution[], date: string, plans: AbsencePlan[], current: AbsencePlan, slots: Slot[], day: Day) {
  const periods = planPeriods(current, slots, day);
  const busy = busyOnDate(subs.filter((s) => !(s.date === date && s.original_teacher_id === current.teacherId && periods.includes(s.period))), date);
  for (const plan of plans) {
    if (plan.mode === "day") busy.add(plan.teacherId);
    else for (const p of planPeriods(plan, slots, day)) busy.add(`${plan.teacherId}@${p}`);
  }
  return busy;
}

export function currentSelections(subs: Substitution[], date: string, teacherId: string, periods: number[]) {
  return Object.fromEntries(subs.filter((s) => s.date === date && s.original_teacher_id === teacherId && s.status !== "בוטל" && periods.includes(s.period))
    .map((s) => [s.period, s.substitute_teacher_id])) as Record<number, string>;
}