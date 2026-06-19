# RED — Registro Escolar Digital
## Guia de apresentação (10 min)

---

## O problema que o RED resolve

Imagine uma mãe que quer saber se o filho foi para a escola hoje. Ela não tem como saber — a escola não liga para todo mundo, o filho pode mentir, o boletim só chega no fim do bimestre em papel. Se o filho está acumulando falta, ninguém avisa até ser tarde.

Do lado da escola, o gestor precisa saber quantos alunos faltaram hoje, quais estão em risco de reprovação por falta, quais justificativas de falta estão pendentes — e tudo isso fica espalhado em planilhas, cadernos de chamada e e-mails.

O RED centraliza tudo isso numa plataforma web acessível pelo celular, onde cada pessoa — aluno, professor, responsável e gestor — vê exatamente o que precisa, em tempo real.

---

## Público-alvo

Escolas técnicas estaduais do Ceará (modelo EEFM — Escola de Ensino Médio em Tempo Integral). São escolas com cursos técnicos integrados ao ensino médio, como Redes de Computadores, Enfermagem, Administração e Eventos.

O foco do produto é a **família e a escola terem controle das informações do aluno** — não é uma ferramenta para o aluno estudar, mas para todos acompanharem o que está acontecendo.

---

## 1. Linguagens e ferramentas

O RED é uma aplicação web full-stack, dividida em duas partes que se conversam: o **frontend** (o que o usuário vê no navegador) e o **backend** (o servidor que processa as regras e acessa o banco).

| Camada | Tecnologia | Por que foi usada |
|--------|-----------|-------------------|
| Frontend | **React + Vite + TypeScript** | React é a biblioteca mais usada no mercado para construir interfaces reativas; Vite é o bundler moderno que substitui o Create React App com build muito mais rápido; TypeScript adiciona tipagem estática ao JavaScript, evitando erros em tempo de desenvolvimento |
| Componentes de UI | **shadcn/ui + Tailwind CSS** | shadcn/ui é uma coleção de componentes prontos e acessíveis (botões, cards, modais, tabs) que o projeto copia e adapta — sem dependência de versão de biblioteca; Tailwind é um framework CSS utilitário que elimina a necessidade de escrever arquivos `.css` separados |
| Backend | **Node.js + tRPC** | Node.js roda JavaScript no servidor; tRPC é o que conecta o servidor ao frontend com tipagem compartilhada (explicado abaixo) |
| Banco de dados | **Supabase (PostgreSQL)** | PostgreSQL é um dos bancos relacionais mais robustos e confiáveis; Supabase é uma plataforma que gerencia o banco, autenticação e storage em nuvem sem precisar configurar um servidor próprio |
| Autenticação | **Supabase Auth + Google OAuth** | Login via Google — o usuário não precisa criar senha; a sessão é mantida por cookie seguro no servidor |
| Hospedagem | **Vercel** | Plataforma de deploy automático; a cada push no GitHub, o site já sobe em produção |
| Organização do código | **Monorepo (pnpm + Turborepo)** | O projeto tem dois apps (`web` e `server`) e um pacote compartilhado num único repositório, evitando duplicação de tipos e constantes |

---

## 2. Banco de dados

O banco é **PostgreSQL**, hospedado no Supabase Cloud. Tem cerca de **20 tabelas** organizadas em camadas lógicas:

**Pessoas e vínculos**
- `users` — contas de login
- `students`, `teachers`, `guardians` — perfis por tipo
- `studentGuardians` — relacionamento aluno ↔ responsável (um aluno pode ter vários responsáveis)

**Estrutura pedagógica**
- `schools`, `schoolYears`, `classes` — escola, ano letivo, turma
- `subjects` — disciplinas (Matemática, Português, Redes...)
- `classSubjects` — quais disciplinas uma turma tem
- `classTeachers` — qual professor leciona cada disciplina em cada turma
- `classEnrollments` — matrícula de um aluno numa turma

**Frequência**
- `classSessions` — cada aula que aconteceu (com data, professor, tema)
- `attendanceRecords` — para cada aula, o status de cada aluno (presente / falta / justificada)

**Avaliações e tarefas**
- `assessments` — provas cadastradas pelo professor (com data e nota máxima)
- `assessmentScores` — a nota que cada aluno tirou em cada prova
- `tasks` — trabalhos e atividades atribuídos pelo professor
- `taskSubmissions` — resposta do aluno à atividade, com nota e feedback do professor

**Comunicação**
- `communications` — comunicados enviados pela escola
- `communicationRecipients` — para quem cada comunicado foi enviado
- `schoolEvents` — eventos do calendário (provas, feriados, reuniões)
- `eventTargets` — qual turma ou escola inteira um evento afeta
- `studentComments` — observações do professor sobre um aluno (elogio, melhoria, ocorrência), com controle de quem pode ver

**Suporte e segurança**
- `absenceJustifications` — justificativas de falta enviadas pelo responsável
- `auditLogs` — log de toda ação relevante no sistema (quem fez o quê e quando), exigido pela LGPD
- `notifications` — alertas in-app
- `scheduleSlots` — horários das aulas (7h, 7h45, 8h30...)

