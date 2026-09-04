# Segurança e produção

## Variáveis e seed

Os valores de `.env.example` são exclusivos de desenvolvimento. Em produção:

- defina `AUTH_SECRET` próprio, com pelo menos 32 caracteres aleatórios;
- defina e-mail e senha próprios para `SEED_ADMIN_*`; a senha precisa ter pelo menos 16 caracteres;
- não execute o seed como rotina de deploy; ele só cria o admin se o e-mail ainda não existir;
- guarde variáveis em um gerenciador de segredos, fora do repositório.

O processo recusa `AUTH_SECRET` e credenciais de seed padrão quando `NODE_ENV=production`.

## Login

- O login limita a cinco tentativas por e-mail em uma janela de 15 minutos.
- A tentativa seguinte bloqueia novas tentativas por 15 minutos e responde `429` com `Retry-After`.
- O contador fica em `login_rate_limits` no PostgreSQL, portanto é compartilhado entre instâncias.
- Usuário inexistente, inativo e senha incorreta executam bcrypt e retornam a mesma resposta de autenticação.

## Banco e Docker

O `docker-compose.yml` expõe PostgreSQL apenas em `127.0.0.1` e exige `POSTGRES_DB`, `POSTGRES_USER` e `POSTGRES_PASSWORD` no ambiente. Os valores do exemplo são aceitáveis apenas para desenvolvimento local. Em produção, use credenciais exclusivas, uma `DATABASE_URL` própria e acesso de rede restrito ao servidor da aplicação.

Alterar `POSTGRES_USER` ou `POSTGRES_PASSWORD` no Compose não muda um volume já inicializado. Faça rotação no PostgreSQL, atualize a `DATABASE_URL` de forma coordenada e valide a conexão; não remova o volume para trocar senha.

## Operação

- Aplique migrations antes de liberar a nova versão.
- Faça backup testado do PostgreSQL antes de migrations ou reversões.

## Checklist de release para sessões persistentes

- [ ] Produção usa HTTPS; não publique a aplicação por HTTP.
- [ ] `AUTH_SECRET` é estável, aleatório, possui ao menos 32 caracteres e não é o valor de desenvolvimento.
- [ ] Execute a migration `UserSessions1788000000000` antes de implantar o código da aplicação.
- [ ] Comunique que todos os usuários precisarão fazer login uma única vez após esta implantação; cookies JWT anteriores não são aceitos.
- Monitore respostas `429`, falhas de autenticação e erros `5xx`.
- Proteja o ambiente com TLS no proxy/rede de borda.
