## 1. Fronteiras de runtime

- [x] 1.1 Marcar DataSource, autenticação e serviços que dependem de Node/ORM como `server-only`; mover imports compartilháveis de `UserRole` para `entities/enums`; verificar que nenhum Client Component alcança TypeORM, `pg`, `node:*` ou `reflect-metadata`.
- [x] 1.2 Manter as rotas dependentes de Node fora de Edge e adicionar proteção de runtime apenas nos segmentos onde uma mudança futura poderia contrariar essa exigência; validar build de produção.

## 2. TypeORM, tracing e artefato

- [ ] 2.1 Separar a fábrica de DataSource de runtime da variante de CLI com migrations; atualizar migrate, revert e seed; validar migrations em banco vazio e build.
- [x] 2.2 Inventariar os `.nft.json` de login, produtos, estoque e páginas autenticadas; reduzir `outputFileTracingIncludes` aos arquivos de runtime realmente ausentes do trace automático, mantendo `pg` explícito como driver.
- [ ] 2.3 Testar com minificação padrão; remover `serverMinification: false` se build, trace e Preview funcionarem; manter qualquer exceção somente com falha reproduzível documentada.

## 3. Conexão PostgreSQL em Functions

- [x] 3.1 Adicionar e validar variáveis para máximo do pool, timeout de conexão e TLS quando aplicável; definir padrão de produção conservador e preservar comportamento local.
- [x] 3.2 Atualizar `.env.example` e documentação com URL pooled para runtime, URL direta para CLI/migrations e cálculo de conexões por instância.
- [ ] 3.3 Executar carga controlada em Preview e observar conexões, latência e erros; ajustar o teto do pool com base no limite do provedor.

## 4. Verificação de deploy

- [x] 4.1 Criar verificação automatizada de build/trace para garantir que artefatos de rotas críticas contenham dependências de TypeORM/`pg` necessárias e não incluam árvores inteiras desnecessárias.
- [ ] 4.2 Configurar Preview com as variáveis da Vercel e banco migrado; testar login, listagem de produtos/usuários, busca externa degradada e uma mutação protegida por CSRF.
- [ ] 4.3 Rodar `npm run lint`, `npm run typecheck`, `npm test` e `npm run build`; registrar tamanho dos traces, conexões e resultado do Preview antes de produção.
