# Guia de Deploy: Frontend Vercel + Backend Render

Este documento descreve como manter o frontend no Vercel e o backend no Render de forma separada e escalável.

## Arquitetura

```
Usuário
  ↓
Vercel (Frontend React)
  ├─ Domínio público (ex: red-registro-escolar.vercel.app)
  ├─ Rewrite /api/* → Render
  └─ Serve rotas SPA
  ↓
Render (Backend API)
  ├─ Domínio público (ex: red-registro-escolar.onrender.com)
  ├─ Apenas /api/trpc e /api/oauth
  └─ Modo API-only (sem frontend estático)
```

## Setup Render (Backend API-only)

### 1. Environment Variables

No painel Render, adicione:

```
API_ONLY_MODE=true
JWT_SECRET=<seu-secreto-forte>
VITE_APP_ID=red-registro-escolar
OAUTH_SERVER_URL=<deixar-vazio-para-demo>
DATABASE_URL=<deixar-vazio-para-demo>
NODE_ENV=production
```

### 2. Build Settings

- **Build Command**: `corepack enable && corepack prepare pnpm@10.4.1 --activate && pnpm install --frozen-lockfile && pnpm build`
- **Start Command**: `pnpm start`
- **Root Directory**: (deixe vazio, raiz do repo)

### 3. Deploy

1. Commit e push as mudanças
2. Render faz deploy automático do branch main
3. Aguarde "Service running on http://localhost:xxxx"

### Testar Backend

```bash
curl "https://red-registro-escolar.onrender.com/api/trpc/system.health" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"0":{"json":{"timestamp":0}}}'
```

Resposta esperada:

```json
{ "result": { "data": { "ok": true } } }
```

## Setup Vercel (Frontend)

### 1. Environment Variables

No painel Vercel, adicione:

```
VITE_APP_ID=red-registro-escolar
VITE_OAUTH_PORTAL_URL=<deixar-vazio-para-demo>
VITE_ANALYTICS_ENDPOINT=<deixar-vazio-para-demo>
VITE_ANALYTICS_WEBSITE_ID=<deixar-vazio-para-demo>
```

### 2. Build Settings

- **Framework**: Vite
- **Install Command**: `corepack enable && corepack prepare pnpm@10.4.1 --activate && pnpm install --frozen-lockfile`
- **Build Command**: `pnpm build`
- **Output Directory**: `dist/public`
- **Root Directory**: (deixe vazio, raiz do repo)

### 3. Deploy

1. Commit e push as mudanças
2. Vercel faz deploy automático do branch main
3. Aguarde "Production Deployment Ready"

### Testar Frontend

1. Abra: https://seu-vercel-domain.vercel.app
2. Teste rota SPA: https://seu-vercel-domain.vercel.app/legal/privacy-policy
3. Teste API (login demo): use o formulário no site

## Como funciona o fluxo de requisições

### Frontend → Backend (tRPC + API)

1. Usuário clica em "Demo Login" no Vercel
2. Vercel recebe a requisição em `/api/auth/demo-login`
3. `vercel.json` reescreve para `https://red-registro-escolar.onrender.com/api/auth/demo-login`
4. Render processa e retorna resposta
5. Vercel encaminha resposta ao frontend
6. Frontend recebe cookie de sessão e redireciona

### OAuth Callback (se configurado futuramente)

1. Usuário clica "Login com OAuth"
2. OAuth portal redireciona para: `https://seu-vercel-domain.vercel.app/api/oauth/callback`
3. Vercel reescreve para `https://red-registro-escolar.onrender.com/api/oauth/callback`
4. Render valida token e cria sessão
5. Backend redireciona para: `/dashboard` (relativivo, volta para Vercel)
6. Frontend renderiza dashboard

## Checklist pós-deploy

- [ ] Render mostra "Service running on http://localhost:xxxx" (sem erros)
- [ ] Vercel mostra "Production Deployment Ready"
- [ ] Testar `/legal/privacy-policy` no Vercel (rota SPA deve funcionar)
- [ ] Testar Demo Login (chegar até dashboard, mesmo que vazio)
- [ ] Testar ContactSection > enviar formulário (salvar no backend)

## Troubleshooting

### "No open ports detected" no Render

**Causa**: `API_ONLY_MODE` não foi definido ou JWT_SECRET falta.
**Solução**: Verifique Environment Variables → redeploy.

### "Failed to resolve module" no Vercel

**Causa**: Build rodou antes de fazer commit das mudanças.
**Solução**: Commit, push, e força rebuild no Vercel.

### CORS error "Access to XMLHttpRequest blocked"

**Causa**: O Vercel não conseguiu reescrever `/api/*` para Render.
**Solução**: Confirme que `vercel.json` está no repositório e redeploy.

### Demo Login fica em loading infinito

**Causa**: Render em cold start (espiar logs) ou variáveis de ambiente incompletas.
**Solução**: Aguarde 50s para warm-up da instância free e recar
regue.

## Variáveis de ambiente para produção (com banco + OAuth)

Quando quiser adicionar banco de dados e OAuth:

### Render

```
API_ONLY_MODE=true
JWT_SECRET=<valor-aleatório-64-bytes>
VITE_APP_ID=red-registro-escolar
OAUTH_SERVER_URL=<seu-oauth-portal>
OWNER_OPEN_ID=<seu-owner-id>
DATABASE_URL=mysql://user:pass@host/dbname
NODE_ENV=production
```

### Vercel

```
VITE_APP_ID=red-registro-escolar
VITE_OAUTH_PORTAL_URL=<seu-oauth-portal>
VITE_ANALYTICS_ENDPOINT=<opcional>
VITE_ANALYTICS_WEBSITE_ID=<opcional>
```

## Para escalabilidade futura

1. **Mais replicas do backend**: Upgrade Render para plano pago, aumentar "Instance Type".
2. **CDN global do frontend**: Vercel já inclui automaticamente.
3. **Database redundância**: Configure MySQL em produção com backup automático.
4. **Monitoramento**: Configure logs no Render e Vercel para alertas.
