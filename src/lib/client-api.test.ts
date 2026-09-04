import { afterEach, describe, expect, it, vi } from "vitest";
import { requestJson } from "./client-api";

describe("requestJson", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it.each(["POST", "PATCH", "DELETE"])("inclui CSRF em %s", async (method) => {
    vi.stubGlobal("window", { location: { origin: "https://app.test" } });
    vi.stubGlobal("document", { cookie: "msf_csrf=token-seguro" });
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 })); vi.stubGlobal("fetch", fetchMock);
    await requestJson("/api/test", { method }, "erro");
    expect(new Headers(fetchMock.mock.calls[0][1].headers).get("x-msf-csrf")).toBe("token-seguro");
  });

  it("não inclui CSRF em GET", async () => {
    vi.stubGlobal("window", { location: { origin: "https://app.test" } }); vi.stubGlobal("document", { cookie: "msf_csrf=token" });
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 })); vi.stubGlobal("fetch", fetchMock);
    await requestJson("/api/test", {}, "erro");
    expect(new Headers(fetchMock.mock.calls[0][1].headers).has("x-msf-csrf")).toBe(false);
  });
});
