import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { expect, it, describe } from "vitest";
import { SubForm } from "@/components/SubForm";
import type { Slot, Substitution, Teacher } from "@/lib/school";
import type { AbsencePlan } from "@/lib/substitution-workflow";

const teachers = [
  { id: "olga", name: "אולגה", dedicated_substitute: true },
  { id: "mazal", name: "מזל" },
  { id: "yael", name: "יעל" },
] as Teacher[];

const baseSlots: Slot[] = [
  { teacher_id: "mazal", day_of_week: "Monday", period: 8, activity_type: "הוראה", class_room: "כיתה א׳1" },
  { teacher_id: "yael", day_of_week: "Monday", period: 8, activity_type: "שהייה", class_room: "" },
];

const plans: AbsencePlan[] = [{ teacherId: "mazal", mode: "day", periods: [], reason: "מחלה" }];

const subs: Substitution[] = [{
  id: "sub1", date: "2026-10-12", day: "Monday", period: 8,
  original_teacher_id: "mazal", substitute_teacher_id: "olga", class_room: "א׳1",
  reason: "", status: "אושר",
}];

function renderForm() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <SubForm date="2026-10-12" day="Monday" subs={subs} teachers={teachers} baseSlots={baseSlots} plans={plans} />
    </QueryClientProvider>
  );
}

describe("daily form table", () => {
  it("writes the lead label once per class across שיעור 8–10 in a merged cell", () => {
    renderForm();
    const leadCells = screen.getAllByText("מובילה").filter((el) => el.closest("td"));
    console.log("lead cell count:", leadCells.length);
    expect(leadCells).toHaveLength(13); // one merged cell per lead class column
    const merged = leadCells[0].closest("td");
    expect(merged).toHaveAttribute("rowspan", "3");
    // No separate lead label inside rows 9 and 10
    expect(screen.getAllByText("מובילה").filter((el) => el.closest("td") !== merged && el.closest("td")?.getAttribute("rowspan") === "3")).toHaveLength(0);
  });

  it("writes the dedicated substitute as אולגה (מ\"מ) in the table", () => {
    renderForm();
    expect(screen.getByText('אולגה (מ"מ)')).toBeInTheDocument();
  });
});
