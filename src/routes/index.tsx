import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  LayoutDashboard, Users, CalendarDays, UserSearch, Phone, CheckCircle2, X, Send, MessageSquare, School, Bell, ClipboardList,
} from "lucide-react";
import {
  TEACHERS, DAYS, DAY_HE, PERIODS, findSubstitutes, weeklyHours, dayFromDate,
  type Activity, type Day, type Slot, type Substitution, type Teacher, type Candidate,
} from "@/lib/school";
import { loadAll, saveSub, saveStatus, applySub } from "@/lib/school-db";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "מערכת שעות ומילוי מקום | ניהול בית ספר" },
      { name: "description", content: "ניהול מערכת שעות ושיבוץ ממלאי מקום לסגני מנהלים ומורים." },
      { property: "og:title", content: "מערכת שעות ומילוי מקום" },
      { property: "og:description", content: "ניהול מערכת שעות ושיבוץ ממלאי מקום חכם." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: App,
});

type View = "dashboard" | "teachers" | "schedule" | "finder";

const BADGE: Record<Activity, string> = {
  "הוראה": "bg-teach text-teach-foreground border-teach-border",
  "שהייה": "bg-prep text-prep-foreground border-prep-border",
  "פרטני": "bg-indiv text-indiv-foreground border-indiv-border",
  "חלון": "bg-muted text-muted-foreground border-border",
};

