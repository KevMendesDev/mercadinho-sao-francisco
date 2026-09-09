# Deploy em VPS com Docker, GHCR e Cloudflare Tunnel

## Arquitetura

- GitHub Actions executa lint, typecheck, testes e build.
- Em push na `main`, o Actions publica duas imagens no GHCR:
  - `app-<sha>`: aplicação Next.js standalone.
  - `migration-<sha>`: runner de migrations TypeORM.
- A VPS executa PostgreSQL, aplicação e `cloudflared` via Docker Compose.
- O PostgreSQL fica apenas na rede Docker interna.
- O Cloudflare Tunnel encaminha o hostname público para `http://app:3000`.

## Preparação única da VPS

1. Instale Docker Engine e Docker Compose Plugin.
2. Crie o diretório de deploy:

```bash
sudo mkdir -p /opt/mercadinho-sao-francisco
sudo chown -R "$USER":"$USER" /opt/mercadinho-sao-francisco
```

3. Crie `/opt/mercadinho-sao-francisco/.env.production` usando `.env.production.example` como base.
4. Não publique a porta 5432 no firewall ou no Docker.

## Cloudflare Tunnel

No Cloudflare Zero Trust, crie um Tunnel e um Public Hostname apontando para:

```text
http://app:3000
```

Copie o token do Tunnel para `CLOUDFLARE_TUNNEL_TOKEN` em `.env.production`.

## Secrets do GitHub

Configure em `Settings > Secrets and variables > Actions` (preferencialmente no Environment `production`):

- `VPS_HOST`: IP ou hostname da VPS.
- `VPS_USER`: usuário SSH que possui permissão para executar Docker.
- `VPS_PORT`: opcional; se vazio, usa 22.
- `VPS_SSH_KEY`: chave privada SSH dedicada ao deploy.
- `VPS_KNOWN_HOSTS`: linha do host obtida de uma fonte confiável para `~/.ssh/known_hosts`.

O GHCR usa o `GITHUB_TOKEN` temporário do próprio workflow; não é necessário manter um PAT do registry na VPS.

## Fluxo de deploy

1. Merge/push na `main`.
2. CI roda lint, typecheck, testes e `next build`.
3. Imagens são publicadas no GHCR com o SHA do commit.
4. O Compose de produção é enviado para a VPS.
5. A VPS baixa as imagens.
6. A migration é executada e precisa terminar com sucesso.
7. Só então a aplicação é atualizada.
8. Imagens Docker antigas sem uso são limpas.

Se qualquer etapa anterior ao `docker compose up -d` falhar, o workflow falha e não publica a nova aplicação.
