const developmentAdminEmails = new Set(["admin@mercadinho.local"]);
const developmentAdminPasswords = new Set(["troque-esta-senha"]);

export function validateSeedAdminCredentials(email: string, password: string): void {
  if (password.length < 8) throw new Error("Defina SEED_ADMIN_PASSWORD com pelo menos 8 caracteres.");
  if (process.env.NODE_ENV !== "production") return;
  if (developmentAdminEmails.has(email) || developmentAdminPasswords.has(password)) {
    throw new Error("As credenciais padrão de desenvolvimento não podem ser usadas em produção.");
  }
  if (password.length < 16) throw new Error("SEED_ADMIN_PASSWORD deve ter pelo menos 16 caracteres em produção.");
}
