import "dotenv/config";
import { createCliDataSource } from "./data-source-cli";

const migrationUrl = process.env.DATABASE_DIRECT_URL ?? process.env.DATABASE_URL;
const dataSource = createCliDataSource(migrationUrl);

async function main() {
  try {
    await dataSource.initialize();
    const migrations = await dataSource.runMigrations({ transaction: "all" });
    console.log(migrations.length ? `Migrations executadas: ${migrations.map((m) => m.name).join(", ")}` : "Banco já está atualizado.");
  } finally {
    if (dataSource.isInitialized) await dataSource.destroy();
  }
}

void main();
