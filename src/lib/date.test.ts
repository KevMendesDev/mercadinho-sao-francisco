import { describe, expect, it } from "vitest";
import { addDaysToDate, businessDate, daysUntilDate } from "./date";

describe("datas de negócio", () => {
  it("usa a data de São Paulo, sem deslocar para UTC", () => {
    expect(businessDate(new Date("2026-09-03T00:30:00.000Z"))).toBe("2026-09-02");
  });

  it("calcula prazo por dia-calendário", () => {
    const now = new Date("2026-09-02T22:00:00-03:00");
    expect(daysUntilDate("2026-09-03", now)).toBe(1);
    expect(addDaysToDate("2026-01-31", 1)).toBe("2026-02-01");
  });
});
