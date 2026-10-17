import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const line = z.object({ text: z.string().max(120), tone: z.enum(["sub", "missing", "lead"]).optional() });
const cell = z.object({ lines: z.array(line).max(10), rowSpan: z.number().int().min(1).max(3).optional() }).nullable();
const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dayLabel: z.string().max(20),
  dateLabel: z.string().max(20),
  headers: z.array(z.tuple([z.string().max(20), z.string().max(40)])).max(30),
  rows: z.array(z.object({ label: z.string().max(20), cells: z.array(cell).max(30) })).max(12),
  missing: z.array(z.string().max(60)).max(60),
});

// Recipient is fixed by the template (school mailbox); the browser cannot choose it.
export const sendDailyForm = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(async ({ data }) => {
    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    const result = await sendTemplateEmail("daily-sub-form", "", {
      templateData: data,
      idempotencyKey: `daily-sub-form-${data.date}-${crypto.randomUUID()}`,
    });
    return { sent: result.sent };
  });
