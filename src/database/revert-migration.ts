import "dotenv/config";
import { createDataSource } from "./data-source";

const dataSource = createDataSource();
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
