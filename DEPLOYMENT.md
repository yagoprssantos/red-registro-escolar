# Deploy Guide: Vercel + Render + Supabase

This project runs best with:

- Frontend on Vercel
- Backend API on Render
- Database on Supabase PostgreSQL

## Target Architecture

User -> Vercel (frontend) -> Render (API) -> Supabase (PostgreSQL)

Frontend calls `/api/*` on the same domain, and Vercel rewrites to Render.

## 1) Render (Backend)

Use an existing Render Web Service connected to this repository.

### Build and Start

- Build Command: `corepack enable && corepack prepare pnpm@10.4.1 --activate && pnpm install --frozen-lockfile && pnpm build`
- Start Command: `pnpm start`
- Root Directory: repository root
- Health Check Path: `/healthz`

### Render Required Environment Variables

- `API_ONLY_MODE=true`
- `NODE_ENV=production`
- `JWT_SECRET=<strong-random-secret>`
- `VITE_APP_ID=red-registro-escolar`
- `DATABASE_URL=postgresql://postgres:<PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres`
- `SUPABASE_URL=https://<PROJECT_REF>.supabase.co`
- `SUPABASE_ANON_KEY=<supabase-anon-key>`

### Render Optional Environment Variables

- `OWNER_OPEN_ID=<owner-open-id>`
- `BUILT_IN_FORGE_API_URL=<internal-service-url>`
- `BUILT_IN_FORGE_API_KEY=<internal-service-key>`
- `JWT_SECRET_PREVIOUS=<old-secret[,older-secret]>`
- `SUPABASE_SERVICE_ROLE_KEY=<service-role-key>`
- `AUTH_BOOTSTRAP_DEFAULT_ADMINS=true`
- `AUTH_DEFAULT_ADMIN_PASSWORD=<strong-password>`
- `AUTH_DEFAULT_SCHOOL_ADMIN_EMAIL=<email>`
- `AUTH_DEFAULT_TEACHER_ADMIN_EMAIL=<email>`
- `AUTH_DEFAULT_STUDENT_ADMIN_EMAIL=<email>`
- `AUTH_DEFAULT_GUARDIAN_ADMIN_EMAIL=<email>`

### Important Notes for DATABASE_URL

- Prefer Supabase direct URL for Render because this backend is persistent.
- If your network/policy requires it, append `?sslmode=require` to the URL.
- The app already enforces SSL at runtime in the postgres client.

## 2) Vercel (Frontend)

Use an existing Vercel project connected to this repository.

### Build Settings

- Framework: Vite
- Install Command: `corepack enable && corepack prepare pnpm@10.4.1 --activate && pnpm install --frozen-lockfile`
- Build Command: `pnpm build`
- Output Directory: `dist/public`
- Root Directory: repository root

### Vercel Required Environment Variables

- `VITE_APP_ID=red-registro-escolar`

`JWT_SECRET` nao deve ser configurada no Vercel neste projeto, pois a sessao
JWT e assinada/validada apenas no backend hospedado no Render.

### Vercel Optional Environment Variables

- `VITE_ANALYTICS_ENDPOINT=<https://analytics.example.com>`
- `VITE_ANALYTICS_WEBSITE_ID=<analytics-site-id>`

## 3) JWT Secret Hardening and Rotation (Render + Vercel)

### Generate a strong secret

From repository root:

```bash
pnpm run jwt:secret
```

Use the output as the new `JWT_SECRET` value.

### Rotation flow without immediate logout

1. Copy current Render `JWT_SECRET` value.
2. Set new secret as `JWT_SECRET` in Render.
3. Set old secret as `JWT_SECRET_PREVIOUS` in Render.
4. Redeploy Render service.
5. Validate login/session flow.
6. Keep `JWT_SECRET_PREVIOUS` only for the grace period you need, then remove it and redeploy.

### Vercel action for this repository

1. Remove `JWT_SECRET` and `JWT_SECRET_PREVIOUS` from Vercel Environment Variables.
2. Keep only frontend `VITE_*` variables in Vercel.
3. If you ever move the backend to Vercel Functions, add JWT variables there as sensitive secrets.

## 4) Rewrite Config (Vercel -> Render)

The file `vercel.json` already rewrites:

- `/api/:path*` -> `https://red-registro-escolar.onrender.com/api/:path*`
- all other routes -> `/` (SPA fallback)

If your Render domain is different, update the destination in `vercel.json`.

## 5) First-Time Validation Checklist

Run in this exact order after deployment:

1. Open `https://<render-domain>/healthz` and confirm `ok: true`.
2. Open `https://<vercel-domain>/` and check initial page load.
3. Test an API call through Vercel rewrite:
   - `https://<vercel-domain>/api/trpc/system.health` (POST request from app flow)
4. Execute real login with email/senha from frontend and confirm session cookie creation.
5. Submit contact form and verify backend persistence.

## 6) Common Problems

### Render starts but DB fails

- Cause: wrong `DATABASE_URL` or blocked direct connection.
- Fix: copy Supabase direct URI again and redeploy.

### CORS errors in browser

- Cause: frontend calling Render directly instead of same-origin `/api/*`.
- Fix: keep frontend requests on `/api/*` and let Vercel rewrite.

### Vercel build succeeds but API fails

- Cause: rewrite destination not matching current Render domain.
- Fix: update `vercel.json` and trigger redeploy.

## 7) Suggested Production Hardening

- Rotate `JWT_SECRET` periodically.
- Store production secrets only in provider secret managers (Render Secret Env / Vercel Sensitive Env).
- Restrict Supabase Auth redirect URLs to approved production domains.
- Enable Supabase backups and monitor slow queries.
- Add uptime monitor for `/healthz`.
