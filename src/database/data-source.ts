import "reflect-metadata";
import { DataSource } from "typeorm";
import { AuditLog, Branch, Category, LoginRateLimit, Product, StockBatch, StockMovement, User, UserBranch } from "./entities";
import { InitialSchema1787700000000 } from "./migrations/1787700000000-InitialSchema";
import { CategoriesAndProductDetails1787800000000 } from "./migrations/1787800000000-CategoriesAndProductDetails";
import { LoginRateLimitsAndCategoryNameIndex1787900000000 } from "./migrations/1787900000000-LoginRateLimitsAndCategoryNameIndex";

const entities = [AuditLog, Branch, Category, LoginRateLimit, Product, StockBatch, StockMovement, User, UserBranch];

function databaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL não configurada.");
  return url;
}

export function createDataSource(): DataSource {
  return new DataSource({
    type: "postgres",
    url: databaseUrl(),
    entities,
    migrations: [InitialSchema1787700000000, CategoriesAndProductDetails1787800000000, LoginRateLimitsAndCategoryNameIndex1787900000000],
    synchronize: false,
    logging: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

declare global {
  var __mercadinhoDataSource: DataSource | undefined;
  var __mercadinhoDataSourcePromise: Promise<DataSource> | undefined;
}

export async function getDataSource(): Promise<DataSource> {
  const existing = globalThis.__mercadinhoDataSource;
  if (existing?.isInitialized && entities.every((entity) => existing.hasMetadata(entity))) {
    return existing;
  }

  // No hot reload, as classes das entidades podem ser recriadas. Os metadados
  // do DataSource anterior ficam associados às referências antigas.
  if (existing?.isInitialized) {
    globalThis.__mercadinhoDataSource = undefined;
    globalThis.__mercadinhoDataSourcePromise = existing.destroy()
      .then(() => createDataSource().initialize())
      .then((dataSource) => {
        globalThis.__mercadinhoDataSource = dataSource;
        return dataSource;
      })
      .catch((error) => {
        globalThis.__mercadinhoDataSourcePromise = undefined;
        throw error;
      });
    return globalThis.__mercadinhoDataSourcePromise;
  }

  if (!globalThis.__mercadinhoDataSourcePromise) {
    const dataSource = createDataSource();
    globalThis.__mercadinhoDataSourcePromise = dataSource.initialize()
      .then(() => { globalThis.__mercadinhoDataSource = dataSource; return dataSource; })
      .catch((error) => { globalThis.__mercadinhoDataSourcePromise = undefined; throw error; });
  }
  return globalThis.__mercadinhoDataSourcePromise;
}
