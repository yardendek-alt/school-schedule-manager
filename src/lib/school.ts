export type Day = "Sunday" | "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
export const DAYS: Day[] = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
export const DAY_HE: Record<Day, string> = {
  Sunday: "ראשון", Monday: "שני", Tuesday: "שלישי", Wednesday: "רביעי", Thursday: "חמישי", Friday: "שישי",
};
export const PERIODS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
export type Activity = "הוראה" | "שהייה" | "פרטני" | "חלון";

export interface Teacher {
  id: string; name: string; phone: string; subjects: string[]; max_weekly_hours: number; working_days: Day[];
}
export interface Slot {
  day_of_week: Day; period: number; teacher_id: string; activity_type: Activity; subject?: string | undefined; class_room?: string | undefined;
  substitute_for?: string | undefined;
}
export interface Substitution {
  id: string; date: string; day: Day; period: number; original_teacher_id: string; substitute_teacher_id: string;
  reason: string; status: "ממתין לאישור" | "אושר" | "בוטל"; subject?: string | undefined; class_room?: string | undefined;
}

export let TEACHERS: Teacher[] = [];
export function setTeachers(t: Teacher[]) { TEACHERS = t; }

export function weeklyHours(slots: Slot[], tid: string) {
  return slots.filter((s) => s.teacher_id === tid && s.activity_type !== "חלון").length;
}

export interface Candidate {
  teacher: Teacher; status: Activity; statuses?: Activity[]; subjectMatch: boolean; hours: number; underMax: boolean; score: number;
}

// Only teachers who are in שהייה or פרטני at that exact period can substitute; any teacher can cover any lesson.
export function findSubstitutes(teachers: Teacher[], slots: Slot[], missingId: string, day: Day, period: number): Candidate[] {
  return teachers
    .filter((t) => t.id !== missingId)
    .map((t) => ({ t, s: slots.find((x) => x.teacher_id === t.id && x.day_of_week === day && x.period === period) }))
    .filter(({ s }) => s && !s.substitute_for && (s.activity_type === "שהייה" || s.activity_type === "פרטני"))
    .map(({ t, s }) => {
      const hours = weeklyHours(slots, t.id);
      const status = s!.activity_type;
      const underMax = hours < t.max_weekly_hours;
      const score = (underMax ? 50 : 0) + (status === "שהייה" ? 5 : 0) - hours * 0.1;
      return { teacher: t, status, subjectMatch: true, hours, underMax, score };
    })
    .sort((a, b) => b.score - a.score);
}

// השעות שבהן המורה החסר/ה מלמד/ת (יש לו/לה שיעור) באותו יום
export function teachingPeriods(slots: Slot[], teacherId: string, day: Day): number[] {
  return PERIODS.filter((p) => {
    const s = slots.find((x) => x.teacher_id === teacherId && x.day_of_week === day && x.period === p);
    return !!s && s.activity_type !== "חלון";
  });
}

// ממלאי מקום שפנויים (שהייה/פרטני) בכל השעות שבהן המורה החסר/ה מלמד/ת באותו יום
export function findWholeDaySubstitutes(teachers: Teacher[], slots: Slot[], missingId: string, day: Day): Candidate[] {
  const ps = teachingPeriods(slots, missingId, day);
  if (!ps.length) return [];
  return teachers
    .filter((t) => t.id !== missingId)
    .map((t) => {
      const cells = ps.map((p) => ({ p, s: slots.find((x) => x.teacher_id === t.id && x.day_of_week === day && x.period === p) }));
      const ok = cells.every(({ s }) => s && !s.substitute_for && (s.activity_type === "שהייה" || s.activity_type === "פרטני"));
      if (!ok) return null;
      const hours = weeklyHours(slots, t.id);
      const statuses = Array.from(new Set(cells.map((c) => c.s!.activity_type)));
      const underMax = hours < t.max_weekly_hours;
      const score = (underMax ? 50 : 0) + (statuses.includes("שהייה") ? 5 : 0) - hours * 0.1 + ps.length;
      return { teacher: t, status: statuses[0]!, statuses, subjectMatch: true, hours, underMax, score };
    })
    .filter((x): x is Candidate => x !== null)
    .sort((a, b) => b.score - a.score);
}

export function dayFromDate(date: string): Day | null {
  const d = new Date(date + "T12:00:00").getDay();
  return d === 6 ? null : (DAYS[d] ?? null);
}
