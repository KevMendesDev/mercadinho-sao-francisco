const developmentAuthSecrets = new Set([
  "troque-por-uma-chave-longa-com-pelo-menos-32-caracteres",
]);

const developmentAdminEmails = new Set(["admin@mercadinho.local"]);
const developmentAdminPasswords = new Set(["troque-esta-senha"]);

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

export function validateSeedAdminCredentials(email: string, password: string): void {
  if (password.length < 8) throw new Error("Defina SEED_ADMIN_PASSWORD com pelo menos 8 caracteres.");
  if (!isProduction()) return;
  if (developmentAdminEmails.has(email) || developmentAdminPasswords.has(password)) {
    throw new Error("As credenciais padrão de desenvolvimento não podem ser usadas em produção.");
  }
  if (password.length < 16) throw new Error("SEED_ADMIN_PASSWORD deve ter pelo menos 16 caracteres em produção.");
}
