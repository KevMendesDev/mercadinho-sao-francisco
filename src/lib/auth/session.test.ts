import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn(), save: vi.fn(), findOne: vi.fn(), update: vi.fn(), user: vi.fn(), redirect: vi.fn(() => { throw new Error("redirect"); }) }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: state.get, set: state.set }) }));
vi.mock("next/navigation", () => ({ redirect: state.redirect }));
vi.mock("@/lib/environment", () => ({ requireAuthSecret: vi.fn(() => "a".repeat(32)) }));
vi.mock("@/database/data-source", () => ({ getDataSource: vi.fn(async () => ({
  getRepository: (name: string) => name === "UserSession" ? { save: state.save, findOne: state.findOne, update: state.update } : { findOne: state.user },
})) }));

import { createSession, hashSessionToken, readSession, requireSession, revokeSession, updateSessionBranch } from "./session";

const token = "a".repeat(43);
const now = new Date();
const validRecord = { id: "session", userId: "user", branchId: "branch", csrfTokenHash: hashSessionToken("csrf"), revokedAt: null, idleExpiresAt: new Date(now.getTime() + 1_000), absoluteExpiresAt: new Date(now.getTime() + 2_000) };

describe("sessões persistentes", () => {
  beforeEach(() => {
    vi.clearAllMocks(); state.get.mockReturnValue({ value: token }); state.user.mockResolvedValue({ id: "user", name: "Nome", email: "n@example.test", role: "OPERATOR" });
  });

  it("cria tokens opacos e cookies com atributos distintos", async () => {
    await createSession({ userId: "user", name: "Nome", email: "n@example.test", role: "OPERATOR" as never, branchId: "branch" });
    expect(state.save).toHaveBeenCalledWith(expect.objectContaining({ tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/), csrfTokenHash: expect.stringMatching(/^[a-f0-9]{64}$/), userId: "user", branchId: "branch" }));
    expect(state.set).toHaveBeenNthCalledWith(1, "msf_session", expect.stringMatching(/^[A-Za-z0-9_-]{43}$/), expect.objectContaining({ httpOnly: true, sameSite: "lax", path: "/" }));
    expect(state.set).toHaveBeenNthCalledWith(2, "msf_csrf", expect.stringMatching(/^[A-Za-z0-9_-]{43}$/), expect.objectContaining({ httpOnly: false, sameSite: "strict", path: "/" }));
  });

  it.each([
    ["desconhecida", undefined],
    ["inativa", { ...validRecord, idleExpiresAt: new Date(now.getTime() - 1) }],
    ["absoluta", { ...validRecord, absoluteExpiresAt: new Date(now.getTime() - 1) }],
    ["revogada", { ...validRecord, revokedAt: now }],
  ])("rejeita sessão %s", async (_label, record) => {
    state.findOne.mockResolvedValue(record);
    await expect(readSession()).resolves.toBeNull();
  });

  it("renova a validade inativa sem ultrapassar a absoluta", async () => {
    state.findOne.mockResolvedValue({ ...validRecord, absoluteExpiresAt: new Date(Date.now() + 500) });
    await expect(readSession()).resolves.toMatchObject({ userId: "user", branchId: "branch" });
    expect(state.update).toHaveBeenCalledWith("session", expect.objectContaining({ lastActivityAt: expect.any(Date), idleExpiresAt: expect.any(Date) }));
    expect(state.update.mock.calls[0][1].idleExpiresAt.getTime()).toBeLessThanOrEqual(Date.now() + 500);
  });

  it("revoga pelo hash do token opaco", async () => {
    await revokeSession();
    expect(state.update).toHaveBeenCalledWith({ tokenHash: hashSessionToken(token) }, { revokedAt: expect.any(Date) });
  });

  it("persiste a mudança de filial na sessão atual", async () => {
    await updateSessionBranch("session", "nova-filial");
    expect(state.update).toHaveBeenCalledWith("session", { branchId: "nova-filial" });
  });

  it("rejeita o formato JWT legado", async () => {
    state.get.mockReturnValue({ value: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyIn0.assinatura" });
    await expect(readSession()).resolves.toBeNull();
    expect(state.findOne).not.toHaveBeenCalled();
  });

  it("redireciona páginas protegidas para login sem uma sessão", async () => {
    state.get.mockReturnValue(undefined);
    await expect(requireSession()).rejects.toThrow("redirect");
    expect(state.redirect).toHaveBeenCalledWith("/login");
  });
});
