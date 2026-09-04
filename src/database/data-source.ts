import "reflect-metadata";
import * as pg from "pg";
import { DataSource } from "typeorm";
import { AuditLog, Branch, Category, LoginRateLimit, Product, StockBatch, StockMovement, User, UserBranch, UserSession } from "./entities";
import { InitialSchema1787700000000 } from "./migrations/1787700000000-InitialSchema";
import { CategoriesAndProductDetails1787800000000 } from "./migrations/1787800000000-CategoriesAndProductDetails";
import { LoginRateLimitsAndCategoryNameIndex1787900000000 } from "./migrations/1787900000000-LoginRateLimitsAndCategoryNameIndex";
import { UserSessions1788000000000 } from "./migrations/1788000000000-UserSessions";

// O TypeORM carrega o driver PostgreSQL dinamicamente com require("pg") por padrão.
// Em runtimes serverless/bundled (como Vercel), esse require dinâmico pode não ser
// detectado pelo rastreamento de dependências. Exigimos o módulo explicitamente e
// o entregamos ao TypeORM para garantir que o pg faça parte da Function.
const entities = [AuditLog, Branch, Category, LoginRateLimit, Product, StockBatch, StockMovement, User, UserBranch, UserSession];

function databaseUrl(overrideUrl?: string): string {
  const url = overrideUrl ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL não configurada.");
  return url;
}

export function createDataSource(overrideUrl?: string): DataSource {
  return new DataSource({
    type: "postgres",
    driver: pg,
    url: databaseUrl(overrideUrl),
    entities,
    migrations: [InitialSchema1787700000000, CategoriesAndProductDetails1787800000000, LoginRateLimitsAndCategoryNameIndex1787900000000, UserSessions1788000000000],
    synchronize: false,
    logging: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    extra: process.env.NODE_ENV === "production" ? { max: 5 } : undefined,
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
