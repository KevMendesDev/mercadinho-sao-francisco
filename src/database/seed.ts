import "dotenv/config";
import { hash } from "bcryptjs";
import { createDataSource } from "./data-source";
import { Branch, User, UserRole } from "./entities";
import { validateSeedAdminCredentials } from "@/lib/environment";

async function main() {
const password = process.env.SEED_ADMIN_PASSWORD;
if (!password) throw new Error("Defina SEED_ADMIN_PASSWORD.");
const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@mercadinho.local").trim().toLowerCase();
validateSeedAdminCredentials(email, password);

const dataSource = createDataSource();
try {
  await dataSource.initialize();
  const branchRepository = dataSource.getRepository(Branch);
  const branches = [
    { name: "Flamboyant", slug: "flamboyant" },
    { name: "Centro", slug: "centro" },
    { name: "Jardim América", slug: "jardim-america" },
  ];
  for (const item of branches) {
    if (!(await branchRepository.findOneBy({ slug: item.slug }))) await branchRepository.save(branchRepository.create(item));
  }

  const userRepository = dataSource.getRepository(User);
  const current = await userRepository.findOne({ where: { email }, withDeleted: true });
  if (!current) {
    await userRepository.save(userRepository.create({
      name: "Administrador",
      email,
      passwordHash: await hash(password, 12),
      role: UserRole.ADMIN,
      active: true,
      deletedAt: null,
    }));
    console.log(`Administrador criado: ${email}`);
  } else {
    console.log(`Administrador já existe: ${email}`);
  }
} finally {
  if (dataSource.isInitialized) await dataSource.destroy();
}

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
