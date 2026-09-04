import { beforeEach, describe, expect, it, vi } from "vitest";

const { compare, getDataSource, createSession, clearLoginAttempts, consumeLoginAttempt } = vi.hoisted(() => ({
  compare: vi.fn(),
  getDataSource: vi.fn(),
  createSession: vi.fn(),
  clearLoginAttempts: vi.fn(),
  consumeLoginAttempt: vi.fn(),
}));

vi.mock("bcryptjs", () => ({ compare }));
vi.mock("@/database/data-source", () => ({ getDataSource }));
vi.mock("@/lib/auth/session", () => ({ createSession }));
vi.mock("./login-rate-limit.service", () => ({ clearLoginAttempts, consumeLoginAttempt }));

import { authenticate } from "./auth.service";

describe("authenticate", () => {
  beforeEach(() => vi.clearAllMocks());

  it("atualiza o último acesso sem salvar o grafo de relações do usuário", async () => {
    const user = { id: "user-1", name: "Admin", email: "admin@example.com", passwordHash: "hash", role: "ADMIN", active: true, deletedAt: null };
    const userRepository = { findOne: vi.fn().mockResolvedValue(user), update: vi.fn().mockResolvedValue(undefined), save: vi.fn() };
    const branchRepository = { findOneBy: vi.fn().mockResolvedValue({ id: "branch-1" }) };
    getDataSource.mockResolvedValue({ getRepository: (name: string) => name === "users" ? userRepository : branchRepository });
    compare.mockResolvedValue(true);

    await authenticate(user.email, "senha-correta", "branch-1");

    expect(userRepository.update).toHaveBeenCalledWith(user.id, { lastAccessAt: expect.any(Date) });
    expect(userRepository.save).not.toHaveBeenCalled();
    expect(createSession).toHaveBeenCalledWith({ userId: user.id, name: user.name, email: user.email, role: user.role, branchId: "branch-1" });
  });
});
