import { describe, expect, it } from "vitest";
import { apiError } from "./api";
import { BadRequestError, TooManyRequestsError } from "./errors";

describe("apiError", () => {
  it("preserva mensagens de erros de domínio", async () => {
    const response = apiError(new BadRequestError("Quantidade inválida."));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Quantidade inválida." });
  });

  it("não expõe detalhes de erros inesperados", async () => {
    const response = apiError(new Error("senha do banco exposta"));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Não foi possível concluir a operação. Tente novamente." });
  });

  it("retorna retry-after para limite de tentativas", async () => {
    const response = apiError(new TooManyRequestsError());
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("900");
  });

  it("converte conflito único do PostgreSQL em resposta de domínio", async () => {
    const response = apiError({ code: "23505" });
    expect(response.status).toBe(409);
  });

  it.each(["23001", "23503"])("converte restrição de chave estrangeira %s em conflito", async (code) => {
    const response = apiError({ code });
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: "Não é possível excluir este registro porque ele está sendo utilizado." });
  });
});
