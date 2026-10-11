import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { SubForm } from "@/components/SubForm";
import type { Day, Slot, Substitution, Teacher } from "@/lib/school";
import type { AbsencePlan } from "@/lib/substitution-workflow";

const teachers = [
  { id: "mazal", name: "מזל בוני" },
  { id: "yael", name: "יעל" },
  { id: "noa", name: "נועה" },
] as unknown as Teacher[];

const baseSlots = [
  { teacher_id: "mazal", day_of_week: "Monday", period: 3, activity_type: "הוראה", class_room: "כיתה א'1" },
  { teacher_id: "mazal", day_of_week: "Monday", period: 4, activity_type: "הוראה", class_room: "כיתה א'1" },
  { teacher_id: "mazal", day_of_week: "Monday", period: 5, activity_type: "הוראה", class_room: "כיתה א'1" },
  { teacher_id: "yael", day_of_week: "Monday", period: 3, activity_type: "שהייה" },
  { teacher_id: "noa", day_of_week: "Monday", period: 4, activity_type: "פרטני" },
] as unknown as Slot[];

const subs = [
  { id: "r1", date: "2026-10-12", day: "Monday", period: 3, original_teacher_id: "mazal", substitute_teacher_id: "yael", class_room: "א'1", reason: "", status: "אושר" },
  { id: "r2", date: "2026-10-12", day: "Monday", period: 4, original_teacher_id: "mazal", substitute_teacher_id: "noa", class_room: "א'1", reason: "", status: "אושר" },
] as unknown as Substitution[];

const plans: AbsencePlan[] = [{ teacherId: "mazal", mode: "hours", periods: [3, 4, 5], reason: "מחלה" }];

describe("rendered daily form", () => {
  it("shows unbolded מ\"מ and single-letter activity marks", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    act(() => root.render(<SubForm date="2026-10-12" day={"Monday" as Day} subs={subs} teachers={teachers} baseSlots={baseSlots} plans={plans} />));

    const cells = [...host.querySelectorAll("td")];
    const covered = cells.find((c) => c.textContent?.includes("יעל"));
    expect(covered?.textContent).toContain("(ש)");
    const individual = cells.find((c) => c.textContent?.includes("נועה"));
    expect(individual?.textContent).toContain("(פ)");

    const mark = [...host.querySelectorAll("div")].find((d) => d.textContent === "מ\"מ");
    expect(mark).toBeDefined();
    expect(mark?.className).not.toMatch(/font-/);
    act(() => root.unmount());
  });
});
