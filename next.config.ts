import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TypeORM usa recursos específicos do Node.js e deve continuar externo ao bundle.
  // O `pg` já faz parte da lista padrão de serverExternalPackages do Next.js.
  serverExternalPackages: ["typeorm", "reflect-metadata"],

  // A Vercel monta cada Function a partir do output tracing do Next.js. Como o
  // TypeORM resolve o driver PostgreSQL em runtime, garantimos explicitamente que
  // o `pg` e suas dependências de execução sejam incluídos no artefato serverless.
  outputFileTracingIncludes: {
    "/*": [
      "./node_modules/pg/**/*",
      "./node_modules/pg-connection-string/**/*",
      "./node_modules/pg-pool/**/*",
      "./node_modules/pg-protocol/**/*",
      "./node_modules/pg-types/**/*",
      "./node_modules/pgpass/**/*",
      "./node_modules/pg-int8/**/*",
      "./node_modules/pg-cloudflare/**/*",
      "./node_modules/postgres-array/**/*",
      "./node_modules/postgres-bytea/**/*",
      "./node_modules/postgres-date/**/*",
      "./node_modules/postgres-interval/**/*",
      "./node_modules/split2/**/*",
      "./node_modules/xtend/**/*",
    ],
  },
};

export default nextConfig;
