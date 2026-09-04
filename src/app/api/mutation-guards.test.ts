import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname);
const authenticatedMutations = [
  "auth/logout/route.ts", "auth/switch-branch/route.ts", "users/route.ts", "users/[id]/route.ts",
  "categories/route.ts", "categories/[id]/route.ts", "products/route.ts", "products/[id]/route.ts",
  "stock/entries/route.ts", "stock/exit/route.ts", "stock/batches/[id]/adjust/route.ts",
];

describe("inventário de guardas de mutação", () => {
  it.each(authenticatedMutations)("protege %s com a validação CSRF de sessão", (file) => {
    expect(readFileSync(resolve(root, file), "utf8")).toContain("assertSessionCsrf(request, session)");
  });

  it("protege login apenas pela origem", () => {
    const login = readFileSync(resolve(root, "auth/login/route.ts"), "utf8");
    expect(login).toContain("assertSameOrigin(request)");
    expect(login).not.toContain("assertSessionCsrf");
  });
});
