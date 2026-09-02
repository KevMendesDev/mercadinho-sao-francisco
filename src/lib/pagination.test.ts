import { describe, expect, it } from "vitest";
import { pageForTotal, pageResult, pagination } from "./pagination";

describe("pagination", () => {
  it("aplica valores padrão e limites", () => {
    expect(pagination()).toEqual({ page: 1, size: 20, skip: 0 });
    expect(pagination(-2, 500)).toEqual({ page: 1, size: 500, skip: 0 });
  });

  it("monta o contrato paginado", () => {
    expect(pageResult(["a"], 21, 2, 20)).toEqual({ content: ["a"], page: 2, size: 20, totalElements: 21, totalPages: 2 });
  });

  it("traz páginas fora do intervalo para a última página disponível", () => {
    expect(pageForTotal(9, 20, 21)).toBe(2);
    expect(pageForTotal(9, 20, 0)).toBe(1);
  });
});
