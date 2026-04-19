# Setup Local (Client + Servidor)

Este projeto roda com **um único comando** em modo desenvolvimento.

## 1) Pré-requisitos

- Node.js **20.19+** (recomendado Node 22 LTS)
- pnpm **10.4.1** (versão do lockfile)
- Git

## 2) Instalar pnpm

Se ainda não tiver `pnpm`:

```bash
npm install -g pnpm@10.4.1
```

## 3) Instalar dependências do projeto

Na raiz do repositório:

```bash
pnpm install
```

## 4) Configurar variáveis de ambiente

Crie seu `.env` a partir do exemplo:

### Windows (PowerShell)

```powershell
Copy-Item .env.example .env
```

### Linux/macOS

```bash
cp .env.example .env
```

Edite o arquivo `.env` e ajuste ao menos:

- `JWT_SECRET`
- `OAUTH_SERVER_URL` (se quiser fluxo OAuth completo)
- `DATABASE_URL` (se quiser recursos e testes que dependem de banco)

## 5) Iniciar client + servidor (comando único)

```bash
pnpm dev
```

Esse comando sobe:

- servidor Express
- client React/Vite em modo dev (integrado no servidor)

URL local padrão:

- `http://localhost:3000`

## 6) Abrir o site no navegador

### Windows (PowerShell)

```powershell
Start-Process http://localhost:3000
```

### Linux

```bash
xdg-open http://localhost:3000
```

### macOS

```bash
open http://localhost:3000
```

## 7) Comandos úteis

Checagem de tipos:

```bash
pnpm run check
```

Rodar testes:

```bash
pnpm test
```

## Observações rápidas

- Se `OAUTH_SERVER_URL` estiver vazio, o servidor pode subir com aviso no log, mas partes do login OAuth não funcionarão.
- Alguns testes falham sem `DATABASE_URL` configurado e banco disponível.
