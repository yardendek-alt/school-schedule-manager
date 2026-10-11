import { supabase } from "@/integrations/supabase/client";
import { setTeachers, type Activity, type Day, type Slot, type Substitution, type Teacher } from "./school";

export function applySub(slots: Slot[], sub: Substitution): Slot[] {
  if (sub.status === "בוטל") return slots;
  const { day, period } = sub;
  const orig = slots.find((s) => s.teacher_id === sub.original_teacher_id && s.day_of_week === day && s.period === period);
  const base = { day_of_week: day, period };
  const next = slots.filter((s) => !(s.day_of_week === day && s.period === period && (s.teacher_id === sub.substitute_teacher_id || s.teacher_id === sub.original_teacher_id)));
  next.push({ ...base, teacher_id: sub.substitute_teacher_id, activity_type: "הוראה", subject: sub.subject ?? orig?.subject, class_room: sub.class_room ?? orig?.class_room, substitute_for: sub.original_teacher_id });
  next.push({ ...base, teacher_id: sub.original_teacher_id, activity_type: "חלון" });
  return next;
}

export async function loadAll() {
  const [t, s, u] = await Promise.all([
    supabase.from("teachers").select("*").order("name"),
    supabase.from("schedule_slots").select("*").limit(5000),
    supabase.from("substitutions").select("*").order("created_at", { ascending: false }),
  ]);
  if (t.error || s.error || u.error) throw t.error ?? s.error ?? u.error;
  const teachers: Teacher[] = t.data.map((r) => ({ id: r.id, name: r.name, phone: r.phone, subjects: r.subjects, max_weekly_hours: r.max_weekly_hours, working_days: r.working_days as Day[], no_substitute: r.no_substitute, away_until: r.away_until, away_reason: r.away_reason }));
  setTeachers(teachers);
  const base: Slot[] = s.data.map((r) => ({ day_of_week: r.day_of_week as Day, period: r.period, teacher_id: r.teacher_id, activity_type: r.activity_type as Activity, subject: r.subject ?? undefined, class_room: r.class_room ?? undefined }));
  let slots = base;
  const subs: Substitution[] = u.data.map((r) => ({ id: r.id, date: r.date, day: r.day_of_week as Day, period: r.period, original_teacher_id: r.original_teacher_id, substitute_teacher_id: r.substitute_teacher_id, reason: r.reason, status: r.status as Substitution["status"], subject: r.subject ?? undefined, class_room: r.class_room ?? undefined }));
  [...subs].reverse().forEach((x) => { slots = applySub(slots, x); });
  return { teachers, slots, base, subs };
}

export async function saveSub(s: Substitution) {
  const { error } = await supabase.from("substitutions").insert({ id: s.id, date: s.date, day_of_week: s.day, period: s.period, original_teacher_id: s.original_teacher_id, substitute_teacher_id: s.substitute_teacher_id, reason: s.reason, status: s.status, subject: s.subject ?? null, class_room: s.class_room ?? null });
  if (error) throw error;
}

export async function saveStatus(id: string, status: Substitution["status"]) {
  await supabase.from("substitutions").update({ status }).eq("id", id);
}

export async function saveAway(id: string, away_until: string | null, away_reason: string) {
  const { error } = await supabase.from("teachers").update({ away_until, away_reason }).eq("id", id);
  if (error) throw error;
}
