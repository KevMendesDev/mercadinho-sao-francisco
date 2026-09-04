# Deploy na Vercel

A aplicação é um projeto Next.js full-stack. A Vercel detecta o framework automaticamente; não é necessário `vercel.json` para o deploy padrão.

## 1. Banco PostgreSQL

Use um PostgreSQL acessível pela internet e com TLS conforme exigido pelo provedor.

Configure:

- `DATABASE_URL`: conexão usada pela aplicação em runtime. Em ambiente serverless, prefira a URL com pooler oferecida pelo provedor.
- `DATABASE_DIRECT_URL`: opcional, conexão direta sem pooler para migrations e seed. Se não existir, os scripts usam `DATABASE_URL`.

Não use o PostgreSQL do `docker-compose.yml` em produção; ele é apenas para desenvolvimento local.

## 2. Variáveis de ambiente na Vercel

Cadastre no projeto, no mínimo:

- `DATABASE_URL`
- `AUTH_SECRET`
- `OPEN_FOOD_FACTS_USER_AGENT`

`AUTH_SECRET` deve possuir pelo menos 32 caracteres e não pode usar o valor de exemplo do repositório.

`DATABASE_DIRECT_URL`, `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD` são necessários apenas no ambiente onde você executar migrations/seed. Não é obrigatório expor as credenciais de seed ao runtime da aplicação na Vercel.

## 3. Preparar o banco no primeiro deploy

Em uma máquina confiável, configure as variáveis do banco de produção e execute:

```bash
npm ci
npm run db:migrate
npm run db:seed
```

Em produção, `SEED_ADMIN_PASSWORD` deve ter pelo menos 16 caracteres e não pode ser a senha de exemplo.

As migrations não são executadas dentro do `next build` de propósito. Isso evita que builds de Preview ou re-deploys alterem o schema automaticamente.

## 4. Criar o projeto na Vercel

1. Importe o repositório `KevMendesDev/mercadinho-sao-francisco`.
2. Framework Preset: `Next.js`.
3. Root Directory: raiz do repositório.
4. Install Command: padrão (`npm install`/`npm ci` detectado pela Vercel).
5. Build Command: pode permanecer automático; o projeto também possui `npm run vercel-build`.
6. Adicione as variáveis de ambiente antes do primeiro deploy funcional.

Para testar esta preparação antes de integrar na `main`, faça o deploy da branch `preparar-para-prod` como Preview.

## 5. Atualizações futuras de schema

Quando houver uma nova migration:

1. configure `DATABASE_DIRECT_URL` ou `DATABASE_URL` para o banco alvo;
2. execute `npm run db:migrate` uma única vez;
3. só então promova/deploye a versão da aplicação que depende desse schema.

## Observações de runtime

- O build usa `next build`, sem forçar `NODE_ENV` por sintaxe de shell.
- TypeORM, `pg` e `reflect-metadata` permanecem em `serverExternalPackages` no Next.js.
- Em produção, o pool local do driver PostgreSQL é limitado a 5 conexões por instância serverless; ainda é recomendado usar o pooler do provedor em `DATABASE_URL`.
- O cache global do `DataSource` é reutilizado enquanto a instância serverless permanecer ativa.
