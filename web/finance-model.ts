import type { FinancePlan, LedgerEntry } from "./types";
export const emptyPlan: FinancePlan = {
  openingCashCents: 0,
  rooms: 1,
  days: 30,
  occupancy: 0,
  rateCents: 0,
  variableCents: 0,
  fixedCents: 0,
};
export const money = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100,
  );
export function financeSummary(plan: FinancePlan, entries: LedgerEntry[]) {
  const income = entries
    .filter((e) => e.kind === "income")
    .reduce((sum, e) => sum + e.amountCents, 0);
  const expenses = entries
    .filter((e) => e.kind === "expense")
    .reduce((sum, e) => sum + e.amountCents, 0);
  const cash = plan.openingCashCents + income - expenses;
  const nights = (plan.rooms * plan.days * plan.occupancy) / 100;
  const revenue = Math.round(nights * plan.rateCents),
    variable = Math.round(nights * plan.variableCents);
  const net = revenue - variable - plan.fixedCents;
  const contribution = plan.rateCents - plan.variableCents;
  const breakEven =
    plan.fixedCents === 0
      ? 0
      : contribution > 0
        ? (plan.fixedCents / (plan.rooms * plan.days * contribution)) * 100
        : null;
  return {
    income,
    expenses,
    cash,
    nights,
    revenue,
    variable,
    net,
    breakEven,
    runway: net < 0 ? Math.max(0, cash) / -net : null,
  };
}
