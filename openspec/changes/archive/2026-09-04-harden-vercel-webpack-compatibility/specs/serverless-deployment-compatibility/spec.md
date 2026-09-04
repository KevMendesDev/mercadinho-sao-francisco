## Purpose

Garantir que as Functions da aplicação sejam empacotadas e executadas com TypeORM/PostgreSQL de forma previsível em Vercel e em ambientes Node.js compatíveis.

## ADDED Requirements

### Requirement: Módulos de infraestrutura permanecem no servidor Node.js

O sistema SHALL impedir que módulos que dependem de TypeORM, `pg`, `reflect-metadata`, APIs `node:*`, cookies de servidor ou credenciais sejam importados por Client Components. Rotas que usam esses módulos SHALL executar em runtime Node.js e não podem depender de Edge Runtime.

#### Scenario: Importação acidental por componente cliente

- **WHEN** um Client Component tentar importar um módulo de banco, autenticação ou serviço de servidor
- **THEN** o build falha antes do deploy com uma indicação de violação da fronteira servidor/cliente

#### Scenario: Rota autenticada é compilada

- **WHEN** o build de produção compilar uma página ou Route Handler autenticado
- **THEN** ela é gerada para execução Node.js sem tentar empacotar APIs Node no bundle do navegador ou Edge

### Requirement: Dependências dinâmicas do PostgreSQL estão presentes no artefato

O sistema SHALL manter o driver `pg` explicitamente ligado ao DataSource TypeORM e SHALL incluir no output trace somente os arquivos de runtime necessários para cada Function. O sistema SHALL validar os traces das rotas de login, entidades e estoque antes de liberar uma mudança de bundling.

#### Scenario: Function de login inicia em ambiente limpo

- **WHEN** a Function de login iniciar sem `node_modules` completo disponível fora do artefato tracejado
- **THEN** TypeORM carrega o driver PostgreSQL sem `MODULE_NOT_FOUND` e a Function consegue conectar usando a configuração fornecida

#### Scenario: Otimização de tracing

- **WHEN** a configuração de output tracing for alterada
- **THEN** o build e um deploy Preview confirmam os fluxos críticos e o trace não inclui arquivos de desenvolvimento, testes, declarações de tipo ou documentação sem necessidade de runtime

### Requirement: Conexões PostgreSQL são limitadas por instância serverless

O sistema SHALL configurar o pool PostgreSQL de produção por variável de ambiente validada, com padrão conservador e timeout de conexão. A documentação SHALL distinguir a URL pooled do runtime da URL direta de migrations/seed e descrever TLS quando exigido pelo provedor.

#### Scenario: Escalonamento de Functions

- **WHEN** várias instâncias de Functions atenderem requisições concorrentes
- **THEN** cada instância respeita o limite configurado de conexões e reutiliza o DataSource enquanto estiver quente

#### Scenario: Configuração de produção inválida

- **WHEN** a URL de banco, o limite de pool, o timeout ou a configuração TLS obrigatória forem inválidos
- **THEN** a aplicação falha de modo explícito antes de processar uma operação de negócio dependente do banco

### Requirement: Liberação é validada em ambiente semelhante à Vercel

O processo de entrega SHALL validar build, tipos, lint, testes, output traces e um Preview com banco migrado. Migrations SHALL ser executadas antes da promoção do código, nunca como efeito implícito do build de produção.

#### Scenario: Preview de autenticação e entidades

- **WHEN** uma versão candidata for implantada em Preview com variáveis de produção equivalentes
- **THEN** login, leitura de entidades e uma mutação autenticada concluem sem falha de bundling, runtime ou conexão

#### Scenario: Promoção para produção

- **WHEN** o Preview estiver aprovado
- **THEN** as migrations são aplicadas pela URL direta em etapa controlada antes de promover a versão da aplicação

