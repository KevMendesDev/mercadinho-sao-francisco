import "server-only";
const developmentAuthSecrets = new Set([
  "troque-por-uma-chave-longa-com-pelo-menos-32-caracteres",
]);

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export function requireAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET deve ter pelo menos 32 caracteres.");
  if (isProduction() && developmentAuthSecrets.has(secret)) {
    throw new Error("AUTH_SECRET de desenvolvimento não pode ser usado em produção.");
  }
  return secret;
}
