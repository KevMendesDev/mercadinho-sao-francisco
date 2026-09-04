## Context

O projeto é Next.js 16 App Router, com páginas e Route Handlers dinâmicos que usam TypeORM, `pg`, decorators e `node:crypto`. O build local de produção passou em 04/09/2026. `next.config.ts` já externaliza `typeorm` e `reflect-metadata`, importa `pg` explicitamente como driver e inclui, para todas as rotas, árvores completas de 14 pacotes de `pg` no output trace.

Os traces gerados para login contêm esses arquivos, portanto o problema original de dependência ausente está mitigado. A inclusão atual, porém, leva também fontes, testes, mapas e declarações de tipos ao artefato. O DataSource também carrega todas as migrations em cada Function e define `extra.max: 5` em produção; em múltiplas instâncias serverless isso pode exceder rapidamente o limite do PostgreSQL.

Não há rota Edge, acesso ao sistema de arquivos em runtime, dependência nativa de bcrypt, nem importação atual de banco em Client Components. O scanner de código de barras já faz import dinâmico somente no cliente.

## Goals / Non-Goals

**Goals:**

- Preservar o carregamento confiável de TypeORM/PostgreSQL em Vercel e em servidores Node.js.
- Reduzir artefatos serverless sem depender de comportamento implícito de bundler.
- Evitar exaustão de conexões em escala e tornar a configuração operacional explícita.
- Detectar regressões antes do deploy de produção.

**Non-Goals:**

- Migrar de TypeORM, trocar o banco, executar migrations no build da Vercel ou mover APIs para Edge.
- Alterar regras de autenticação, entidades ou fluxos de tela.
- Otimizar consultas de negócio fora do impacto direto de Functions.

## Decisions

### Fronteira server-only e runtime Node

Adicionar a barreira `server-only` aos módulos que acessam banco, criptografia Node, cookies e serviços. Extrair imports de enum usados em validação/cliente para `entities/enums`, evitando que um schema compartilhável importe o barrel que inicializa `reflect-metadata` e reexporta entidades.

As rotas continuarão no runtime Node.js padrão do Next.js. Não será introduzido Edge: TypeORM, `pg`, `Buffer` no parser de login e `node:crypto` exigem Node. A configuração explícita de runtime será usada somente onde necessária como proteção contra futura alteração de segmento, evitando repetição indiscriminada em cada rota.

### DataSource de aplicação separado do DataSource de CLI

O DataSource de runtime registrará somente entidades. Um construtor específico para CLI acrescentará migrations e será usado por `db:migrate` e `db:revert`. Assim, cada Function não traceja nem avalia classes de migration que ela não executa.

O driver `pg` continuará importado estaticamente e passado ao TypeORM. Isso é o vínculo que impede o carregamento dinâmico não detectado pelo bundler/tracer.

### Tracing mínimo, baseado em evidência

Antes de alterar `outputFileTracingIncludes`, registrar os arquivos efetivamente requeridos pelos `.nft.json` de login, páginas autenticadas e rotas de estoque. Reduzir a lista atual para o menor conjunto de arquivos de runtime que o trace automático não detectar, sem incluir `.ts`, `.d.ts`, testes, mapas ou documentação. Se o import estático de `pg` fizer o trace completo corretamente, remover a inclusão manual; se não, manter somente os padrões indispensáveis.

`serverExternalPackages` permanecerá para TypeORM e metadata. `pg` já é externalizado automaticamente pelo Next.js, portanto não será duplicado nessa configuração. `serverMinification: false` será removido após build, trace e Preview comprovarem que não mascara uma falha real.

### Pool e conectividade PostgreSQL adequados a serverless

Adicionar variáveis validadas para máximo de conexões por instância, timeout de conexão e, quando requerido pelo provedor, TLS. Em produção o padrão do pool será baixo e documentado para uso com URL pooled; migrations e seed continuarão preferindo `DATABASE_DIRECT_URL`.

O DataSource global continuará reutilizando uma conexão em instâncias quentes, mas não será tratado como pool global: cada Function/instância pode possuir seu próprio processo. A documentação incluirá como calcular o limite a partir da concorrência esperada e do limite do provedor.

### Verificação de entrega

Incluir uma rotina de CI/preview que rode `npm ci`, typecheck, lint, testes e build; examine os traces das rotas críticas por TypeORM/`pg`; e execute smoke tests de login, leitura de entidades e uma mutação autenticada contra um banco de Preview migrado. Migrations permanecerão uma etapa explícita anterior à liberação do código.

## Risks / Trade-offs

- [Remover includes pode reintroduzir `MODULE_NOT_FOUND` somente na Function] -> validar traces e Preview antes de remover cada padrão; reverter para a lista mínima comprovada se necessário.
- [Pool baixo aumenta espera sob carga] -> usar URL pooled, timeout claro e ajustar por métrica, sem abrir cinco conexões por instância por padrão.
- [`server-only` pode expor importação indevida já existente] -> corrigir o import para enums/tipos puros; isto é uma falha de fronteira desejável durante o build.
- [Separar DataSources pode divergir entidades/migrations] -> compartilhar a lista de entidades e cobrir os dois comandos de CLI em testes de integração.

## Migration Plan

1. Implantar primeiro em Preview com variáveis de banco pooled e, se necessário, TLS.
2. Executar migrations fora do build com `DATABASE_DIRECT_URL` antes de promover o deploy.
3. Validar login, listagem de entidades, mutação de estoque e logs de conexão/erros da Function.
4. Se houver falha de trace, restaurar somente o padrão de inclusão faltante; se houver saturação, reduzir a concorrência/pool antes de escalar o limite do banco.

