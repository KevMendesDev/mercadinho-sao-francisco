import "server-only";
import "reflect-metadata";
import * as pg from "pg";
import { DataSource } from "typeorm";
import { AuditLog, Branch, Category, LoginRateLimit, Product, StockBatch, StockMovement, User, UserBranch, UserSession } from "./entities";

// O TypeORM carrega o driver PostgreSQL dinamicamente com require("pg") por padrão.
// Em runtimes serverless/bundled (como Vercel), esse require dinâmico pode não ser
// detectado pelo rastreamento de dependências. Exigimos o módulo explicitamente e
// o entregamos ao TypeORM para garantir que o pg faça parte da Function.
export const entities = [AuditLog, Branch, Category, LoginRateLimit, Product, StockBatch, StockMovement, User, UserBranch, UserSession];

function databaseUrl(overrideUrl?: string): string {
  const url = overrideUrl ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL não configurada.");
  if (!/^postgres(?:ql)?:\/\//.test(url)) throw new Error("DATABASE_URL deve usar o protocolo PostgreSQL.");
  return url;
}

function optionalPositiveInteger(name: string, fallback?: number): number | undefined {
  const value = process.env[name];
  if (!value) return fallback;
  if (!/^\d+$/.test(value) || Number(value) < 1) throw new Error(`${name} deve ser um inteiro positivo.`);
  return Number(value);
}

function databaseSsl(): { rejectUnauthorized: boolean } | undefined {
  const value = process.env.DATABASE_SSL;
  if (!value || value === "false") return undefined;
  if (value !== "true") throw new Error("DATABASE_SSL deve ser true ou false.");
  const rejectUnauthorized = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED;
  if (rejectUnauthorized && rejectUnauthorized !== "true" && rejectUnauthorized !== "false") {
    throw new Error("DATABASE_SSL_REJECT_UNAUTHORIZED deve ser true ou false.");
  }
  return { rejectUnauthorized: rejectUnauthorized !== "false" };
}

export function createDataSource(overrideUrl?: string): DataSource {
  const production = process.env.NODE_ENV === "production";
  const max = optionalPositiveInteger("DATABASE_POOL_MAX", production ? 1 : undefined);
  const connectionTimeoutMillis = optionalPositiveInteger("DATABASE_CONNECTION_TIMEOUT_MS", production ? 5000 : undefined);
  const ssl = databaseSsl();
  return new DataSource({
    type: "postgres",
    driver: pg,
    url: databaseUrl(overrideUrl),
    entities,
    synchronize: false,
    logging: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    extra: max || connectionTimeoutMillis || ssl ? { max, connectionTimeoutMillis, ssl } : undefined,
  });
}

declare global {
  var __mercadinhoDataSource: DataSource | undefined;
  var __mercadinhoDataSourcePromise: Promise<DataSource> | undefined;
}

export async function getDataSource(): Promise<DataSource> {
  const existing = globalThis.__mercadinhoDataSource;
  if (existing?.isInitialized) {
    return existing;
  }

  if (globalThis.__mercadinhoDataSourcePromise) {
    return globalThis.__mercadinhoDataSourcePromise;
  }

  const dataSource = createDataSource();
  globalThis.__mercadinhoDataSourcePromise = dataSource.initialize()
    .then((initializedDataSource) => {
      globalThis.__mercadinhoDataSource = initializedDataSource;
      return initializedDataSource;
    })
    .catch((error) => {
      globalThis.__mercadinhoDataSourcePromise = undefined;
      throw error;
    });
  return globalThis.__mercadinhoDataSourcePromise;
}
