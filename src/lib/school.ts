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
  teacher: Teacher; status: Activity; subjectMatch: boolean; hours: number; underMax: boolean; score: number;
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

export function dayFromDate(date: string): Day | null {
  const d = new Date(date + "T12:00:00").getDay();
  return d === 6 ? null : (DAYS[d] ?? null);
}
