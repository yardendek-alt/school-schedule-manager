import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Save, X, Undo2 } from "lucide-react";
import { DAYS, DAY_HE, PERIODS, type Activity, type Day, type Slot, type Teacher } from "@/lib/school";
import { saveTeacherSchedule } from "@/lib/school-db";

const BADGE: Record<Activity, string> = {
  "הוראה": "bg-teach text-teach-foreground border-teach-border",
  "שהייה": "bg-prep text-prep-foreground border-prep-border",
  "פרטני": "bg-indiv text-indiv-foreground border-indiv-border",
  "חלון": "bg-muted text-muted-foreground border-border",
};
const ACTS: Activity[] = ["הוראה", "שהייה", "פרטני", "חלון"];
const key = (d: Day, p: number) => `${d}-${p}`;

export function ScheduleEditor({ teacher, base, onDone, onSaved }: {
  teacher: Teacher; base: Slot[]; onDone: () => void; onSaved: () => Promise<void>;
}) {
  const initial = useMemo(() => {
    const m: Record<string, Slot> = {};
    base.filter((s) => s.teacher_id === teacher.id).forEach((s) => { m[key(s.day_of_week, s.period)] = { ...s }; });
    return m;
  }, [base, teacher.id]);
  const [cells, setCells] = useState<Record<string, Slot>>(initial);
  const [days, setDays] = useState<Day[]>(teacher.working_days);
  const [edit, setEdit] = useState<{ d: Day; p: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const rooms = useMemo(() => Array.from(new Set(base.map((s) => s.class_room).filter(Boolean) as string[])).sort(), [base]);

  const same = (a?: Slot, b?: Slot) => (a?.activity_type ?? "חלון") === (b?.activity_type ?? "חלון") && (a?.class_room ?? "") === (b?.class_room ?? "") && (a?.subject ?? "") === (b?.subject ?? "");
  const changed = Object.keys({ ...initial, ...cells }).filter((k) => !same(initial[k], cells[k]));
  const dirty = changed.length > 0 || days.join() !== teacher.working_days.join();

  const setCell = (d: Day, p: number, patch: Partial<Slot>) => setCells((c) => {
    const cur = c[key(d, p)] ?? { day_of_week: d, period: p, teacher_id: teacher.id, activity_type: "חלון" as Activity };
    const next = { ...cur, ...patch };
    if (next.activity_type !== "הוראה") { next.class_room = undefined; next.subject = undefined; }
    return { ...c, [key(d, p)]: next };
  });

  const save = async () => {
    setSaving(true);
    try {
      const all = Object.values(cells).filter((s) => s.activity_type !== "חלון");
      const wd = DAYS.filter((d) => days.includes(d) || all.some((s) => s.day_of_week === d));
      await saveTeacherSchedule(teacher.id, all, wd);
      await onSaved();
      toast.success("מערכת השעות נשמרה");
      onDone();
    } catch { toast.error("השמירה נכשלה"); }
    setSaving(false);
  };

  const cur = edit ? cells[key(edit.d, edit.p)] : undefined;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
        <span className="font-medium">ימי עבודה:</span>
        {DAYS.map((d) => (
          <button key={d} onClick={() => setDays((x) => x.includes(d) ? x.filter((y) => y !== d) : [...x, d])}
            className={`rounded px-2 py-1 text-xs ${days.includes(d) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground line-through"}`}>{DAY_HE[d]}</button>
        ))}
        <div className="ms-auto flex gap-2">
          <span className="self-center text-xs text-muted-foreground">{changed.length} שינויים</span>
          <button className="btn-ghost" onClick={() => setCells(initial)} disabled={!dirty}><Undo2 className="h-4 w-4" />איפוס</button>
          <button className="btn-ghost" onClick={onDone}><X className="h-4 w-4" />ביטול</button>
          <button className="btn-primary" onClick={save} disabled={!dirty || saving}><Save className="h-4 w-4" />{saving ? "שומר…" : "שמירת שינויים"}</button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">לחצו על משבצת כדי לשנות אותה. משבצות שנערכו מסומנות במסגרת.</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-separate border-spacing-1 text-sm">
          <thead><tr><th className="w-20"></th>{DAYS.map((d) => <th key={d} className="font-medium text-muted-foreground">יום {DAY_HE[d]}</th>)}</tr></thead>
          <tbody>{PERIODS.map((p) => (
            <tr key={p}><td className="font-medium">שעה {p}</td>
              {DAYS.map((d) => {
                const s = cells[key(d, p)]; const a = s?.activity_type ?? "חלון";
                const mod = !same(initial[key(d, p)], s);
                return <td key={d}>
                  <button onClick={() => setEdit({ d, p })}
                    className={`h-14 w-full rounded-md border p-1 text-start text-xs ${a === "חלון" ? "border-dashed bg-muted/40 text-muted-foreground" : BADGE[a]} ${mod ? "ring-2 ring-primary" : ""} hover:opacity-80`}>
                    <div className="font-semibold">{a === "חלון" ? "+" : a}</div>
                    {s?.class_room && <div>{s.class_room}</div>}
                  </button>
                </td>;
              })}
            </tr>))}</tbody>
        </table>
      </div>

      {edit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" onClick={() => setEdit(null)}>
          <div className="w-full max-w-sm space-y-4 rounded-xl border bg-card p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold">{teacher.name} · יום {DAY_HE[edit.d]} · שעה {edit.p}</h3>
            <div className="grid grid-cols-2 gap-2">
              {ACTS.map((a) => (
                <button key={a} onClick={() => setCell(edit.d, edit.p, { activity_type: a })}
                  className={`rounded-md border px-3 py-2 text-sm font-medium ${BADGE[a]} ${(cur?.activity_type ?? "חלון") === a ? "ring-2 ring-primary" : "opacity-70"}`}>{a === "חלון" ? "חלון / פנוי" : a}</button>
              ))}
            </div>
            {cur?.activity_type === "הוראה" && (
              <div className="space-y-2 text-sm">
                <label className="flex flex-col gap-1">כיתה
                  <input list="rooms" className="input" value={cur.class_room ?? ""} onChange={(e) => setCell(edit.d, edit.p, { class_room: e.target.value })} />
                  <datalist id="rooms">{rooms.map((r) => <option key={r} value={r} />)}</datalist>
                </label>
                <label className="flex flex-col gap-1">מקצוע
                  <input className="input" value={cur.subject ?? ""} placeholder="הוראה כוללת" onChange={(e) => setCell(edit.d, edit.p, { subject: e.target.value })} />
                </label>
              </div>
            )}
            <button className="btn-primary w-full justify-center" onClick={() => setEdit(null)}>אישור</button>
          </div>
        </div>
      )}
    </div>
  );
}