**Migrações:** o banco evolui por meio de 13 arquivos SQL versionados (`migrations/`), aplicados em ordem. Isso garante que qualquer ambiente (local ou produção) chegue ao mesmo estado do banco.

**Seed:** existe um arquivo `seed.sql` com ~2.200 linhas que popula o banco com uma escola fictícia completa — 12 turmas, ~48 alunos, 8 professores, notas, frequência, comunicados e eventos — para poder demonstrar o sistema com dados reais sem precisar cadastrar tudo manualmente.

**Soft-delete:** nenhum dado é apagado permanentemente. Em vez disso, registros recebem um campo `deletedAt` com a data de exclusão. Isso é fundamental para auditoria e conformidade com a LGPD.

**RPCs (funções no banco):** algumas consultas complexas são feitas como funções SQL dentro do próprio Supabase. Por exemplo, `get_student_grades` junta as tabelas de notas, avaliações, disciplinas e aluno em uma única chamada eficiente — em vez de o servidor fazer 4 consultas separadas.

---

## 3. Vercel — hospedagem e deploy

O Vercel funciona como a "ponte" entre o código no GitHub e o site no ar.

- A cada push na branch `main`, o Vercel detecta automaticamente, faz o build e publica a nova versão em segundos.
- O frontend (React) é servido como arquivos estáticos em uma CDN global — carrega rápido de qualquer lugar.
- O backend (Node.js) roda como **Serverless Functions** no Vercel: funções que só "acordam" quando recebem uma requisição, sem servidor sempre ligado. Isso reduz custo.
- SSL (HTTPS) e domínio personalizado são configurados pelo próprio Vercel.
- As credenciais do banco (URL e chaves do Supabase) ficam como variáveis de ambiente no Vercel — nunca no código.

---

## 4. Backend — como funciona

### O que é tRPC e por que usar

Em sistemas web tradicionais, o frontend e o backend se comunicam via **API REST**: o servidor expõe uma URL (`/api/grades`), o frontend faz um `fetch` para essa URL, recebe um JSON, e precisa saber de cabeça qual formato aquele JSON vai ter.

O problema é que isso cria uma separação: se o servidor mudar o formato da resposta, o frontend só vai descobrir o erro em tempo de execução, muitas vezes em produção.

O **tRPC** elimina essa separação. O backend define funções com tipos TypeScript, e o frontend chama essas funções como se fossem funções locais — com autocompletar no editor, verificação de tipos em tempo de desenvolvimento, e erro imediato se algo não bater. Não existe uma URL para o frontend chamar: existe uma função.

```
// No backend (server):
grades: protectedProcedure.query(async ({ ctx }) => {
  return await getStudentGrades(ctx.user.id); // retorna { subject, grade, date }[]
})

// No frontend (React):
const { data } = trpc.profiles.student.grades.useQuery();
// TypeScript já sabe que data é { subject: string, grade: number, date: string }[]
// Sem casting, sem "any", sem surpresas em produção
```

### Estrutura do servidor

O servidor é organizado em camadas:

```
apps/server/src/
  core/        → infraestrutura: configuração do tRPC, middleware de autenticação,
                 rate limiting (limite de requisições por IP), OAuth
  domain/      → lógica de negócio separada por tema:
                   attendance/   → lançar e consultar frequência
                   grades/       → lançar e consultar notas
                   comments/     → comentários de professores sobre alunos
                   communications/ → enviar e receber comunicados
                   events/       → criar e consultar eventos escolares
                   justifications/ → justificativas de falta
                   tasks/        → trabalhos e atividades online
                   school/       → dashboard e relatórios da escola
                   audit/        → log de auditoria
  profiles.ts  → endpoints específicos por perfil de usuário
                 (o que o aluno vê é diferente do que o responsável vê)
  registry.ts  → CRUD genérico (veja abaixo)
  db.ts        → única camada que fala com o banco (ou com a memória em testes)
  routers.ts   → junta todos os routers num só
```

### Padrão Registry — CRUD sem repetição

Em vez de escrever um router de listagem, criação, edição e exclusão para cada uma das 20 entidades do banco, o projeto tem um **registry genérico**: um único conjunto de endpoints (`registry.list`, `registry.create`, `registry.update`, `registry.delete`) que funciona para qualquer entidade.

O frontend passa o nome da entidade como parâmetro:

```
trpc.registry.list.useQuery({ entity: "assessmentScores", filters: { studentId: 2045 } })
```

O servidor valida que a entidade existe, que os filtros são de colunas válidas, e retorna os dados. Isso economiza centenas de linhas de código repetitivo.

### Dual-mode: banco real ou memória

O `db.ts` tem dois modos de operação:
- **Memória:** quando roda em testes ou localmente sem conexão ao Supabase, usa um store em JavaScript puro. Os dados existem só enquanto o processo está rodando.
- **Supabase:** em produção, conecta ao banco PostgreSQL via cliente oficial do Supabase.

