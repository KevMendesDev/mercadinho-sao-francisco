import "dotenv/config";
import { createCliDataSource } from "./data-source-cli";

const migrationUrl = process.env.DATABASE_DIRECT_URL ?? process.env.DATABASE_URL;
const dataSource = createCliDataSource(migrationUrl);

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
