import { Fragment } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DAY_HE, type Day, type Slot, type Substitution, type Teacher } from "@/lib/school";
import { classroomAssignments, normalizeClassroom as norm, plannedFormData, substituteFormLabel } from "@/lib/sub-form";
import type { AbsencePlan } from "@/lib/substitution-workflow";

// Columns follow the school's printed "מ"מ מורות" form (class + homeroom teacher)
const CLASSES = [
  ["א'1", "יעל"], ["א'2", "נוי"], ["ב'1", "טניה"], ["ב'2", "ימית"], ["ג'1", "עדי דהן"], ["ג'2", "שמואל"],
  ["ג'3", "גלית"], ["ד'1", "רות"], ["ד'2", "ימית קינדה"], ["ה'1", "אוקסנה"], ["ה'2", "טל"], ["ה'3", "זוהרה"],
  ["ו'1", "איילת"], ["ט'1", "אסתי"], ['י"ב1', "דורית"],
] as const;
const LEAD_UNTIL = 13; // Lead label spans שיעור 8–10 as one merged cell per class.

export function SubForm({ date, day, subs, teachers, baseSlots, plans }: { date: string; day: Day; subs: Substitution[]; teachers: Teacher[]; baseSlots: Slot[]; plans: AbsencePlan[] }) {
  const name = (id: string) => teachers.find((t) => t.id === id)?.name ?? "";
  const replacementLabel = (sub: Substitution) => substituteFormLabel(sub, teachers, baseSlots);
  const { assignments: list, uncovered, missingTeacherIds: missing } = plannedFormData(plans, baseSlots, subs, date, day);
  const noClass = list.filter((s) => !CLASSES.some(([c]) => norm(c) === norm(s.class_room)));
  const [y, m, d] = date.split("-");

  return (
    <div className="rounded-xl border bg-card p-4 print-area">
      <div className="mb-3 flex items-center justify-between no-print">
        <h2 className="text-lg font-bold">טופס מ"מ מורות</h2>
        <Button size="sm" onClick={() => window.print()}><Printer className="h-4 w-4" />הדפס</Button>
      </div>
      <div className="mb-3 text-center">
        <div className="text-lg font-bold underline">צוות הוראה</div>
        <div className="mt-1 font-semibold">יום: {DAY_HE[day]} &nbsp;&nbsp; תאריך: {d}/{m}/{y}</div>
      </div>
      <div className="overflow-x-auto">
        <table className="sub-form-table w-full min-w-[1040px] table-fixed border-collapse text-center text-xs print:min-w-0">
          <thead>
            <tr>
              <th className="border border-foreground/60 p-0"><div className="sub-form-cell flex items-center justify-center">תשפ"ז</div></th>
              {CLASSES.map(([c, t]) => <th key={c} className="border border-foreground/60 p-0"><div className="sub-form-cell flex flex-col justify-center"><div>{c}</div><div>{t}</div></div></th>)}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((p) => (
              <tr key={p}>
                <th className="whitespace-nowrap border border-foreground/60 p-0"><div className="sub-form-cell flex items-center justify-center">שיעור {p}</div></th>
                {CLASSES.map(([c], ci) => {
                  if (p >= 8 && p <= 10 && ci < LEAD_UNTIL) {
                    if (p !== 8) return null;
                    return <td key={c} rowSpan={3} className="border border-foreground/60 p-0" aria-label={`${c} שיעורים 8-10`}>
                      <div className="sub-form-cell flex h-full flex-col items-center justify-center gap-0.5">
                        <div>{c === "ד'1" ? "מוביל" : "מובילה"}</div>
                        {[8, 9, 10].map((lp) => (
                          <Fragment key={lp}>
                            {classroomAssignments(list, date, c, lp).map((sub) => <div key={sub.id} className="w-full break-words font-semibold text-primary">{replacementLabel(sub)}</div>)}
                            {uncovered.some((slot) => slot.period === lp && norm(slot.class_room) === norm(c)) && <div className="text-base text-destructive">מ"מ</div>}
                          </Fragment>
                        ))}
                      </div>
                    </td>;
                  }
                  const replacements = classroomAssignments(list, date, c, p);
                  const needsSubstitute = uncovered.some((slot) => slot.period === p && norm(slot.class_room) === norm(c));
                  return <td key={c} className="border border-foreground/60 p-0" aria-label={`${c} שיעור ${p}`}>
                    <div className="sub-form-cell flex flex-col items-center justify-center gap-0.5">
                      {replacements.map((sub) => <div key={sub.id} className="w-full break-words font-semibold text-primary">{replacementLabel(sub)}</div>)}
                      {needsSubstitute && <div className="text-base text-destructive">מ"מ</div>}
                    </div>
                  </td>;
                })}
              </tr>
            ))}
            <tr>
              <td colSpan={CLASSES.length + 1} className="border border-foreground/60 p-2 text-right text-lg">
                <span className="font-bold">צוות הוראה חסר: </span>
                {missing.map((id) => <span key={id} className="ml-3">{name(id)}</span>)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {(noClass.length > 0 || uncovered.some((slot) => !CLASSES.some(([c]) => norm(c) === norm(slot.class_room)))) && (
        <div className="mt-2 text-xs text-muted-foreground">
          {noClass.length > 0 && <div>שיבוצים ללא כיתה בטופס: {noClass.map((s) => `${replacementLabel(s)} במקום ${name(s.original_teacher_id)} (שיעור ${s.period}${s.class_room ? `, ${s.class_room}` : ""})`).join(" · ")}</div>}
          {uncovered.filter((slot) => !CLASSES.some(([c]) => norm(c) === norm(slot.class_room))).map((slot, i) => <div key={i} className="text-destructive">מ"מ — {name(slot.teacher_id)}, שיעור {slot.period}{slot.class_room ? `, ${slot.class_room}` : ""}</div>)}
        </div>
      )}
    </div>
  );
}
