import { describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ csrfCookie: "csrf", get: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: state.get }) }));
import { assertSameOrigin, assertSessionCsrf } from "./csrf";
import { hashSessionToken, type SessionData } from "./session";

const session: SessionData = { userId: "u", name: "Nome", email: "n@example.test", role: "OPERATOR" as SessionData["role"], branchId: "b", sessionId: "s", csrfTokenHash: hashSessionToken("csrf") };
function request(headers: HeadersInit = {}): Request { return new Request("https://app.test/api/resource", { method: "POST", headers }); }

describe("proteção CSRF", () => {
  it.each([undefined, "https://outside.test"])("rejeita Origin ausente ou externo", (origin) => {
    expect(() => assertSameOrigin(request(origin ? { origin } : {}))).toThrow("Origem");
  });

  it.each([
    [{ origin: "https://app.test" }, undefined],
    [{ origin: "https://app.test", "x-msf-csrf": "outro" }, "csrf"],
    [{ origin: "https://app.test", "x-msf-csrf": "csrf" }, "outro"],
  ])("rejeita token ausente ou divergente", async (headers, csrfCookie) => {
    state.get.mockReturnValue(csrfCookie ? { value: csrfCookie } : undefined);
    await expect(assertSessionCsrf(request(headers), session)).rejects.toThrow("CSRF");
  });

  it("aceita token associado à sessão", async () => {
    state.get.mockReturnValue({ value: "csrf" });
    await expect(assertSessionCsrf(request({ origin: "https://app.test", "x-msf-csrf": "csrf" }), session)).resolves.toBeUndefined();
  });

  it("rejeita token que não pertence à sessão", async () => {
    state.get.mockReturnValue({ value: "csrf" });
    await expect(assertSessionCsrf(request({ origin: "https://app.test", "x-msf-csrf": "csrf" }), { ...session, csrfTokenHash: hashSessionToken("outro") })).rejects.toThrow("CSRF");
  });
});