function App() {
  const [view, setView] = useState<View>("dashboard");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [subs, setSubsState] = useState<Substitution[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [confirm, setConfirm] = useState<Substitution | null>(null);
  const [notify, setNotify] = useState<Substitution | null>(null);
  const teachers = TEACHERS;
  const tName = (id: string) => teachers.find((t) => t.id === id)?.name ?? "";

  useEffect(() => {
    loadAll().then(({ slots, subs }) => { setSlots(slots); setSubsState(subs); setLoaded(true); })
      .catch(() => { toast.error("טעינת הנתונים נכשלה"); setLoaded(true); });
  }, []);

  // Persist status changes (e.g. cancel / approve) to the database
  const setSubs = (fn: (p: Substitution[]) => Substitution[]) => {
    setSubsState((prev) => {
      const next = fn(prev);
      next.forEach((n) => {
        const o = prev.find((x) => x.id === n.id);
        if (o && o.status !== n.status) void saveStatus(n.id, n.status);
      });
      return next;
    });
  };

  const assign = (date: string, day: Day, period: number, missingId: string, c: Candidate, reason: string) => {
    const orig = slots.find((s) => s.teacher_id === missingId && s.day_of_week === day && s.period === period);
    const sub: Substitution = {
      id: crypto.randomUUID(), date, day, period, original_teacher_id: missingId, substitute_teacher_id: c.teacher.id,
      reason, status: "ממתין לאישור", subject: orig?.subject, class_room: orig?.class_room,
    };
    setSlots((prev) => applySub(prev, sub));
    setSubsState((p) => [sub, ...p]);
    void saveSub(sub).catch(() => toast.error("שמירת השיבוץ נכשלה"));
    setConfirm(sub);
  };

  if (!loaded) return <div dir="rtl" className="flex min-h-screen items-center justify-center text-muted-foreground">טוען נתונים…</div>;

  const nav: { id: View; label: string; icon: any }[] = [
    { id: "dashboard", label: "לוח בקרה", icon: LayoutDashboard },
    { id: "schedule", label: "מערכת שעות", icon: CalendarDays },
    { id: "teachers", label: "רשימת מורים", icon: Users },
    { id: "finder", label: "מילוי מקום", icon: UserSearch },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground font-sans">
      <header className="sticky top-0 z-30 border-b bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary p-2 text-primary-foreground"><School className="h-5 w-5" /></div>
            <div>
              <div className="font-bold leading-tight">מערכת שעות</div>
              <div className="text-xs text-muted-foreground">בית ספר עידוד</div>
            </div>
          </div>
          <nav className="flex flex-wrap gap-1 md:ms-6">
            {nav.map((n) => (
              <button key={n.id} onClick={() => setView(n.id)}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${view === n.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
                <n.icon className="h-4 w-4" />{n.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {view === "dashboard" && <Dashboard slots={slots} subs={subs} tName={tName} setSubs={setSubs} onNotify={setNotify} goFinder={() => setView("finder")} />}
        {view === "schedule" && <ScheduleView slots={slots} teachers={teachers} />}
        {view === "teachers" && <TeachersView slots={slots} teachers={teachers} />}
        {view === "finder" && <Finder slots={slots} teachers={teachers} onAssign={assign} />}
      </main>

      {confirm && (
        <Modal onClose={() => setConfirm(null)}>
          <div className="text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
            <h3 className="mt-3 text-xl font-bold">השיבוץ בוצע בהצלחה</h3>
            <p className="mt-2 text-muted-foreground">
              <b className="text-foreground">{tName(confirm.substitute_teacher_id)}</b> ימלא/תמלא את מקומו/ה של{" "}
              <b className="text-foreground">{tName(confirm.original_teacher_id)}</b> ביום {DAY_HE[confirm.day]} ({confirm.date}), שעה {confirm.period}.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">מערכת השעות עודכנה.</p>
            <div className="mt-6 flex justify-center gap-2">
              <button className="btn-primary" onClick={() => { setNotify(confirm); setConfirm(null); }}><Bell className="h-4 w-4" />שליחת התראות</button>
              <button className="btn-ghost" onClick={() => setConfirm(null)}>סגירה</button>
            </div>
          </div>
        </Modal>
      )}

      {notify && <NotifyDrawer sub={notify} teachers={teachers} onClose={() => setNotify(null)}
        onSent={() => setSubs((p) => p.map((s) => s.id === notify.id ? { ...s, status: "אושר" } : s))} />}
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

function Card({ title, icon: Icon, children, action }: any) {
  return (
    <section className="rounded-xl border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="flex items-center gap-2 font-semibold">{Icon && <Icon className="h-4 w-4 text-primary" />}{title}</h2>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function StatusBadge({ s }: { s: Substitution["status"] }) {
  const c = s === "אושר" ? "bg-success/15 text-success" : s === "בוטל" ? "bg-destructive/15 text-destructive" : "bg-prep text-prep-foreground";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c}`}>{s}</span>;
}

function Dashboard({ slots, subs, tName, setSubs, onNotify, goFinder }: any) {
  const todayIdx = new Date().getDay();
  const today: Day = (todayIdx === 6 ? "Sunday" : DAYS[todayIdx]) ?? "Sunday";
  const counts = (["הוראה", "שהייה", "פרטני"] as Activity[]).map((a) => ({ a, n: slots.filter((s: Slot) => s.activity_type === a).length }));
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">שלום, סגנית המנהלת 👋</h1>
          <p className="text-muted-foreground">סקירה שבועית של מערכת השעות ומילויי המקום</p>
        </div>
        <button className="btn-primary" onClick={goFinder}><UserSearch className="h-4 w-4" />מציאת ממלא מקום</button>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="מורים פעילים" value={TEACHERS.length} />
        {counts.map((c) => <Stat key={c.a} label={`שעות ${c.a}`} value={c.n} badge={c.a} />)}
      </div>
      <Card title={`יום ${DAY_HE[today]} — כל המורים`} icon={CalendarDays}>
        <Grid rows={TEACHERS.map((t) => ({ label: t.name, cells: PERIODS.map((p) => ({ s: slots.find((s: Slot) => s.teacher_id === t.id && s.day_of_week === today && s.period === p), off: !t.working_days.includes(today) })) }))} />
      </Card>
      <Card title="יומן מילוי מקום" icon={ClipboardList}>
        {subs.length === 0 ? <p className="py-6 text-center text-muted-foreground">אין עדיין מילויי מקום. השתמשו ב"מילוי מקום" כדי לשבץ.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted-foreground"><tr className="border-b text-right">
                <th className="p-2">תאריך</th><th className="p-2">שעה</th><th className="p-2">מורה חסר/ה</th><th className="p-2">ממלא/ת מקום</th><th className="p-2">סיבה</th><th className="p-2">סטטוס</th><th className="p-2"></th>
              </tr></thead>
              <tbody>{subs.map((s: Substitution) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="p-2">{s.date} ({DAY_HE[s.day]})</td><td className="p-2">{s.period}</td>
                  <td className="p-2">{tName(s.original_teacher_id)}</td><td className="p-2 font-medium">{tName(s.substitute_teacher_id)}</td>
                  <td className="p-2">{s.reason}</td><td className="p-2"><StatusBadge s={s.status} /></td>
                  <td className="p-2 flex gap-1">
                    <button className="btn-ghost text-xs" onClick={() => onNotify(s)}><MessageSquare className="h-3 w-3" />התראה</button>
                    {s.status !== "בוטל" && <button className="btn-ghost text-xs text-destructive" onClick={() => setSubs((p: Substitution[]) => p.map((x) => x.id === s.id ? { ...x, status: "בוטל" } : x))}>ביטול</button>}
                  </td>
                </tr>))}</tbody>
            </table>
          </div>)}
      </Card>
    </div>
  );
}

function Stat({ label, value, badge }: { label: string; value: number; badge?: Activity }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-center gap-2 text-3xl font-bold">{value}{badge && <span className={`h-3 w-3 rounded-full border ${BADGE[badge]}`} />}</div>
    </div>
  );
}

function SlotCell({ s, off }: { s?: Slot | undefined; off?: boolean | undefined }) {
  if (off) return <div className="h-full min-h-16 rounded-md bg-muted/40" title="לא עובד/ת" />;
  if (!s || s.activity_type === "חלון") return <div className="h-full min-h-16 rounded-md border border-dashed bg-muted/40" title="פנוי" />;
  return (
    <div className={`h-full min-h-16 rounded-md border p-1.5 text-xs leading-snug ${BADGE[s.activity_type]} ${s.substitute_for ? "ring-2 ring-success" : ""}`}>
      <div className="font-semibold">{s.activity_type}{s.substitute_for && " · מ\"מ"}</div>
      {s.subject && <div className="mt-0.5 font-medium">{s.subject}</div>}
      {s.class_room && <div className="opacity-70">{s.class_room}</div>}
    </div>
  );
}

function Grid({ rows }: { rows: { label: string; cells: { s?: Slot | undefined; off?: boolean }[] }[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-separate border-spacing-1 text-sm">
        <thead><tr>
          <th className="w-32"></th>
          {PERIODS.map((p) => (
            <th key={p} className="align-top px-1 pb-1 font-medium text-muted-foreground">
              <div>שעה {p}</div>
              <div className="text-[11px] font-normal" dir="ltr">{periodTime(p)}</div>
            </th>
          ))}
        </tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r.label} className="transition hover:bg-accent/30"><td className="whitespace-nowrap ps-1 align-top font-medium">{r.label}</td>
            {r.cells.map((c, i) => <td key={i} className="align-top"><SlotCell s={c.s} off={c.off} /></td>)}</tr>
        ))}</tbody>
      </table>
      <Legend />
    </div>
  );
}

// שעה 0 מתחילה ב-7:30; כל שעה = 30 דקות
export function periodTime(p: number) {
  const start = 7 * 60 + 30 + p * 30;
  const f = (m: number) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
  return `${f(start)}–${f(start + 30)}`;
}

function WeekGrid({ slots, teacher }: { slots: Slot[]; teacher?: Teacher | undefined }) {
  if (!teacher) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-separate border-spacing-1 text-sm">
        <thead><tr>
          <th className="w-32"></th>
          {DAYS.map((d) => <th key={d} className="pb-1 font-medium text-muted-foreground">יום {DAY_HE[d]}</th>)}
        </tr></thead>
        <tbody>{PERIODS.map((p) => (
          <tr key={p} className="transition hover:bg-accent/30">
            <td className="whitespace-nowrap ps-1 align-top">
              <div className="font-medium">שעה {p}</div>
              <div className="text-xs text-muted-foreground" dir="ltr">{periodTime(p)}</div>
            </td>
            {DAYS.map((d) => (
              <td key={d} className="align-top">
                <SlotCell
                  s={slots.find((s) => s.teacher_id === teacher.id && s.day_of_week === d && s.period === p)}
                  off={!teacher.working_days.includes(d)}
                />
              </td>
            ))}
          </tr>
        ))}</tbody>
      </table>
      <Legend />
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
      {(["הוראה", "שהייה", "פרטני"] as Activity[]).map((a) => <span key={a} className={`rounded-full border px-2 py-0.5 ${BADGE[a]}`}>{a}</span>)}
      <span className="rounded-full border border-dashed bg-muted/40 px-2 py-0.5 text-muted-foreground">פנוי / לא עובד/ת</span>
      <span className="rounded-full px-2 py-0.5 ring-2 ring-success">מילוי מקום</span>
    </div>
  );
}


function ScheduleView({ slots, teachers }: { slots: Slot[]; teachers: Teacher[] }) {
  const SUBJECTS = Array.from(new Set(teachers.flatMap((t) => t.subjects)));
  const [tid, setTid] = useState(teachers[0]?.id ?? "");
  const [subject, setSubject] = useState("");
  const [day, setDay] = useState<Day | "">("");
  const mode = day ? "day" : "teacher";
  const filteredTeachers = teachers.filter((t) => !subject || t.subjects.includes(subject));
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">מערכת שעות שבועית</h1>
      <div className="flex flex-wrap gap-3 rounded-xl border bg-card p-4">
        <Field label="מורה"><select className="input" value={tid} onChange={(e) => setTid(e.target.value)} disabled={!!day}>
          {filteredTeachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
        <Field label="מקצוע"><select className="input" value={subject} onChange={(e) => {
          setSubject(e.target.value);
          const f = teachers.filter((t) => !e.target.value || t.subjects.includes(e.target.value));
          if (f.length && !f.find((t) => t.id === tid)) setTid(f[0]!.id);
        }}>
          <option value="">כל המקצועות</option>{SUBJECTS.map((s) => <option key={s}>{s}</option>)}</select></Field>
        <Field label="יום (תצוגת כל המורים)"><select className="input" value={day} onChange={(e) => setDay(e.target.value as Day | "")}>
          <option value="">— תצוגה לפי מורה —</option>{DAYS.map((d) => <option key={d} value={d}>{DAY_HE[d]}</option>)}</select></Field>
      </div>
      <Card title={mode === "day" ? `יום ${DAY_HE[day as Day]}` : `מערכת של ${teachers.find((t) => t.id === tid)?.name}`} icon={CalendarDays}>
        {mode === "day"
          ? <Grid rows={filteredTeachers.map((t) => ({ label: t.name, cells: PERIODS.map((p) => ({ s: slots.find((s) => s.teacher_id === t.id && s.day_of_week === day && s.period === p), off: !t.working_days.includes(day as Day) })) }))} />
          : <WeekGrid slots={slots} teacher={teachers.find((t) => t.id === tid)} />}
      </Card>
    </div>
  );
}

function Field({ label, children }: any) {
  return <label className="flex min-w-44 flex-col gap-1 text-sm"><span className="text-muted-foreground">{label}</span>{children}</label>;
}

function TeachersView({ slots, teachers }: { slots: Slot[]; teachers: Teacher[] }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">רשימת מורים</h1>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground"><tr className="text-right">
            <th className="p-3">שם</th><th className="p-3">טלפון</th><th className="p-3">מקצועות</th><th className="p-3">ימי עבודה</th><th className="p-3">שעות שבועיות</th>
          </tr></thead>
          <tbody>{teachers.map((t) => {
            const h = weeklyHours(slots, t.id); const pct = Math.min(100, (h / t.max_weekly_hours) * 100);
            return (
              <tr key={t.id} className="border-t">
                <td className="p-3 font-medium">{t.name}</td>
                <td className="p-3"><span className="flex items-center gap-1" dir="ltr"><Phone className="h-3 w-3" />{t.phone}</span></td>
                <td className="p-3"><div className="flex flex-wrap gap-1">{t.subjects.map((s) => <span key={s} className={`rounded-full border px-2 py-0.5 text-xs ${BADGE["הוראה"]}`}>{s}</span>)}</div></td>
                <td className="p-3"><div className="flex flex-wrap gap-1">{DAYS.map((d) => <span key={d} className={`rounded px-1.5 py-0.5 text-xs ${t.working_days.includes(d) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground line-through"}`}>{DAY_HE[d].charAt(0)}'</span>)}</div></td>
                <td className="p-3 min-w-40"><div className="flex items-center gap-2"><div className="h-2 flex-1 rounded-full bg-muted"><div className={`h-2 rounded-full ${h >= t.max_weekly_hours ? "bg-destructive" : "bg-primary"}`} style={{ width: `${pct}%` }} /></div><span className="text-xs">{h}/{t.max_weekly_hours}</span></div></td>
              </tr>);
          })}</tbody>
        </table>
      </div>
    </div>
  );
}

function Finder({ slots, teachers, onAssign }: { slots: Slot[]; teachers: Teacher[]; onAssign: (date: string, day: Day, p: number, m: string, c: Candidate, r: string) => void }) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const autoDay = dayFromDate(date);
  const isSaturday = !autoDay;
  const day: Day = (autoDay ?? "Sunday") as Day;
  const [missing, setMissing] = useState(teachers[0]?.id ?? "");
  const [periods, setPeriods] = useState<number[]>([]);
  const [reason, setReason] = useState("מחלה");
  const [run, setRun] = useState(false);
  const mt = teachers.find((t) => t.id === missing);
  if (!mt) return <p className="text-muted-foreground">לא נמצאו מורים במערכת.</p>;
  const toggle = (p: number) => setPeriods((x) => x.includes(p) ? x.filter((y) => y !== p) : [...x, p].sort());

  const results = useMemo(() => run ? periods.map((p) => ({ p, slot: slots.find((s) => s.teacher_id === missing && s.day_of_week === day && s.period === p), cands: findSubstitutes(teachers, slots, missing, day, p) })) : [], [run, periods, slots, missing, day, teachers]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">איתור ממלא מקום</h1>
      <Card title="פרטי ההיעדרות" icon={UserSearch}>
        <div className="flex flex-wrap gap-3">
          <Field label="תאריך"><input type="date" className="input" value={date} onChange={(e) => { setDate(e.target.value); setRun(false); }} />
            <span className="mt-1 block text-xs text-muted-foreground">{isSaturday ? "שבת — אין לימודים" : `יום ${DAY_HE[day]}`}</span></Field>
          <Field label="מורה חסר/ה"><select className="input" value={missing} onChange={(e) => { setMissing(e.target.value); setRun(false); }}>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
          <Field label="סיבה"><select className="input" value={reason} onChange={(e) => setReason(e.target.value)}>
            {["מחלה", "השתלמות", "מילואים", "סיור / טיול", "אירוע משפחתי", "אחר"].map((r) => <option key={r}>{r}</option>)}</select></Field>
        </div>
        {!isSaturday && !mt.working_days.includes(day) && <p className="mt-3 text-sm text-destructive">{mt.name} אינו/ה עובד/ת ביום {DAY_HE[day]}.</p>}
        <div className="mt-4">
          <div className="mb-2 text-sm text-muted-foreground">שעות חסרות (המערכת של {mt.name} ביום {DAY_HE[day]}):</div>
          <div className="grid grid-cols-4 gap-2 md:grid-cols-6 lg:grid-cols-11">
            {PERIODS.map((p) => {
              const s = slots.find((x) => x.teacher_id === missing && x.day_of_week === day && x.period === p);
              const free = !s || s.activity_type === "חלון";
              const on = periods.includes(p);
              return (
                <button key={p} onClick={() => { toggle(p); setRun(false); }} className={`rounded-lg border-2 p-2 text-right text-xs transition ${on ? "border-primary bg-primary/10" : "border-transparent bg-muted/50 hover:border-border"}`}>
                  <div className="mb-1 font-bold">שעה {p}</div>
                  <span className={`rounded-full border px-1.5 py-0.5 ${free ? "border-dashed bg-muted/40 text-muted-foreground" : BADGE[s!.activity_type]}`}>{free ? "פנוי" : s!.activity_type}</span>
                  {s?.subject && !free && <div className="mt-1 truncate">{s.subject}</div>}
                </button>);
            })}
          </div>
        </div>
        <button className="btn-primary mt-4" disabled={!periods.length || isSaturday} onClick={() => setRun(true)}><UserSearch className="h-4 w-4" />חפש ממלאי מקום</button>
      </Card>

      {results.map(({ p, slot, cands }) => (
        <Card key={p} title={`שעה ${p} — ${slot && slot.activity_type !== "חלון" ? (slot.subject ?? slot.activity_type) : "אין שיעור"}${slot?.class_room ? " · " + slot.class_room : ""}`} icon={Users}
          action={<span className="text-xs text-muted-foreground">{cands.length} מועמדים</span>}>
          {cands.length === 0 ? <p className="text-muted-foreground">אין מורים בשהייה או בפרטני בשעה זו.</p> : (
            <div className="space-y-2">{cands.map((c, i) => (
              <div key={c.teacher.id} className={`flex flex-wrap items-center gap-3 rounded-lg border p-3 ${i === 0 ? "border-primary bg-primary/5" : ""}`}>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-bold">{i + 1}</div>
                <div className="min-w-36 flex-1">
                  <div className="font-semibold">{c.teacher.name} {i === 0 && <span className="text-xs text-primary">· התאמה מיטבית</span>}</div>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-xs ${BADGE[c.status]}`}>{c.status === "שהייה" ? "בשהייה" : "בפרטני"}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${c.underMax ? "bg-muted text-muted-foreground" : "bg-destructive/15 text-destructive"}`}>{c.hours}/{c.teacher.max_weekly_hours} ש"ש</span>
                <button className="btn-primary text-sm" onClick={() => { onAssign(date, day, p, missing, c, reason); setPeriods((x) => x.filter((y) => y !== p)); }}>שבץ מורה זה כממלא מקום</button>
              </div>))}</div>)}
        </Card>
      ))}
    </div>
  );
}

function NotifyDrawer({ sub, teachers, onClose, onSent }: { sub: Substitution; teachers: Teacher[]; onClose: () => void; onSent: () => void }) {
  const o = teachers.find((t) => t.id === sub.original_teacher_id)!;
  const s = teachers.find((t) => t.id === sub.substitute_teacher_id)!;
  const [sent, setSent] = useState<Record<string, boolean>>({});
  const what = `${sub.subject ?? "שיעור"}${sub.class_room ? ` ב${sub.class_room}` : ""}`;
  const msgs = [
    { t: s, role: "ממלא/ת מקום", text: `שלום ${s.name},\nשובצת למילוי מקום ביום ${DAY_HE[sub.day]}, ${sub.date}, שעה ${sub.period}.\nשיעור: ${what} (במקום ${o.name}).\nנא לאשר קבלת ההודעה.\nתודה, סגנית המנהלת` },
    { t: o, role: "מורה חסר/ה", text: `שלום ${o.name},\nהיעדרותך ביום ${DAY_HE[sub.day]}, ${sub.date}, שעה ${sub.period} נרשמה (${sub.reason}).\nממלא/ת המקום: ${s.name}.\nבמידת הצורך, נא להעביר חומרים לשיעור.\nרפואה שלמה / בהצלחה, סגנית המנהלת` },
  ];
  return (
    <div className="fixed inset-0 z-50 flex bg-foreground/40" onClick={onClose}>
      <aside className="me-auto h-full w-full max-w-md overflow-y-auto border-e bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-bold"><MessageSquare className="h-5 w-5 text-primary" />התראות יוצאות</h3>
          <button className="btn-ghost" onClick={onClose}><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-4">{msgs.map((m) => (
          <div key={m.t.id} className="rounded-xl border p-3">
            <div className="mb-2 flex items-center justify-between text-sm">
              <div><b>{m.t.name}</b> <span className="text-muted-foreground">· {m.role}</span></div>
              <span dir="ltr" className="text-xs text-muted-foreground">{m.t.phone}</span>
            </div>
            <div className="whitespace-pre-line rounded-lg rounded-tr-none bg-chat p-3 text-sm text-chat-foreground">{m.text}</div>
            <div className="mt-1 text-xs text-muted-foreground">WhatsApp / SMS</div>
          </div>))}</div>
        <button className="btn-primary mt-5 w-full justify-center" disabled={sent["all"]} onClick={() => { setSent({ all: true }); onSent(); }}>
          {sent["all"] ? <><CheckCircle2 className="h-4 w-4" />ההתראות נשלחו (סימולציה)</> : <><Send className="h-4 w-4" />שלח התראה (סימולציה)</>}
        </button>
      </aside>
    </div>
  );
}