A lógica de negócio acima do `db.ts` não sabe qual modo está ativo — isso garante que os testes cobrem o mesmo código que roda em produção.

### Controle de acesso

Todo endpoint marcado como `protectedProcedure` exige um usuário autenticado. Além disso, cada router verifica se o usuário tem o perfil correto antes de retornar qualquer dado — um responsável não consegue ver dados de um aluno que não é seu filho, mesmo que tente forçar a requisição.

---

## 5. O que dá para fazer no site

O sistema tem **43 telas** no total, organizadas em 4 portais independentes.

### Portal do Aluno (14 telas)

O aluno entra e vê o seu próprio mundo escolar:

- **Dashboard:** resumo rápido — média geral, % de presença, próxima prova, comunicados recentes
- **Frequência:** lista de todas as aulas com status (presente, falta, justificada) por disciplina, contador de faltas e alerta visual se estiver perto do limite de reprovação
- **Boletim:** notas de todas as avaliações agrupadas por disciplina, com média calculada e indicador de tendência (subindo/descendo)
- **Horário:** grade semanal com o horário de aulas organizado por dia e slot de tempo
- **Avaliações online:** três abas — provas cadastradas pelos professores, trabalhos (entrega de arquivo), atividades (o aluno responde um texto diretamente no site e o professor avalia e lança a nota)
- **Comunicados:** avisos enviados pela escola
- **Eventos:** calendário com provas, feriados, eventos escolares e saídas antecipadas
- **Comentários:** observações que os professores registraram sobre o aluno — sem revelar quem escreveu (o nome do professor é ocultado para o aluno, mas visível para os responsáveis)
- **Minha turma:** lista de colegas e professores da turma
- **Perfil pessoal:** dados cadastrais

### Portal do Professor (5 telas)

O professor tem acesso focado nas suas turmas:

- **Dashboard:** visão geral das turmas que leciona
- **Frequência:** seleciona a aula do dia e marca presente/falta para cada aluno; o dado aparece imediatamente para o responsável do outro lado
- **Notas:** lança avaliações e notas por aluno; pode adicionar feedback individual
- **Comentários:** registra observações sobre alunos (elogio, melhoria, ocorrência) com controle de visibilidade — quem pode ver: o aluno, os responsáveis, ou só a escola
- **Comunicados:** recebe comunicados da gestão

### Portal do Responsável / Família (9 telas)

O responsável acompanha o filho sem depender da escola ligar:

- **Dashboard:** painel com nome do filho, média atual, total de faltas e próxima prova
- **Frequência:** histórico detalhado de presenças e faltas por disciplina
- **Notas e boletim:** todas as avaliações com nota e média por disciplina
- **Justificar falta:** envia justificativa de falta diretamente pelo site; a escola recebe e aprova ou rejeita
- **Comunicados e eventos:** mesmos dados que o aluno vê, mas na perspectiva do responsável
- **Comentários dos professores:** vê os comentários com o nome do professor revelado
- **Plataformas:** links para as plataformas digitais que a escola usa (Google Classroom, SISEDU etc.)

### Portal da Escola / Gestor (9 telas)

A gestão tem visão macro de toda a escola:

- **Dashboard operacional:** métricas do dia — quantos alunos vieram, quantos faltaram, alunos em risco de reprovação por falta (>25%), justificativas pendentes de revisão, próximos eventos
- **Turmas:** lista e detalhes de todas as turmas
- **Alunos:** busca e visualização de qualquer aluno da escola
- **Professores:** lista de professores com suas disciplinas
- **Comunicados:** cria e envia comunicados para escola inteira ou turmas específicas
- **Eventos:** cria eventos no calendário escolar com alvo (turma ou escola toda)
- **Justificativas:** revisa e aprova ou rejeita as justificativas de falta enviadas pelos responsáveis
- **Relatórios:** relatório de frequência e notas com filtros por turma
- **Exportação LGPD:** exporta todos os dados de um aluno específico em formato estruturado, cumprindo o Art. 18 da LGPD (Lei Geral de Proteção de Dados)

---

## Soluciona a dor do público-alvo?

**Para a família:** sim. O responsável que antes dependia de boletim em papel no fim do bimestre ou de grupos de WhatsApp agora tem em tempo real: frequência de hoje, nota da última prova, comentário que o professor deixou. Se o filho acumulou 5 faltas em Matemática, o responsável sabe antes de virar problema.

**Para o aluno:** sim. Em vez de perguntar para o professor a média, acessar o horário no mural da escola ou esperar chegar em casa para mostrar o boletim, tudo está no celular.

**Para a escola:** sim. O gestor tem um painel que mostra quem está em risco hoje — não depois que o aluno reprovou. As justificativas chegam de forma organizada e rastreável. Os comunicados chegam no canal certo, não num grupo de WhatsApp que metade da turma saiu.

O diferencial do RED frente a sistemas como o SIGE (sistema oficial do Ceará) é a experiência: mobile-first, visual moderno, e portais pensados para a família — não para o burocrata que preenche formulário.
