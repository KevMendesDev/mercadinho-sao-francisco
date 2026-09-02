# Mercadinho São Francisco

Sistema web para controle de produtos, estoque por filial/lote, validade, movimentações e usuários.

## Stack

- Next.js 16 + TypeScript
- PostgreSQL
- TypeORM 1.x
- Tailwind CSS 4
- Autenticação própria com cookie HttpOnly/JWT assinado
- Zod para validação

## Subindo localmente

1. Copie `.env.example` para `.env`. Os valores padrão são apenas para desenvolvimento; altere `AUTH_SECRET` e a senha do admin antes de produção.
2. Suba o PostgreSQL: `docker compose up -d`.
3. Instale dependências: `npm install`.
4. Rode as migrations: `npm run db:migrate`.
5. Crie dados iniciais: `npm run db:seed`.
6. Inicie: `npm run dev`.

O seed cria as filiais de demonstração **Flamboyant**, **Centro** e **Jardim América** e o administrador definido no `.env`. Ajuste as filiais reais antes de produção.

## Regras centrais implementadas

- Produto pertence ao catálogo global e pode ser criado por `ADMIN` e `MANAGER`.
- Estoque é separado por filial e lote/validade.
- Quantidade não é corrigida diretamente: alterações passam por `StockMovement` (`ENTRY`, `EXIT`, `ADJUSTMENT`).
- Saída usa FEFO (lotes com validade mais próxima primeiro).
- Movimentações possuem origem (`MANUAL`, `PDV`, `INTEGRATION`, `SYSTEM`) para permitir futura integração com PDV sem acoplar a regra de estoque.
- Busca por código de barras consulta primeiro o banco local e só então o Open Food Facts.
- Usuários são desativados logicamente, preservando histórico e permitindo reativação.
- `ADMIN` opera todas as filiais; `MANAGER` e `OPERATOR` operam apenas filiais vinculadas.

## Documentação

- [Arquitetura e padrões](docs/ARCHITECTURE.md)
- [Desenvolvimento e migrations](docs/DEVELOPMENT.md)
- [Segurança e produção](docs/SECURITY.md)
- [Notas de validação](docs/DELIVERY_NOTES.md)
- [Checklist funcional](docs/IMPLEMENTATION_CHECKLIST.md)

## Referências visuais

Os mockups aprovados estão em `docs/design-reference/` e são a base visual das telas do sistema.
