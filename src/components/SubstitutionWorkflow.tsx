import { useState } from "react";
import { ArrowLeft, Check, CheckCircle2, Pencil, Plus, Trash2, UserSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubForm } from "@/components/SubForm";
import { DAY_HE, dayFromDate, findSubstitutes, type Day, type Slot, type Substitution, type Teacher } from "@/lib/school";
import { currentSelections, planPeriods, workflowBusy, type AbsencePlan } from "@/lib/substitution-workflow";

interface Props {
  slots: Slot[]; teachers: Teacher[]; subs: Substitution[];
  onSave: (date: string, day: Day, plan: AbsencePlan, choices: Record<number, string>) => Promise<void>;
}

export function SubstitutionWorkflow({ slots, teachers, subs, onSave }: Props) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const day = dayFromDate(date);
  const [plans, setPlans] = useState<AbsencePlan[]>([]);
  const [stage, setStage] = useState<"plan" | "match" | "done">("plan");
  const [active, setActive] = useState(0);
  const [completed, setCompleted] = useState<string[]>([]);
  const [choices, setChoices] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const name = (id: string) => teachers.find((t) => t.id === id)?.name ?? "";
  const updatePlan = (id: string, update: Partial<AbsencePlan>) => setPlans((prev) => prev.map((p) => p.teacherId === id ? { ...p, ...update } : p));
  const enterTeacher = (index: number) => {
    const plan = plans[index];
    if (!plan || !day) return;
    setActive(index); setStage("match"); setError("");
    setChoices(currentSelections(subs, date, plan.teacherId, planPeriods(plan, slots, day)));
  };
  const current = plans[active];
  const periods = current && day ? planPeriods(current, slots, day) : [];
  const busy = current && day ? workflowBusy(subs, date, plans, current, slots, day) : new Set<string>();
  const results = current && day ? periods.map((period) => ({
    period, slot: slots.find((s) => s.teacher_id === current.teacherId && s.day_of_week === day && s.period === period),
    candidates: findSubstitutes(teachers, slots, current.teacherId, day, period, date, busy),
  })) : [];
  const unresolved = periods.filter((p) => !choices[p]).length;
  const saveAndNext = async () => {
    if (!current || !day) return;
    setSaving(true); setError("");
    try {
      await onSave(date, day, current, choices);
      setCompleted((prev) => [...new Set([...prev, current.teacherId])]);
      const next = plans.findIndex((p, i) => i > active && !completed.includes(p.teacherId));
      if (next >= 0) enterTeacher(next);
      else setStage("done");
    } catch { setError("שמירת השיבוצים נכשלה. הבחירות נשמרו במסך — נסו שוב."); }
    finally { setSaving(false); }
  };

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-bold">מילוי מקום ליום הלימודים</h1>
      <span className="text-sm text-muted-foreground">{stage === "plan" ? "1 · בחירת החסרים" : stage === "match" ? "2 · שיבוץ מחליפים" : "3 · טופס יומי"}</span>
    </div>
    <div className="flex flex-wrap items-end gap-4 border-b pb-5">
      <label className="flex flex-col gap-1 text-sm"><span>תאריך</span>
        <input type="date" className="input" value={date} disabled={stage !== "plan" || saving} onChange={(e) => { setDate(e.target.value); setCompleted([]); }} />
      </label>
      <span className="pb-2 font-medium">{day ? `יום ${DAY_HE[day]}` : "שבת — אין לימודים"}</span>
      {stage !== "plan" && <Button variant="outline" disabled={saving} onClick={() => { setStage("plan"); setCompleted([]); }}><Pencil />עריכת רשימת החסרים</Button>}
    </div>

    {stage === "plan" && <div className="space-y-4">
      <label className="flex max-w-sm flex-col gap-1 text-sm"><span>הוספת מורה חסר/ה</span>
        <select className="input" value="" disabled={!day} onChange={(e) => {
          if (e.target.value) setPlans((prev) => [...prev, { teacherId: e.target.value, mode: "day", periods: [], reason: "מחלה" }]);
        }}><option value="">בחרו מורה…</option>{teachers.filter((t) => !plans.some((p) => p.teacherId === t.id)).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
      </label>
      {plans.map((plan) => {
        const teaching = day ? planPeriods({ ...plan, mode: "day" }, slots, day) : [];
        return <section key={plan.teacherId} className="rounded-lg border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold">{name(plan.teacherId)}</h2>
            <Button variant="ghost" size="icon" aria-label={`הסרת ${name(plan.teacherId)}`} title="הסרת מורה" onClick={() => setPlans((prev) => prev.filter((p) => p.teacherId !== plan.teacherId))}><Trash2 /></Button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="flex gap-1" role="group" aria-label={`היקף היעדרות ${name(plan.teacherId)}`}>
              <Button variant={plan.mode === "day" ? "default" : "outline"} aria-pressed={plan.mode === "day"} onClick={() => updatePlan(plan.teacherId, { mode: "day" })}>יום שלם</Button>
              <Button variant={plan.mode === "hours" ? "default" : "outline"} aria-pressed={plan.mode === "hours"} onClick={() => updatePlan(plan.teacherId, { mode: "hours" })}>לפי שעות</Button>
            </div>
            <label className="flex items-center gap-2 text-sm">סיבה<select className="input" value={plan.reason} onChange={(e) => updatePlan(plan.teacherId, { reason: e.target.value })}>
              {["מחלה", "השתלמות", "מילואים", "סיור / טיול", "אירוע משפחתי", "אחר"].map((r) => <option key={r}>{r}</option>)}
            </select></label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {plan.mode === "hours" ? teaching.map((p) => <Button key={p} size="sm" variant={plan.periods.includes(p) ? "default" : "outline"} aria-pressed={plan.periods.includes(p)} onClick={() => updatePlan(plan.teacherId, { periods: plan.periods.includes(p) ? plan.periods.filter((q) => q !== p) : [...plan.periods, p] })}>שעה {p}</Button>)
              : <span className="text-sm text-muted-foreground">שעות הוראה: {teaching.join(", ") || "אין שיעורים ביום זה"}</span>}
          </div>
        </section>;
      })}
      <Button disabled={!day || !plans.length || plans.some((p) => day && !planPeriods(p, slots, day).length)} onClick={() => enterTeacher(0)}><UserSearch />התחלת שיבוץ מחליפים<ArrowLeft /></Button>
    </div>}

    {stage !== "plan" && <>
      <div className="flex flex-wrap gap-2" aria-label="התקדמות שיבוץ">
        {plans.map((plan, index) => <Button key={plan.teacherId} variant={stage === "match" && index === active ? "default" : "outline"} disabled={saving || (index !== active && !completed.includes(plan.teacherId) && stage !== "done")} onClick={() => enterTeacher(index)}>
          {completed.includes(plan.teacherId) ? <CheckCircle2 /> : <span>{index + 1}</span>}{name(plan.teacherId)}{completed.includes(plan.teacherId) && " · נבדק"}
        </Button>)}
      </div>
      {stage === "match" && current && <>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
          <h2 className="text-xl font-bold">מחליפים עבור {name(current.teacherId)}</h2>
          <span className="text-sm text-muted-foreground">{periods.length - unresolved} מתוך {periods.length} שעות נבחרו</span>
        </div>
        {results.map(({ period, slot, candidates }) => <section key={period} className="space-y-3 border-b pb-5" aria-label={`שיבוץ שעה ${period}`}>
          <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">שעה {period}{slot?.class_room && ` · ${slot.class_room}`}</h3>
            {choices[period] && <span className="flex items-center gap-1 text-sm font-medium text-success"><Check />נבחר/ה: {name(choices[period])}</span>}
          </div>
          {!candidates.length && <p className="text-sm text-muted-foreground">אין ממלאי מקום פנויים בשעה זו.</p>}
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {candidates.map((candidate) => {
              const selected = choices[period] === candidate.teacher.id;
              return <div key={candidate.teacher.id} className={`flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-lg border p-3 ${selected ? "border-success bg-success/10" : "bg-card"}`}>
                <div className="min-w-0"><div className="font-semibold break-words">{candidate.teacher.name}</div><div className="mt-1 flex flex-wrap items-center gap-2 text-xs"><span className={`rounded border px-1.5 py-0.5 ${candidate.status === "פרטני" ? "bg-indiv text-indiv-foreground border-indiv-border" : "bg-prep text-prep-foreground border-prep-border"}`}>{candidate.status}</span><span className="text-muted-foreground">{candidate.hours}/{candidate.teacher.max_weekly_hours} ש״ש</span></div></div>
                <Button size="sm" variant={selected ? "secondary" : "outline"} disabled={saving} aria-pressed={selected} aria-label={`${selected ? "ביטול בחירת" : "בחירת"} ${candidate.teacher.name} לשעה ${period}`} onClick={() => setChoices((prev) => { const next = { ...prev }; if (selected) delete next[period]; else next[period] = candidate.teacher.id; return next; })}>
                  {selected ? <Check /> : <Plus />}{selected ? "נבחר/ה" : "בחירה"}
                </Button>
              </div>;
            })}
          </div>
        </section>)}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <Button disabled={saving} onClick={saveAndNext}><CheckCircle2 />{saving ? "שומר…" : unresolved ? "סיום בדיקה והמשך ללא השעות שנותרו" : active === plans.length - 1 ? "שמירה וסיום השיבוץ" : "שמירה ומעבר למורה הבא"}<ArrowLeft /></Button>
          {unresolved > 0 && <span className="text-sm text-destructive">{unresolved} שעות ללא מחליף</span>}
        </div>
      </>}
      {stage === "done" && day && <>
        <h2 className="flex items-center gap-2 text-lg font-semibold"><CheckCircle2 className="text-success" />בדיקת כל המורים הושלמה</h2>
        {plans.map((plan) => {
          const ps = planPeriods(plan, slots, day);
          const selected = currentSelections(subs, date, plan.teacherId, ps);
          const remaining = ps.filter((p) => !selected[p]);
          return remaining.length ? <p key={plan.teacherId} className="text-sm text-destructive">{name(plan.teacherId)} — ללא מחליף בשעות {remaining.join(", ")}</p> : null;
        })}
        <SubForm date={date} day={day} subs={subs} teachers={teachers} baseSlots={slots} plans={plans} />
      </>}
    </>}
  </div>;
}