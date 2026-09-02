# Arquitetura

## Visão geral

Monólito modular em Next.js App Router. Páginas são Server Components; interações pontuais ficam em Client Components. As APIs são Route Handlers e não há Server Actions.

```text
Página/Client Component → Route Handler → Serviço → TypeORM/PostgreSQL
```

- `src/app`: rotas, layouts e Route Handlers.
- `src/components`: UI e estado local de interação; não contém regra de negócio ou acesso ao banco.
- `src/lib/services`: regras de domínio, transações e consultas reutilizáveis.
- `src/lib/auth`: sessão JWT e autorização por perfil/filial.
- `src/lib/validation`: schemas Zod usados no servidor.
- `src/database`: entidades, migrations e seed.

## Padrões obrigatórios

- Toda entrada mutável passa por schema Zod no Route Handler.
- Route Handlers chamam `requireApiUser` e, quando a operação é por filial, `assertBranchAccess`.
- Serviços concentram transações e registram auditoria quando há mudança sensível.
- Componentes cliente usam `requestJson` para apresentar falhas de rede/API e sempre liberar estado de envio.
- Consultas de lista são paginadas e ajustam páginas além do total para a última página válida.
- Respostas de erro de domínio passam por `apiError`; erro inesperado não expõe detalhes internos.

## Estoque

`StockBatch` é o saldo físico por `Product + Branch + expirationDate`. Alterações passam exclusivamente por `StockService`:

```text
Entrada/Saída/Ajuste → transação → StockBatch + StockMovement + AuditLog
```

- Saídas usam bloqueio pessimista e ordem FEFO.
- Ajustes criam movimento; não há alteração silenciosa de saldo.
- Produtos são globais. A tela de estoque os busca sob demanda por API, evitando enviar todo o catálogo ao cliente.

## Acesso

- `ADMIN`: todas as filiais e gestão de usuários.
- `MANAGER`: filiais vinculadas, catálogo global e operações de estoque permitidas.
- `OPERATOR`: filiais vinculadas e operações de estoque permitidas; não administra usuários nem catálogo.

A sessão é um JWT assinado, mantido em cookie `HttpOnly`, `SameSite=Lax` e `Secure` em produção. A cada proteção de rota, usuário, filial e vínculo são confirmados no banco.

## Datas

Datas de validade são datas-calendário. `src/lib/date.ts` centraliza o fuso de negócio `America/Sao_Paulo`; não use `toISOString().slice(0, 10)` para regras de validade.

## Concorrência e integridade

- Saldo: bloqueios pessimistas no serviço de estoque.
- Último administrador ativo: lock transacional PostgreSQL em atualizações de usuário.
- Unicidade: constraints do banco são a garantia final; `apiError` converte violação única do PostgreSQL em `409`.
- Categorias possuem índice único case-insensitive criado por migration.
