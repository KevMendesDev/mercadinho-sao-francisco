import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TypeORM usa recursos específicos do Node.js e deve continuar externo ao bundle.
  // O `pg` já faz parte da lista padrão de serverExternalPackages do Next.js.
  serverExternalPackages: ["typeorm", "reflect-metadata"],

};

export default nextConfig;
