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

## Deploy serverless

No runtime, use `DATABASE_URL` com a URL pooled do provedor. Para `db:migrate`, `db:revert` e `db:seed`, defina `DATABASE_DIRECT_URL` com a URL direta. Execute migrations antes da promoção; elas não fazem parte do build.

Em produção, cada instância usa por padrão `DATABASE_POOL_MAX=1` e timeout de 5 s. O teto total deve respeitar `instâncias concorrentes × DATABASE_POOL_MAX`, com margem para migrations, painel do provedor e conexões administrativas. Ajuste apenas após observar conexões, latência e erros em Preview.

Quando o provedor exigir TLS, use `DATABASE_SSL=true`. Mantenha `DATABASE_SSL_REJECT_UNAUTHORIZED=true`, exceto se a documentação do provedor determinar outra configuração.
