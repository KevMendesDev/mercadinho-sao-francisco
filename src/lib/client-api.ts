export async function requestJson<T = Record<string, unknown>>(input: RequestInfo | URL, init: RequestInit, fallbackMessage: string): Promise<T> {
  let response: Response;
  try {
    const method = (init.method ?? "GET").toUpperCase();
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url, window.location.origin);
    const headers = new Headers(init.headers);
    if (["POST", "PUT", "PATCH", "DELETE"].includes(method) && url.origin === window.location.origin) {
      const csrf = document.cookie.split("; ").find((cookie) => cookie.startsWith("msf_csrf="))?.slice("msf_csrf=".length);
      if (csrf && !headers.has("x-msf-csrf")) headers.set("x-msf-csrf", decodeURIComponent(csrf));
    }
    response = await fetch(input, { ...init, headers });
  } catch {
    throw new Error("Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.");
  }
  const data = await response.json().catch(() => ({})) as { error?: string };
  if (!response.ok) throw new Error(data.error ?? fallbackMessage);
  return data as T;
}
