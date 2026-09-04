import "reflect-metadata";
import * as pg from "pg";
import { DataSource } from "typeorm";
import { AuditLog, Branch, Category, LoginRateLimit, Product, StockBatch, StockMovement, User, UserBranch, UserSession } from "./entities";
import { InitialSchema1787700000000 } from "./migrations/1787700000000-InitialSchema";
import { CategoriesAndProductDetails1787800000000 } from "./migrations/1787800000000-CategoriesAndProductDetails";
import { LoginRateLimitsAndCategoryNameIndex1787900000000 } from "./migrations/1787900000000-LoginRateLimitsAndCategoryNameIndex";
import { UserSessions1788000000000 } from "./migrations/1788000000000-UserSessions";

const entities = [AuditLog, Branch, Category, LoginRateLimit, Product, StockBatch, StockMovement, User, UserBranch, UserSession];
const migrations = [InitialSchema1787700000000, CategoriesAndProductDetails1787800000000, LoginRateLimitsAndCategoryNameIndex1787900000000, UserSessions1788000000000];

export function createCliDataSource(url?: string): DataSource {
  const databaseUrl = url ?? process.env.DATABASE_DIRECT_URL ?? process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_DIRECT_URL ou DATABASE_URL não configurada.");
  if (!/^postgres(?:ql)?:\/\//.test(databaseUrl)) throw new Error("A URL do banco deve usar o protocolo PostgreSQL.");
  return new DataSource({ type: "postgres", driver: pg, url: databaseUrl, entities, migrations, synchronize: false, logging: ["error"] });
}
