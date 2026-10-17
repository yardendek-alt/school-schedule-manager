import { useEffect, useState } from "react";
import { toast } from "sonner";
import { History, Save, RotateCcw, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Snap = { id: string; name: string; created_at: string };

export function ScheduleVersions({ onRestored }: { onRestored: () => Promise<void> }) {
  const [snaps, setSnaps] = useState<Snap[]>([]);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const load = async () => {
    const { data } = await supabase.from("schedule_snapshots").select("id,name,created_at").order("created_at", { ascending: false });
    setSnaps(data ?? []);
  };
  useEffect(() => { void load(); }, []);

  const create = async () => {
    setBusy(true);
    const { error } = await supabase.rpc("create_schedule_snapshot", { _name: name.trim() || "גרסה שמורה" });
    setBusy(false);
    if (error) return toast.error("שמירת הגרסה נכשלה");
    setName(""); toast.success("הגרסה נשמרה"); void load();
  };
  const restore = async (s: Snap) => {
    if (!confirm(`לשחזר את "${s.name}"? המערכת הנוכחית של כל המורים תוחלף. מומלץ לשמור קודם גרסה של המצב הנוכחי.`)) return;
    setBusy(true);
    const { error } = await supabase.rpc("restore_schedule_snapshot", { _id: s.id });
    if (!error) await onRestored();
    setBusy(false);
    error ? toast.error("השחזור נכשל") : toast.success("המערכת שוחזרה");
  };
  const remove = async (s: Snap) => {
    if (!confirm(`למחוק את הגרסה "${s.name}"?`)) return;
    await supabase.from("schedule_snapshots").delete().eq("id", s.id);
    void load();
  };

  return (
    <section className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
      <h2 className="flex items-center gap-2 font-semibold"><History className="h-4 w-4 text-primary" />גרסאות שמורות של המערכת</h2>
      <div className="flex flex-wrap gap-2">
        <input className="input flex-1 min-w-48" placeholder="שם הגרסה (לדוגמה: מערכת לפני שינויי ינואר)" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn-primary" disabled={busy} onClick={create}><Save className="h-4 w-4" />שמירת המערכת הנוכחית</button>
      </div>
      {snaps.length === 0 ? <p className="text-sm text-muted-foreground">אין גרסאות שמורות.</p> : (
        <ul className="divide-y text-sm">{snaps.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center gap-2 py-2">
            <span className="font-medium">{s.name}</span>
            <span className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString("he-IL")}</span>
            <div className="ms-auto flex gap-1">
              <button className="btn-ghost text-xs" disabled={busy} onClick={() => restore(s)}><RotateCcw className="h-3 w-3" />שחזור</button>
              <button className="btn-ghost text-xs text-destructive" disabled={busy} onClick={() => remove(s)}><Trash2 className="h-3 w-3" />מחיקה</button>
            </div>
          </li>))}</ul>
      )}
    </section>
  );
}
