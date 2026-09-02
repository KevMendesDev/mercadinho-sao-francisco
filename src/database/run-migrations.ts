import "dotenv/config";
import { createDataSource } from "./data-source";

const dataSource = createDataSource();
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
