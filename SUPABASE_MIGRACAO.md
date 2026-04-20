<!-- markdownlint-disable MD032 MD033 -->

# Migracao do RED para Supabase

## Objetivo

Conectar o projeto RED ao Supabase e enviar o banco para nuvem com seguranca.

## Configuracao real deste projeto (fornecida)

- Project URL: <https://xjsjhcedlwkhaigwjeca.supabase.co>
- Publishable key: sb_publishable_OsqZswkfbGyQjk33nOwihQ_jehYu82q
- Host do Postgres: db.xjsjhcedlwkhaigwjeca.supabase.co
- Porta: 5432
- Database: postgres
- User: postgres

Metodo recomendado para este ambiente:

- Direct connection
- Tipo de string: URI (Node.js/Drizzle/CLI)

Motivo:

- a conectividade TCP com o endpoint direto foi validada nesta maquina.
- backend do RED e persistente (nao serverless), combinando com conexao direta.

String URI direta (preencher senha):

postgresql://postgres:SUA_SENHA@db.xjsjhcedlwkhaigwjeca.supabase.co:5432/postgres

Se for executar de uma rede apenas IPv4 e falhar no endpoint direto:

- usar Session Pooler como alternativa.

## Ponto tecnico importante (estado atual)

Migracao concluida para PostgreSQL:

- Drizzle configurado com dialect postgresql.
- Driver postgres no backend.
- SQL e tipos ajustados para PostgreSQL.

Supabase Database e PostgreSQL.

Isso significa:

- DATABASE_URL pode apontar diretamente para o Supabase.
- o fluxo de db:push esta funcional com o ambiente atual.

## Plano recomendado (sem surpresa)

### Fase A - Preparar Supabase

1. No Supabase, abrir Project Settings > Database.
2. Copiar duas strings de conexao:
   - Direct connection (porta 5432), para migracao e jobs.
   - Pooler connection, para aplicacao em runtime.
3. Definir senha forte do banco e guardar no cofre.
4. Em SQL Editor, deixar pronto um script inicial de extensoes comuns se necessario.

### Fase B - Preparar app local

1. Criar um arquivo .env.supabase local com:
   - DATABASE_URL=<url-pooler-postgres>
   - DATABASE_URL_DIRECT=<url-direta-postgres>
   - JWT_SECRET=<seu-segredo>
   - VITE_APP_ID=red-registro-escolar
2. Nao substituir .env atual ainda no branch principal.
3. Criar branch de migracao para nao quebrar fluxo atual.

### Fase C - Migrar camada de banco no codigo (concluida)

1. Schema Drizzle trocado de mysql-core para pg-core.
2. drizzle.config.ts ajustado para dialect postgresql.
3. Driver do backend trocado para postgres no apps/server/src/db.ts.
4. Inserts/upserts ajustados para padroes PostgreSQL.
5. Baseline Drizzle PostgreSQL gerada.
6. check e test validados.

### Fase D - Enviar dados MySQL para Supabase (Postgres)

Opcao recomendada para carga inicial: pgloader.

1. Instalar pgloader na maquina de migracao.
2. Rodar migracao de dados:
   pgloader mysql://USUARIO:SENHA@HOST_MYSQL:3306/NOME_DB postgres://USUARIO:SENHA@HOST_PG:5432/postgres
3. Validar contagem de linhas por tabela.
4. Validar constraints e indices apos carga.

Observacao:

- como existem enums e diferencas de tipo entre MySQL e PostgreSQL, sempre executar em ambiente de homologacao antes de producao.

### Fase E - Validacao final

Checklist minimo:

- autenticar usuario.
- onboarding criando escola e vinculos.
- consultar dashboards de professor, aluno e responsavel.
- registrar presenca e nota.
- ler comentarios com regra de visibilidade.
- criar comunicacao e destinatarios.

## Riscos e mitigacoes

1. Risco: perda de compatibilidade SQL entre MySQL e PostgreSQL.
   Mitigacao: branch dedicado de migracao + testes + homologacao.

2. Risco: migrar dado sujo para esquema novo.
   Mitigacao: validacao de duplicidade e nulos antes do pgloader.

3. Risco: degradacao de performance pos-corte.
   Mitigacao: revisar indices principais e monitorar queries lentas no Supabase.

## Como conectar local no dia da virada

1. Escolher janela de manutencao.
2. Congelar escrita no MySQL antigo.
3. Executar carga final para Supabase.
4. Trocar DATABASE_URL do app para pooler do Supabase.
5. Subir backend e validar smoke tests.
6. Liberar trafego.

## O que ja esta pronto no projeto

- modelagem completa do dominio escolar.
- relacoes tipadas no Drizzle.
- suite de testes de regra de negocio.
- documentacao funcional do banco em BANCO_DE_DADOS_RED.md.

## Proximo passo pratico

Se voce quiser, o proximo passo e eu iniciar agora a Fase C no codigo (migracao MySQL -> PostgreSQL) em branch, deixando tudo pronto para conectar no Supabase de verdade.

## Comandos uteis de verificacao (PowerShell)

Teste de rede do endpoint direto:

Test-NetConnection db.xjsjhcedlwkhaigwjeca.supabase.co -Port 5432

Observacao sobre Agent Skills do Supabase (opcional):

npx skills add supabase/agent-skills

Esse comando ajuda ferramentas de IA, mas nao e obrigatorio para a conexao do app.
