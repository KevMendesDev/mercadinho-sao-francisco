# Checklist de implementação — Mercadinho São Francisco

Prioridade definida para reduzir retrabalho e manter as regras de estoque/auditoria corretas desde o início.

## P0 — Fundação

- [x] Estruturar Next.js + TypeScript + Tailwind CSS 4.
- [x] Configurar PostgreSQL + TypeORM.
- [x] Criar migration inicial versionada.
- [x] Criar entidades principais: Branch, User, UserBranch, Product, StockBatch, StockMovement e AuditLog.
- [x] Criar seed inicial de filiais e administrador.
- [x] Documentar setup local e variáveis de ambiente.

## P0 — Segurança e acesso

- [x] Login por e-mail/senha com hash bcrypt.
- [x] Sessão em cookie HttpOnly assinado.
- [x] Bloquear usuários inativos/desativados.
- [x] Perfis `ADMIN`, `MANAGER` e `OPERATOR`.
- [x] Restringir acesso por filial para Manager/Operator.
- [x] Implementar troca segura de filial ativa.
- [x] Implementar logout.
- [ ] Recuperação de senha por e-mail.
- [x] Rate limit persistente de login.

## P1 — Interface base

- [x] Reproduzir identidade visual preta/amarela aprovada.
- [x] Tela de login baseada no mockup aprovado.
- [x] Sidebar e topbar reutilizáveis.
- [x] Dashboard inicial com indicadores reais do banco.
- [x] Responsividade básica para notebook/tablet.
- [ ] Refinar versão mobile para operação diária.

## P1 — Produtos

- [x] Listagem paginada e busca.
- [x] Cadastro global por `ADMIN`/`MANAGER`.
- [x] Código de barras único.
- [x] Consulta local antes do Open Food Facts.
- [x] Fallback no Open Food Facts para código não cadastrado.
- [x] Edição completa do produto.
- [ ] Exclusão lógica/desativação de produto.
- [x] Cadastro formal de categorias em tabela própria.

## P1 — Estoque e validade

- [x] Entrada de estoque por filial, produto, quantidade e validade.
- [x] Geração de lote interno por entrada.
- [x] Movimento `ENTRY` auditável.
- [x] Saída FEFO com movimento `EXIT`.
- [x] Serviço de ajuste por movimento `ADJUSTMENT` (sem alteração silenciosa).
- [x] Tela de estoque por lote.
- [x] Tela de validades ordenada por vencimento.
- [x] Tela de movimentações.
- [x] Interface de saída/baixa manual.
- [x] Interface de ajuste com motivo obrigatório.
- [ ] Alertas configuráveis de validade e estoque baixo.

## P1 — Administração de usuários

- [x] Listagem de usuários para Admin.
- [x] Criar usuário.
- [x] Editar nome, perfil, status e filiais.
- [x] Exclusão lógica/desativação.
- [x] Reativação preservando histórico.
- [ ] Convite por e-mail para definição de senha.
- [ ] Alteração de senha pelo próprio usuário.

## P2 — Auditoria, qualidade e produção

- [x] AuditLog para operações sensíveis principais.
- [x] Preparar origem das movimentações para futura integração com PDV.
- [x] Testes unitários de estoque, paginação, erros de API e datas.
- [ ] Testes de integração das rotas críticas.
- [ ] E2E do fluxo login → produto → entrada → validade.
- [ ] CI no GitHub Actions.
- [ ] Observabilidade/log estruturado.
- [ ] Backup e estratégia de restore do PostgreSQL.
- [ ] Deploy de homologação.

## P3 — Futuro

- [ ] Integração com o PDV/sistema de vendas quando fornecedor/API forem confirmados.
- [ ] Relatórios operacionais completos.
- [ ] Notificações automáticas.
- [ ] PWA/offline conforme necessidade real de operação.
