import { Printer } from "lucide-react";
import { DAY_HE, type Day, type Substitution, type Teacher } from "@/lib/school";
import { classroomAssignments, normalizeClassroom as norm } from "@/lib/sub-form";

// Columns follow the school's printed "מ"מ מורות" form (class + homeroom teacher)
const CLASSES = [
  ["א'1", "יעל"], ["א'2", "נוי"], ["ב'1", "טניה"], ["ב'2", "ימית"], ["ג'1", "עדי דהן"], ["ג'2", "שמואל"],
  ["ג'3", "גלית"], ["ד'1", "רות"], ["ד'2", "ימית קינדה"], ["ה'1", "אוקסנה"], ["ה'2", "טל"], ["ה'3", "זוהרה"],
  ["ו'1", "איילת"], ["ט'1", "אסתי"], ['י"ב1', "דורית"],
] as const;
const LEAD_UNTIL = 13; // first 13 classes have "מובילה" in hours 8–10

export function SubForm({ date, day, subs, teachers }: { date: string; day: Day; subs: Substitution[]; teachers: Teacher[] }) {
  const name = (id: string) => teachers.find((t) => t.id === id)?.name ?? "";
  const list = subs.filter((s) => s.date === date && s.status !== "בוטל");
  const cell = (cls: string, p: number) =>
    classroomAssignments(list, date, cls, p).map((s) => name(s.substitute_teacher_id)).join(", ");
  const noClass = list.filter((s) => !CLASSES.some(([c]) => norm(c) === norm(s.class_room)));
  const missing = Array.from(new Set(list.map((s) => s.original_teacher_id)));
  const [y, m, d] = date.split("-");

  return (
    <div className="rounded-xl border bg-card p-4 print-area">
      <div className="mb-3 flex items-center justify-between no-print">
        <h2 className="text-lg font-bold">טופס מ"מ מורות</h2>
        <button className="btn-primary flex items-center gap-1 text-sm" onClick={() => window.print()}><Printer className="h-4 w-4" />הדפס</button>
      </div>
      <div className="mb-3 text-center">
        <div className="text-lg font-bold underline">צוות הוראה</div>
        <div className="mt-1 font-semibold">יום: {DAY_HE[day]} &nbsp;&nbsp; תאריך: {d}/{m}/{y}</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-center text-xs">
          <thead>
            <tr>
              <th className="border border-foreground/60 p-1">תשפ"ז</th>
              {CLASSES.map(([c, t]) => <th key={c} className="border border-foreground/60 p-1"><div>{c}</div><div>{t}</div></th>)}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((p) => (
              <tr key={p}>
                <th className="whitespace-nowrap border border-foreground/60 p-1">שיעור {p}</th>
                {CLASSES.map(([c], ci) => {
                  if (p >= 8 && ci < LEAD_UNTIL) {
                    if (p > 8) return null;
                    return <td key={c} rowSpan={3} className="border border-foreground/60 p-1">
                      <div>{c === "ד'1" ? "מוביל" : "מובילה"}</div>
                      {[8, 9, 10].map((q) => {
                        const replacement = cell(c, q);
                        return replacement ? <div key={q} className="mt-1 font-semibold text-primary">שיעור {q}: {replacement}</div> : null;
                      })}
                    </td>;
                  }
                  return <td key={c} className="h-7 border border-foreground/60 p-1 font-semibold text-primary">{cell(c, p)}</td>;
                })}
              </tr>
            ))}
            <tr>
              <td colSpan={CLASSES.length + 1} className="border border-foreground/60 p-2 text-right text-sm">
                <span className="font-bold">צוות הוראה חסר: </span>
                {missing.map((id) => {
                  const ps = list.filter((s) => s.original_teacher_id === id).map((s) => s.period).sort((a, b) => a - b);
                  return <span key={id} className="ml-3">{name(id)} (שיעורים {ps.join(", ")})</span>;
                })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {noClass.length > 0 && (
        <div className="mt-2 text-xs text-muted-foreground">
          שיבוצים ללא כיתה בטופס: {noClass.map((s) => `${name(s.substitute_teacher_id)} במקום ${name(s.original_teacher_id)} (שיעור ${s.period}${s.class_room ? `, ${s.class_room}` : ""})`).join(" · ")}
        </div>
      )}
    </div>
  );
}
