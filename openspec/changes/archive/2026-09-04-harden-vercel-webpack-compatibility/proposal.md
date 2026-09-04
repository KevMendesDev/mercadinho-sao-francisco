## Why

O build de produção local conclui com sucesso e a configuração atual já evita o problema conhecido do `require` dinâmico de `pg` pelo TypeORM. Porém, o deploy serverless ainda tem pontos frágeis: o tracing inclui diretórios inteiros das dependências de `pg`, cada instância pode abrir até cinco conexões PostgreSQL, e módulos exclusivos de Node/ORM não possuem uma fronteira explícita contra importação acidental pelo cliente.

## What Changes

- Tornar explícita a fronteira de execução Node.js para banco, autenticação e serviços, impedindo que esses módulos entrem em um Client Component.
- Separar a configuração de runtime do TypeORM da configuração usada exclusivamente por migrations, reduzindo o código de migration presente nas Functions.
- Manter o carregamento explícito de `pg`, mas substituir inclusões amplas de tracing por uma lista mínima comprovada pelos arquivos `.nft.json` e por um deploy Preview na Vercel.
- Remover configurações de depuração de bundle que não sejam necessárias após a validação, incluindo `serverMinification: false` se não houver falha reproduzível.
- Controlar o tamanho do pool PostgreSQL por variável de ambiente, com padrão conservador para serverless, timeout de conexão e documentação de URL pooled/TLS.
- Criar uma verificação de compatibilidade que valide build, traces críticos e fluxos de login/entidades em Preview.

## Capabilities

### New Capabilities

- `serverless-deployment-compatibility`: Empacotamento e execução confiáveis da aplicação Node.js/TypeORM em Functions da Vercel.

### Modified Capabilities

- None.

## Impact

- Código afetado: `next.config.ts`, `src/database/data-source.ts`, scripts de migration/seed, módulos de autenticação/serviços e imports de enums compartilhados.
- Configuração afetada: variáveis `DATABASE_URL`, `DATABASE_DIRECT_URL` e nova configuração do pool/SSL, documentação de deploy e CI.
- Não há alteração de regra de negócio, schema nem migração de banco prevista.

