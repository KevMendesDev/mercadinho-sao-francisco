import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ session: vi.fn(), destroy: vi.fn(), user: vi.fn(), branch: vi.fn(), access: vi.fn() }));
vi.mock("./session", () => ({ readSession: state.session, destroySession: state.destroy }));
vi.mock("@/database/data-source", () => ({ getDataSource: vi.fn(async () => ({
  getRepository: (name: string) => name === "User" ? { findOne: state.user } : name === "Branch" ? { existsBy: state.branch } : { existsBy: state.access },
})) }));

import { requireApiUser, UnauthorizedError } from "./authorization";

const session = { userId: "user", name: "Nome", email: "n@example.test", role: "OPERATOR" as never, branchId: "branch", csrfTokenHash: "hash", sessionId: "session" };

describe("autorização da sessão", () => {
  beforeEach(() => {
    vi.clearAllMocks(); state.session.mockResolvedValue(session); state.branch.mockResolvedValue(true); state.access.mockResolvedValue(true);
  });

  it("rejeita e limpa cookies de usuário inativo", async () => {
    state.user.mockResolvedValue({ id: "user", active: false, deletedAt: null, role: "OPERATOR" });
    await expect(requireApiUser()).rejects.toBeInstanceOf(UnauthorizedError);
    expect(state.destroy).toHaveBeenCalledOnce();
  });

  it("rejeita e limpa cookies quando o acesso à filial selecionada é removido", async () => {
    state.user.mockResolvedValue({ id: "user", active: true, deletedAt: null, role: "OPERATOR" }); state.access.mockResolvedValue(false);
    await expect(requireApiUser()).rejects.toBeInstanceOf(UnauthorizedError);
    expect(state.destroy).toHaveBeenCalledOnce();
  });
});
