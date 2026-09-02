# Desenvolvimento

## Rotina local

```bash
npm install
docker compose up -d
npm run db:migrate
npm run db:seed
npm run dev
```

Copie `.env.example` para `.env` antes da primeira execução. Os valores de exemplo funcionam apenas em desenvolvimento e devem ser substituídos antes de qualquer deploy.

## Comandos de qualidade

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Banco

Migrations são versionadas em `src/database/migrations`. Não use `synchronize`; mudanças de schema exigem uma nova migration com `up` e `down` coerentes.

```bash
npm run db:migrate
npm run db:revert
```

`db:revert` reverte somente a última migration. Use apenas depois de backup e nunca como procedimento de recuperação sem validar dependências de dados.
