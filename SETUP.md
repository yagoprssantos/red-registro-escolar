# Guia Completo de Setup Local (Do Zero)

Este guia foi escrito para quem vai configurar tudo pela primeira vez, sem Node, sem pnpm e sem ferramentas instaladas.

Seguindo este passo a passo, voce consegue:

- instalar tudo o que precisa;
- rodar a aplicacao localmente;
- validar se esta tudo funcionando.

## 1) O que este projeto usa

- Node.js **20.19+** (recomendado: **Node 22 LTS**)
- pnpm **10.4.1** (alinhado ao lockfile)
- Git

Estrutura principal do projeto:

- `apps/web`: frontend React + Vite
- `apps/server`: backend Express + tRPC
- `packages/shared`: tipos e constantes compartilhadas

## 2) Instalar ferramentas base

### 2.1) Instalar Git

Windows (PowerShell):

```powershell
winget install --id Git.Git -e --source winget
```

macOS (Homebrew):

```bash
brew install git
```

Ubuntu/Debian:

```bash
sudo apt update
sudo apt install -y git
```

Verifique:

```bash
git --version
```

### 2.2) Instalar Node.js (Node 22 LTS)

Windows (PowerShell):

```powershell
winget install --id OpenJS.NodeJS.LTS -e --source winget
```

macOS (Homebrew):

```bash
brew install node@22
```

Ubuntu/Debian (via nvm, recomendado para evitar versoes antigas do apt):

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
```

Verifique:

```bash
node -v
npm -v
```

### 2.3) Instalar pnpm com Corepack (recomendado)

Com Node instalado:

```bash
corepack enable
corepack prepare pnpm@10.4.1 --activate
pnpm -v
```

## 3) Obter o codigo do projeto

Se voce ainda nao clonou o repositorio:

```bash
git clone https://github.com/kKailany/red-registro-escolar.git
cd red-registro-escolar
```

Se ja esta com o projeto aberto, apenas entre na pasta raiz do repositorio.

## 4) Instalar dependencias do projeto

Na raiz do repositorio:

```bash
pnpm install
```

## 5) Configurar variaveis de ambiente

Crie um `.env` a partir do exemplo:

Windows (PowerShell):

```powershell
Copy-Item .env.example .env
```

Linux/macOS:

```bash
cp .env.example .env
```

Abra o arquivo `.env` e configure no minimo:

- `JWT_SECRET`
- `VITE_APP_ID`

Valor sugerido para `JWT_SECRET` (exemplo local):

```text
JWT_SECRET=red-local-dev-super-secret-123
```

Sobre variaveis opcionais:

- `OAUTH_SERVER_URL`: necessario apenas para fluxo de login OAuth real.
- `DATABASE_URL`: necessario para recursos que dependem de MySQL real e migracoes.

## 6) Subir a aplicacao em desenvolvimento

Execute:

```bash
pnpm dev
```

Esse comando sobe:

- servidor Express;
- frontend React/Vite integrado no servidor.

Endereco esperado:

- `http://localhost:3000`

Se a porta 3000 estiver ocupada, o servidor pode subir em `3001` (ou outra proxima livre).

## 7) Validar se esta funcionando

Em outro terminal, na raiz do projeto:

Checagem de tipos:

```bash
pnpm run check
```

Testes automatizados:

```bash
pnpm test
```

## 8) Setup completo opcional (MySQL + OAuth)

Use esta secao se voce quer o fluxo completo alem do modo local basico.

### 8.1) Banco MySQL

1. Instale MySQL.
1. Crie um banco, por exemplo `red_registro_escolar`.
1. Configure `DATABASE_URL` no `.env`.

Exemplo:

```text
DATABASE_URL=mysql://usuario:senha@localhost:3306/red_registro_escolar
```

1. Rode migracoes:

```bash
pnpm run db:push
```

### 8.2) OAuth

Configure no `.env`:

- `OAUTH_SERVER_URL`
- `OWNER_OPEN_ID` (quando aplicavel)

Sem isso, o sistema pode subir normalmente em modo local, mas o login OAuth real nao fica funcional.

## 9) Solucao de problemas comuns

### `pnpm` nao reconhecido

Rode novamente:

```bash
corepack enable
corepack prepare pnpm@10.4.1 --activate
```

Feche e reabra o terminal.

### Porta 3000 ocupada

Nao e erro fatal. O servidor escolhe outra porta e mostra no log (ex.: `3001`).

### Aviso de `OAUTH_SERVER_URL` ausente

Esperado no setup basico. So e obrigatorio para login OAuth real.

### `pnpm install` falha com cache corrompido

```bash
pnpm store prune
pnpm install
```

### Build/check com erro de versao do Node

Confirme:

```bash
node -v
```

Se estiver abaixo de `20.19`, atualize para Node 22 LTS.

## 10) Checklist final (setup concluido)

Marque tudo abaixo:

- `git --version` funciona
- `node -v` >= 20.19
- `pnpm -v` mostra versao 10.x
- `.env` criado a partir de `.env.example`
- `pnpm install` concluido
- `pnpm dev` rodando
- `pnpm run check` sem erros
- `pnpm test` concluido
