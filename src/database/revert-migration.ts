import "dotenv/config";
import { createDataSource } from "./data-source";

const migrationUrl = process.env.DATABASE_DIRECT_URL ?? process.env.DATABASE_URL;
const dataSource = createDataSource(migrationUrl);

async function main() {
  try {
    await dataSource.initialize();
    await dataSource.undoLastMigration({ transaction: "all" });
    console.log("Última migration revertida.");
  } finally {
    if (dataSource.isInitialized) await dataSource.destroy();
  }
}

void main();
