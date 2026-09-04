import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const routes = [
  "api/auth/login/route",
  "api/products/route",
  "api/stock/entries/route",
  "(app)/products/page",
];

for (const route of routes) {
  const tracePath = resolve(".next/server/app", `${route}.js.nft.json`);
  if (!existsSync(tracePath)) throw new Error(`Trace ausente: ${tracePath}`);

  const files = JSON.parse(readFileSync(tracePath, "utf8")).files.map((file) => resolve(dirname(tracePath), file).replaceAll("\\", "/"));
  const includes = (file) => files.some((entry) => entry.endsWith(file));
  if (!includes("node_modules/pg/lib/index.js")) throw new Error(`${route}: pg ausente do trace.`);
  if (!includes("node_modules/typeorm/data-source/DataSource.js")) throw new Error(`${route}: TypeORM ausente do trace.`);

  const runtimeFiles = files.filter((file) => /node_modules\/(pg|typeorm)\//.test(file));
  if (runtimeFiles.length > 350) throw new Error(`${route}: trace de pg/TypeORM excede o limite de runtime.`);
  if (runtimeFiles.some((file) => /(^|\/)(test|tests|docs)(\/|$)|\.(map|d\.ts)$/i.test(file))) {
    throw new Error(`${route}: trace contém arquivos que não são de runtime.`);
  }
}

console.log("Traces críticos de pg e TypeORM validados.");
