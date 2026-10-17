import { useState } from "react";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { sendDailyForm } from "@/lib/send-form.functions";

type Payload = Parameters<typeof sendDailyForm>[0]["data"];

export function SendFormButton({ payload }: { payload: Payload }) {
  const [sending, setSending] = useState(false);
  const send = async () => {
    setSending(true);
    try {
      const r = await sendDailyForm({ data: payload });
      if (r.sent) toast.success("הטופס נשלח למייל בית הספר");
      else toast.error("כתובת המייל של בית הספר חסומה לקבלת הודעות");
    } catch { toast.error("שליחת הטופס נכשלה. נסו שוב מאוחר יותר."); }
    finally { setSending(false); }
  };
  return <AlertDialog>
    <AlertDialogTrigger asChild><Button size="sm" variant="outline" disabled={sending}><Mail className="h-4 w-4" />{sending ? "שולח…" : "שליחה למייל בית הספר"}</Button></AlertDialogTrigger>
    <AlertDialogContent dir="rtl">
      <AlertDialogHeader className="text-right">
        <AlertDialogTitle>האם את בטוחה שברצונך לשלוח?</AlertDialogTitle>
        <AlertDialogDescription>הטופס היומי יישלח אל idud123@gmail.com.</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter className="gap-2">
        <AlertDialogCancel>ביטול</AlertDialogCancel>
        <AlertDialogAction onClick={send}>כן, שלחי</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
}
