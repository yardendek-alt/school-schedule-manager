export type Day = "Sunday" | "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
export const DAYS: Day[] = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
export const DAY_HE: Record<Day, string> = {
  Sunday: "ראשון", Monday: "שני", Tuesday: "שלישי", Wednesday: "רביעי", Thursday: "חמישי", Friday: "שישי",
};
export const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];
export type Activity = "הוראה" | "שהייה" | "פרטני" | "חלון";

export interface Teacher {
  id: string; name: string; phone: string; subjects: string[]; max_weekly_hours: number; working_days: Day[];
}
export interface Slot {
  day_of_week: Day; period: number; teacher_id: string; activity_type: Activity; subject?: string; class_room?: string;
  substitute_for?: string;
}
export interface Substitution {
  id: string; date: string; day: Day; period: number; original_teacher_id: string; substitute_teacher_id: string;
  reason: string; status: "ממתין לאישור" | "אושר" | "בוטל"; subject?: string; class_room?: string;
}

export const TEACHERS: Teacher[] = [
  { id: "t1", name: "רחל כהן", phone: "050-1234567", subjects: ["מתמטיקה"], max_weekly_hours: 26, working_days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"] },
  { id: "t2", name: "יוסי לוי", phone: "052-2345678", subjects: ["מדעים", "ביולוגיה"], max_weekly_hours: 24, working_days: ["Sunday", "Monday", "Tuesday", "Thursday", "Friday"] },
  { id: "t3", name: "מיכל אברהם", phone: "054-3456789", subjects: ["אנגלית"], max_weekly_hours: 22, working_days: ["Sunday", "Tuesday", "Wednesday", "Thursday", "Friday"] },
  { id: "t4", name: "דוד מזרחי", phone: "053-4567890", subjects: ["היסטוריה", "אזרחות"], max_weekly_hours: 20, working_days: ["Monday", "Tuesday", "Wednesday", "Thursday"] },
  { id: "t5", name: "נועה פרץ", phone: "050-5678901", subjects: ["מתמטיקה", "פיזיקה"], max_weekly_hours: 28, working_days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] },
  { id: "t6", name: "אבי ביטון", phone: "058-6789012", subjects: ["חינוך גופני"], max_weekly_hours: 24, working_days: ["Sunday", "Monday", "Wednesday", "Thursday", "Friday"] },
  { id: "t7", name: "שירה גולן", phone: "052-7890123", subjects: ["עברית", "ספרות"], max_weekly_hours: 24, working_days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"] },
  { id: "t8", name: "עמית שפירא", phone: "054-8901234", subjects: ["מדעים", "כימיה"], max_weekly_hours: 22, working_days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Friday"] },
];

const CLASSES = ["ז'1", "ז'2", "ח'1", "ח'2", "ט'1", "ט'2"];

function rand(seed: number) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

export function buildSchedule(): Slot[] {
  const slots: Slot[] = [];
  TEACHERS.forEach((t, ti) => {
    const r = rand(ti * 97 + 13);
    DAYS.forEach((d) => {
      const working = t.working_days.includes(d);
      const maxP = d === "Friday" ? 5 : 8;
      PERIODS.forEach((p) => {
        if (!working || p > maxP) { slots.push({ day_of_week: d, period: p, teacher_id: t.id, activity_type: "חלון" }); return; }
        const x = r();
        let a: Activity = x < 0.6 ? "הוראה" : x < 0.75 ? "שהייה" : x < 0.87 ? "פרטני" : "חלון";
        const subject = t.subjects[Math.floor(r() * t.subjects.length)];
        slots.push({
          day_of_week: d, period: p, teacher_id: t.id, activity_type: a,
          subject: a === "חלון" ? undefined : subject,
          class_room: a === "הוראה" || a === "פרטני" ? `כיתה ${CLASSES[Math.floor(r() * CLASSES.length)]}` : undefined,
        });
      });
    });
  });
  return slots;
}

export function weeklyHours(slots: Slot[], tid: string) {
  return slots.filter((s) => s.teacher_id === tid && s.activity_type !== "חלון").length;
}

export interface Candidate {
  teacher: Teacher; status: Activity; subjectMatch: boolean; hours: number; underMax: boolean; score: number;
}

export function findSubstitutes(teachers: Teacher[], slots: Slot[], missingId: string, day: Day, period: number): Candidate[] {
  const missing = teachers.find((t) => t.id === missingId);
  const orig = slots.find((s) => s.teacher_id === missingId && s.day_of_week === day && s.period === period);
  const subj = orig?.subject;
  return teachers
    .filter((t) => t.id !== missingId && t.working_days.includes(day))
    .map((t) => {
      const s = slots.find((x) => x.teacher_id === t.id && x.day_of_week === day && x.period === period);
      return { t, status: (s?.activity_type ?? "חלון") as Activity };
    })
    .filter((c) => c.status !== "הוראה")
    .map(({ t, status }) => {
      const subjectMatch = subj ? t.subjects.includes(subj) : !!missing?.subjects.some((x) => t.subjects.includes(x));
      const hours = weeklyHours(slots, t.id);
      const underMax = hours < t.max_weekly_hours;
      const score = (subjectMatch ? 100 : 0) + (underMax ? 50 : 0) + (status === "חלון" ? 10 : status === "שהייה" ? 5 : 0) - hours * 0.1;
      return { teacher: t, status, subjectMatch, hours, underMax, score };
    })
    .sort((a, b) => b.score - a.score);
}

export function dayFromDate(date: string): Day | null {
  const d = new Date(date + "T12:00:00").getDay();
  return d === 6 ? null : DAYS[d];
}
