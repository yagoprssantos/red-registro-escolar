# RED — Registro Escolar Digital

## Especificação Completa do Sistema EdTech

### Pesquisa + Análise + Fluxos + Arquitetura Backend + Telas Frontend

---

## PARTE 1 — O QUE AS EDTECHS ENSINAM

Sistemas de gestão escolar consolidados (PowerSchool, ClassDojo, Classter, QuickSchools, Educ21, Setti) convergem para um conjunto de princípios fundamentais que o RED deve incorporar:

**Princípios universais identificados:**

- **Portais separados por papel (role-based):** cada tipo de usuário vê apenas o que lhe é pertinente — não há uma tela única compartilhada.
- **Registro de frequência em tempo real:** o dado de falta é lançado pelo professor e imediatamente visível para os responsáveis, sem intermediação manual.
- **Comunicação assíncrona estruturada:** comunicados, eventos e comentários chegam ao destinatário certo, no canal certo, com rastreio de leitura.
- **Anonimização seletiva:** alunos podem ver feedback dos professores, mas sem saber de quem — responsáveis veem o autor; isso protege o professor e mantém a transparência com a família.
- **Auditabilidade:** todo registro tem autor, timestamp e não é deletado permanentemente (soft-delete).
- **Notificações automáticas por gatilho:** falta registrada → notifica responsável; comentário criado → notifica escola; evento publicado → notifica turmas alvo.

---

## PARTE 2 — MAPA COMPLETO POR PERFIL DE USUÁRIO

---

### 👤 PERFIL: ALUNO

#### Funcionalidades

| #   | Funcionalidade            | Descrição                                                                                      |
| --- | ------------------------- | ---------------------------------------------------------------------------------------------- |
| A1  | Ver frequência própria    | Lista de presenças e faltas por disciplina, com data e status (presente / falta / justificada) |
| A2  | Ver resumo de desempenho  | Painel com média geral, média por disciplina e indicador visual de evolução                    |
| A3  | Ver notas por disciplina  | Detalhamento de avaliações lançadas pelo professor da matéria                                  |
| A4  | Ver comentários recebidos | Comentários de caráter positivo ou de melhoria — sem identificação do professor autor          |
| A5  | Ver comunicados da escola | Feed de avisos enviados pela escola/núcleo gestor                                              |
| A6  | Ver eventos escolares     | Calendário com provas, feriados, eventos, saídas antecipadas                                   |
| A7  | Notificações in-app       | Alerta quando nova nota, comentário ou evento é publicado                                      |

#### Restrições de visibilidade

- Aluno **não vê** quem escreveu o comentário (o campo `author` é nulo na resposta da API para este perfil).
- Aluno **não vê** comentários com `visibility = 'guardian'` ou `visibility = 'school_only'`.
- Aluno **não edita** nenhum dado.

#### Fluxos Detalhados

**Fluxo A1 — Ver frequência**

```
Aluno acessa "Minhas Faltas"
  → API: student.attendance.list({ studentId, filters: { month?, subject? } })
  → Retorna: [ { date, subject, status: 'present'|'absent'|'justified', session } ]
  → UI exibe: tabela por disciplina + contador total de faltas + % de presença
  → Alerta visual se absences >= limiteReprovação (ex: 25% da carga horária)
```

**Fluxo A4 — Ver comentários**

```
Aluno acessa "Meu Histórico de Comentários"
  → API: student.comments.list({ studentId })
  → Backend filtra: visibility IN ('student', 'all')
  → Backend remove campo authorName da resposta
  → UI exibe: lista com categoria (elogio / melhoria), data, texto — SEM nome do professor
```

**Fluxo A6 — Ver eventos**

```
Aluno acessa "Calendário"
  → API: student.events.list({ studentId })
  → Backend busca eventos onde target inclui: classId do aluno OU schoolId OU 'all'
  → UI exibe: calendário mensal com badges por tipo de evento
```

---

### 👩‍🏫 PERFIL: PROFESSOR

#### Funcionalidades

| #   | Funcionalidade                     | Descrição                                                          |
| --- | ---------------------------------- | ------------------------------------------------------------------ |
| P1  | Registrar chamada (frequência)     | Lançar presença/falta por aluno em uma sessão de aula              |
| P2  | Ver histórico de chamadas lançadas | Revisão de chamadas já registradas por turma e data                |
| P3  | Editar chamada do dia              | Correção de falta/presença até o encerramento da sessão            |
| P4  | Lançar nota/avaliação              | Criar avaliação e inserir notas para cada aluno da turma           |
| P5  | Editar nota lançada                | Corrigir nota antes de ela ser consolidada no boletim              |
| P6  | Criar comentário sobre aluno       | Registrar elogio ou ponto de melhoria com categoria e visibilidade |
| P7  | Ver comentários que criou          | Histórico de comentários feitos pelo próprio professor             |
| P8  | Ver suas turmas                    | Lista de turmas do professor com alunos matriculados               |
| P9  | Ver desempenho da turma            | Médias por avaliação, distribuição de notas, alunos em alerta      |
| P10 | Ver perfil resumido do aluno       | Frequência e desempenho de um aluno específico da turma            |
| P11 | Receber comunicados da escola      | Feed de avisos publicados pelo núcleo gestor                       |

#### Regras de negócio críticas

- O professor só registra chamada/notas/comentários em **turmas às quais está vinculado**.
- Um mesmo professor não pode registrar duas chamadas para o mesmo aluno na mesma sessão.
- A data da sessão não pode ser futura.
- A nota não pode ultrapassar o valor máximo da avaliação (`score ≤ maxScore`).
- O campo `visibility` de um comentário define quem o vê: `'student'`, `'guardian'`, `'all'`, `'school_only'`.

#### Fluxos Detalhados

**Fluxo P1 — Registrar chamada**

```
Professor acessa "Chamada" → seleciona turma → seleciona data/sessão
  → API: attendance.record({ teacherId, classId, sessionDate, records: [{ studentId, status }] })
  → Backend valida:
      1. teacherId === sessão autenticada
      2. classId está vinculado ao teacher
      3. sessionDate <= hoje
      4. Nenhum registro duplicado (studentId + sessionDate + classId)
  → Salva AttendanceRecord para cada aluno
  → Dispara notificação para responsáveis de alunos ausentes
  → UI: feedback de sucesso por aluno + resumo da chamada
```

**Fluxo P4 — Lançar nota**

```
Professor acessa "Avaliações" → seleciona turma → cria ou seleciona avaliação
  → Passo 1: grades.assessment.create({ classId, title, maxScore, date })
  → Passo 2: grades.record({ assessmentId, scores: [{ studentId, score }] })
  → Backend valida: score <= maxScore, aluno matriculado na turma
  → Upsert: atualiza se já existe nota para esse aluno/avaliação
  → UI: planilha inline com campo de nota por aluno
```

**Fluxo P6 — Criar comentário**

```
Professor acessa perfil do aluno → clica "Novo Comentário"
  → Formulário: { text, category: 'praise'|'improvement', visibility: 'student'|'guardian'|'all'|'school_only' }
  → API: comments.create({ teacherId, studentId, text, category, visibility })
  → Backend valida: teacherId tem turma com o studentId
  → Salva com authorId = teacherId
  → Dispara notificação conforme visibility
  → UI: confirmação + preview de quem verá o comentário
```

---

### 👨‍👩‍👧 PERFIL: RESPONSÁVEL (PAI/MÃE/TUTOR)

#### Funcionalidades

| #   | Funcionalidade                      | Descrição                                                                                  |
| --- | ----------------------------------- | ------------------------------------------------------------------------------------------ |
| R1  | Ver frequência do(s) filho(s)       | Lista detalhada de faltas/presenças por data e disciplina, com nome do professor da sessão |
| R2  | Ver desempenho acadêmico            | Médias por disciplina, tendência de evolução, comparativo com média da turma               |
| R3  | Ver comentários com autoria         | Comentários de professores com identificação completa do autor                             |
| R4  | Receber notificações de falta       | Alerta automático quando falta é registrada                                                |
| R5  | Receber notificações de nova nota   | Alerta quando nota é publicada                                                             |
| R6  | Ver e marcar comunicados como lidos | Feed de comunicados da escola com confirmação de leitura                                   |
| R7  | Ver eventos escolares               | Calendário de eventos que afetam as turmas do filho                                        |
| R8  | Solicitar justificativa de falta    | Envio de justificativa para uma falta específica (texto + anexo opcional)                  |
| R9  | Ver múltiplos filhos                | Se tiver mais de um filho na escola, alterna entre perfis                                  |

#### Diferencial de visibilidade vs. Aluno

| Dado                                   | Aluno vê?   | Responsável vê?                         |
| -------------------------------------- | ----------- | --------------------------------------- |
| Autor do comentário                    | ❌ Não      | ✅ Sim                                  |
| Comentários `visibility='guardian'`    | ❌ Não      | ✅ Sim                                  |
| Comentários `visibility='school_only'` | ❌ Não      | ❌ Não                                  |
| Média da turma (comparativo)           | ❌ Não      | ✅ Sim                                  |
| Histórico de sessões com falta         | Só o status | Data + disciplina + professor da sessão |

#### Fluxos Detalhados

**Fluxo R1 — Ver frequência detalhada**

```
Responsável acessa "Frequência de [Nome do Filho]"
  → API: guardian.student.attendance({ guardianId, studentId, filters })
  → Backend valida: guardianId está vinculado ao studentId
  → Retorna: [ { date, subject, teacherName, status, justification? } ]
  → UI: tabela filtrável por mês/disciplina + % total de presença + alerta de risco
```

**Fluxo R3 — Ver comentários com autoria**

```
Responsável acessa "Comentários sobre [Nome do Filho]"
  → API: guardian.student.comments({ guardianId, studentId })
  → Backend filtra: visibility IN ('guardian', 'all')
  → Backend inclui: authorName (nome do professor)
  → UI: cards com categoria (ícone elogio/melhoria), texto, autor, data
```

**Fluxo R4 — Notificação automática de falta**

```
[Trigger: AttendanceRecord criado com status='absent']
  → Sistema busca guardians vinculados ao studentId
  → Cria Notification: { userId: guardianId, type: 'absence', payload: { studentName, date, subject, teacherName } }
  → Envia push notification (in-app) + email (opcional)
  → UI responsável: badge no sino + item no feed de notificações
```

**Fluxo R8 — Justificar falta**

```
Responsável clica em falta específica → "Justificar esta falta"
  → Formulário: { absenceId, reason: string, attachment?: file }
  → API: guardian.absences.justify({ guardianId, absenceId, reason, attachment })
  → Status da falta muda para 'pending_review'
  → Notificação enviada para escola e professor da sessão
  → Escola/professor aprova ou rejeita → responsável é notificado
```

---

### 🏫 PERFIL: ESCOLA / NÚCLEO GESTOR

#### Funcionalidades

| #   | Funcionalidade                        | Descrição                                                                     |
| --- | ------------------------------------- | ----------------------------------------------------------------------------- |
| E1  | Cadastrar alunos                      | Criação de perfil do aluno com dados pessoais e matrícula                     |
| E2  | Cadastrar turmas                      | Criação de turmas com ano letivo, turno, série/ano                            |
| E3  | Matricular alunos em turmas           | Vínculo aluno ↔ turma para o ano letivo ativo                                |
| E4  | Cadastrar professores                 | Criação de perfil de professor com disciplinas                                |
| E5  | Vincular professor a turma/disciplina | Associação professor ↔ turma ↔ disciplina                                   |
| E6  | Cadastrar responsáveis                | Criação de perfil de responsável e vínculo com aluno(s)                       |
| E7  | Publicar comunicado                   | Envio de aviso para turmas, série, escola inteira ou responsáveis específicos |
| E8  | Publicar evento escolar               | Criação de evento no calendário com data, tipo e público-alvo                 |
| E9  | Ver dashboard geral                   | Painel com frequência global, alunos em alerta, comunicados recentes          |
| E10 | Ver relatórios de frequência          | Relatórios por turma, disciplina, período — exportáveis                       |
| E11 | Ver relatórios de desempenho          | Médias por turma, distribuição de notas, alunos abaixo da média               |
| E12 | Gerenciar ano letivo                  | Criar/encerrar ano letivo, definir calendário, datas de avaliação             |
| E13 | Ver e moderar comentários             | Acesso a todos os comentários, incluindo `visibility='school_only'`           |
| E14 | Aprovar justificativas de falta       | Revisar e aceitar/rejeitar justificativas enviadas por responsáveis           |
| E15 | Gerenciar usuários da escola          | Ativar/desativar contas, redefinir senhas, gerenciar perfis                   |

#### Fluxos Detalhados

**Fluxo E1 — Cadastrar aluno**

```
Gestor acessa "Alunos" → "Novo Aluno"
  → Formulário: { name, birthDate, cpf?, photo?, address, contacts }
  → API: school.students.create({ schoolId, studentData })
  → Backend:
      1. Valida campos obrigatórios (name, birthDate)
      2. Gera enrollmentNumber automático (ex: ANO + sequencial)
      3. Vincula ao schoolYear ativo
      4. Cria perfil de acesso (account) com role='student'
  → Retorna: { studentId, enrollmentNumber, loginCredentials }
  → UI: ficha do aluno com QR code de matrícula
```

**Fluxo E7 — Publicar comunicado**

```
Gestor acessa "Comunicados" → "Novo Comunicado"
  → Formulário: { title, body, recipients: 'all'|'class:X'|'grade:Y'|'guardians', attachments?, scheduledAt? }
  → API: school.communications.create({ schoolId, authorId, title, body, recipients, attachments })
  → Backend:
      1. Resolve lista de destinatários (expand 'all' para todos os usuários ativos)
      2. Cria Communication + CommunicationRecipient para cada destinatário
      3. Dispara notificação para cada destinatário
  → UI: preview antes de publicar + confirmação de quantos receberão
```

**Fluxo E9 — Dashboard geral**

```
Gestor acessa "Dashboard"
  → API: school.dashboard({ schoolId, date: today })
  → Retorna:
      {
        attendanceToday: { present: N, absent: N, rate: % },
        studentsAtRisk: [ { studentId, name, absenceRate } ],
        recentComments: [ últimos 5 ],
        upcomingEvents: [ próximos 3 ],
        pendingJustifications: N
      }
  → UI: cards de métricas + lista de alunos em alerta + agenda rápida
```

**Fluxo E12 — Gerenciar ano letivo**

```
Gestor acessa "Configurações" → "Ano Letivo"
  → Cria novo ano letivo: { year, startDate, endDate, gradingPeriods: [...] }
  → API: school.schoolYear.create({ schoolId, year, dates, periods })
  → Ao encerrar ano: status = 'closed', dados históricos preservados (soft-archive)
  → Novo ano: novas turmas, rematrículas, novos vínculos
```

---

## PARTE 3 — ARQUITETURA DE BACKEND

### 3.1 Modelo de Dados (Schema Principal)

```
ENTIDADES CENTRAIS
─────────────────

schools
  id, name, cnpj, address, logo, createdAt

schoolYears
  id, schoolId, year, startDate, endDate, status('active'|'closed')

users
  id, email, passwordHash, role('student'|'teacher'|'guardian'|'school'),
  schoolId, isActive, createdAt

students
  id, userId, name, birthDate, enrollmentNumber, photo, schoolId, schoolYearId

teachers
  id, userId, name, subjects[], schoolId

guardians
  id, userId, name, phone, email, schoolId

studentGuardians (N:N)
  studentId, guardianId, relationship('pai'|'mae'|'tutor')

classes
  id, schoolId, schoolYearId, gradeLabel('1A'|'2B'...), shift('morning'|'afternoon'),
  year, status

classEnrollments (N:N aluno ↔ turma)
  id, classId, studentId, enrolledAt, status('active'|'transferred'|'cancelled')

classTeachers (N:N professor ↔ turma ↔ disciplina)
  id, classId, teacherId, subject

FREQUÊNCIA
──────────

attendanceSessions
  id, classId, teacherId, subject, sessionDate, createdAt

attendanceRecords
  id, sessionId, studentId, status('present'|'absent'|'justified'|'late')

absenceJustifications
  id, absenceRecordId, guardianId, reason, attachment,
  status('pending'|'approved'|'rejected'), reviewedBy, reviewedAt

AVALIAÇÕES
──────────

assessments
  id, classId, teacherId, subject, title, maxScore, assessmentDate, schoolYearId

assessmentScores
  id, assessmentId, studentId, score, recordedAt, updatedAt

COMENTÁRIOS
───────────

studentComments
  id, studentId, authorId (teacherId), text, category('praise'|'improvement'),
  visibility('student'|'guardian'|'all'|'school_only'), createdAt, deletedAt

COMUNICAÇÃO
───────────

communications
  id, schoolId, authorId, title, body, attachments[], publishedAt, scheduledAt

communicationRecipients
  id, communicationId, userId, readAt

schoolEvents
  id, schoolId, authorId, title, description, eventDate, type('prova'|'feriado'|'evento'|'saida'),
  createdAt

eventTargets
  id, eventId, targetType('class'|'grade'|'all'), targetId?

NOTIFICAÇÕES
────────────

notifications
  id, userId, type, payload (JSON), readAt, createdAt

auditLogs
  id, userId, action, entity, entityId, changes (JSON), ip, createdAt
```

### 3.2 Procedures / Routers por Perfil

#### Router: `auth`

```
auth.login          → POST /auth/login
auth.logout         → POST /auth/logout
auth.me             → GET  /auth/me
auth.refreshToken   → POST /auth/refresh
```

#### Router: `student` (aluno autenticado)

```
student.attendance.list     → GET frequência própria (sem authorName)
student.grades.list         → GET notas por disciplina
student.grades.summary      → GET médias e desempenho geral
student.comments.list       → GET comentários (visibility IN student,all; sem author)
student.communications.list → GET comunicados da escola
student.events.list         → GET eventos (target = turma do aluno | all)
student.notifications.list  → GET notificações não lidas
student.notifications.read  → PATCH marcar notificação como lida
```

#### Router: `teacher` (professor autenticado)

```
teacher.classes.list              → GET turmas vinculadas ao professor
teacher.classes.students          → GET alunos de uma turma
teacher.attendance.record         → POST lançar chamada
teacher.attendance.session.list   → GET chamadas que já lançou
teacher.attendance.session.edit   → PATCH editar chamada do dia
teacher.grades.assessment.create  → POST criar avaliação
teacher.grades.record             → POST/PATCH lançar/editar nota
teacher.grades.class.summary      → GET desempenho da turma
teacher.comments.create           → POST criar comentário
teacher.comments.list             → GET comentários que criou
teacher.student.profile           → GET perfil resumido do aluno (frequência + notas)
teacher.communications.list       → GET comunicados recebidos
```

#### Router: `guardian` (responsável autenticado)

```
guardian.students.list                 → GET filhos vinculados
guardian.student.attendance            → GET frequência do filho (com authorName)
guardian.student.grades                → GET notas do filho + comparativo turma
guardian.student.comments              → GET comentários (visibility IN guardian,all; com author)
guardian.absences.justify              → POST enviar justificativa de falta
guardian.communications.list           → GET comunicados recebidos
guardian.communications.markRead       → PATCH marcar como lido
guardian.events.list                   → GET eventos das turmas do filho
guardian.notifications.list            → GET notificações
guardian.notifications.read            → PATCH marcar como lida
```

#### Router: `school` (núcleo gestor autenticado)

```
school.students.create              → POST cadastrar aluno
school.students.list                → GET listar alunos com filtros
school.students.update              → PATCH atualizar dados do aluno
school.students.deactivate          → PATCH desativar aluno (soft-delete)

school.classes.create               → POST criar turma
school.classes.list                 → GET listar turmas do ano ativo
school.classes.update               → PATCH editar turma

school.enrollments.create           → POST matricular aluno em turma
school.enrollments.transfer         → POST transferir aluno de turma

school.teachers.create              → POST cadastrar professor
school.classTeachers.assign         → POST vincular professor a turma/disciplina

school.guardians.create             → POST cadastrar responsável
school.guardians.linkStudent        → POST vincular responsável a aluno

school.communications.create        → POST publicar comunicado
school.communications.list          → GET comunicados publicados

school.events.create                → POST publicar evento
school.events.list                  → GET eventos do calendário

school.attendance.report            → GET relatório de frequência (filtros: turma, período, disciplina)
school.grades.report                → GET relatório de desempenho

school.comments.list                → GET TODOS os comentários (inclui school_only)
school.absences.justifications.list → GET justificativas pendentes
school.absences.justifications.review → PATCH aprovar/rejeitar justificativa

school.schoolYear.create            → POST criar ano letivo
school.schoolYear.close             → PATCH encerrar ano letivo

school.dashboard                    → GET métricas gerais do dia

school.users.list                   → GET usuários da escola
school.users.deactivate             → PATCH desativar usuário
```

### 3.3 Sistema de Notificações (Triggers)

```
GATILHO                           → QUEM RECEBE          → TIPO
─────────────────────────────────────────────────────────────────
Falta registrada (absent)         → Responsável           → 'absence_alert'
Nota publicada                    → Aluno + Responsável   → 'grade_published'
Comentário criado (all/student)   → Aluno                 → 'comment_received'
Comentário criado (guardian/all)  → Responsável           → 'comment_received'
Comunicado publicado              → Destinatários         → 'communication'
Evento criado                     → Turmas alvo           → 'event_reminder'
Justificativa aprovada/rejeitada  → Responsável           → 'justification_result'
```

### 3.4 Regras de Controle de Acesso (RBAC)

```
RECURSO                    ALUNO   PROFESSOR   RESPONSÁVEL   ESCOLA
──────────────────────────────────────────────────────────────────
Ver própria frequência       ✅       —           —            —
Ver frequência do filho      —        —          ✅            —
Ver freq. de qualquer aluno  ❌       ✅(turma)   ❌           ✅
Lançar chamada               ❌       ✅(turma)   ❌           ❌
Lançar nota                  ❌       ✅(turma)   ❌           ❌
Criar comentário             ❌       ✅(turma)   ❌           ❌
Ver comentário s/ autor      ✅*      —           —            —
Ver comentário c/ autor      —        —          ✅*           ✅
Ver todos comentários        ❌       ❌          ❌           ✅
Publicar comunicado          ❌       ❌          ❌           ✅
Publicar evento              ❌       ❌          ❌           ✅
Cadastrar aluno/turma        ❌       ❌          ❌           ✅
Justificar falta             ❌       ❌          ✅           —
Aprovar justificativa        ❌       ✅(parcial)  ❌          ✅

* filtro de visibility aplicado
```

### 3.5 Lacunas de Infraestrutura a Resolver

| Item                 | Solução Recomendada                                       | Prioridade |
| -------------------- | --------------------------------------------------------- | ---------- |
| Rate limiting        | `@upstash/ratelimit` ou middleware customizado no tRPC    | Alta       |
| Auditoria (LGPD)     | Tabela `auditLogs` preenchida por middleware              | Alta       |
| Soft-delete          | Campo `deletedAt` em todas as entidades críticas          | Alta       |
| Filtro de visibility | Middleware de query nos routers `student` e `guardian`    | Alta       |
| Exportação de dados  | Endpoint `school.export.studentData` (LGPD Art. 18)       | Média      |
| Notificações push    | Fila de eventos (ex: BullMQ) + integração (ex: FCM/email) | Média      |
| Revogação de sessão  | Tabela `activeSessions` com invalidação seletiva          | Média      |
| Backup               | Scheduled task com export para S3/armazenamento seguro    | Baixa      |

---

## PARTE 4 — TELAS FRONTEND (POR PERFIL)

### 4.1 Estrutura Geral de Navegação

```
/ (landing page)
  ↓ botão "Entrar"
/login
  → seletor de perfil (Aluno / Professor / Responsável / Escola)
  → OAuth ou email+senha
  ↓ sucesso
/onboarding (se primeiro acesso)
  → wizard: dados pessoais → escola → papel → confirmação

/dashboard/* (área autenticada, layout com sidebar por papel)
```

### 4.2 Telas do ALUNO

```
/dashboard/aluno
  Layout: sidebar com ícones + área principal

SIDEBAR:
  🏠 Início         → Dashboard resumo
  📅 Frequência     → Lista de presenças/faltas
  📊 Desempenho     → Notas e médias por disciplina
  💬 Comentários    → Feed de comentários recebidos
  📢 Comunicados    → Avisos da escola
  📆 Eventos        → Calendário escolar
  🔔 Notificações   → Central de alertas

TELAS:

[Início — Dashboard do Aluno]
  - Card: "Suas Faltas este mês" (número + % de presença)
  - Card: "Sua Média Geral" (nota média + indicador de tendência ↑↓)
  - Card: "Último Comentário" (preview anonimizado)
  - Card: "Próximo Evento" (data + nome do evento)
  - Lista: "Notificações recentes" (últimas 3)

[Frequência]
  - Filtro: disciplina | mês
  - Tabela: Data | Disciplina | Status (presente ✅ / falta ❌ / justificada ⚠️)
  - Rodapé: Total de faltas | % de presença | Limite máximo
  - Alerta visual (banner vermelho) se % de presença < limite

[Desempenho]
  - Seletor de disciplina (tabs horizontais)
  - Por disciplina: lista de avaliações com nota + data
  - Gráfico simples de evolução (linha por avaliação)
  - Card de média atual com indicador de aprovação/risco

[Comentários]
  - Cards: ícone de tipo (⭐ elogio / 🔄 melhoria) + texto + data
  - SEM nome do professor
  - Filtrável por categoria

[Comunicados]
  - Lista de comunicados com título, data, preview
  - Ao clicar: modal com conteúdo completo + anexos

[Eventos / Calendário]
  - Visualização mensal
  - Badge por tipo: 📝 Prova | 🎉 Evento | 🚪 Saída antecipada | 📅 Feriado
  - Ao clicar no dia: lista dos eventos do dia
```

### 4.3 Telas do PROFESSOR

```
/dashboard/professor

SIDEBAR:
  🏠 Início
  📋 Minhas Turmas
  ✅ Chamada
  📝 Avaliações
  💬 Comentários
  📢 Comunicados

[Início — Dashboard do Professor]
  - Card: "Chamadas pendentes hoje" (turmas sem chamada lançada)
  - Card: "Alunos com muitas faltas" (alerta rápido)
  - Card: "Últimas notas lançadas"
  - Atalho rápido: "Lançar chamada agora"

[Minhas Turmas]
  - Grid de cards: uma turma por card (nome, série, turno, nº alunos)
  - Ao clicar: abre lista de alunos da turma
  - Por aluno: ícone para ver perfil resumido

[Chamada]
  - Step 1: selecionar turma (dropdown)
  - Step 2: selecionar data (default: hoje) e disciplina
  - Step 3: lista de alunos com toggle presente/falta por linha
  - Botão "Salvar Chamada" → confirmação
  - Histórico: aba "Chamadas anteriores" com filtro por data

[Perfil Resumido do Aluno — modal ou página]
  - Nome, foto, matrícula
  - Frequência: % de presença na matéria do professor
  - Notas nas avaliações lançadas pelo professor
  - SEM acesso a dados de outras disciplinas

[Avaliações]
  - Lista de avaliações criadas (por turma)
  - Botão "Nova Avaliação": { título, nota máx, data }
  - Ao abrir avaliação: planilha inline com nota por aluno
  - Status: "Publicada" / "Rascunho"

[Comentários]
  - Lista de comentários que criou (por aluno)
  - Botão "Novo Comentário":
      → Buscar aluno (da turma)
      → Texto livre
      → Categoria: elogio / melhoria
      → Visibilidade: Aluno / Responsável / Todos / Apenas escola
  - Preview: "Quem verá este comentário?"
```

### 4.4 Telas do RESPONSÁVEL

```
/dashboard/responsavel

SIDEBAR:
  🏠 Início
  👤 [Nome do Filho]  ← seletor se múltiplos filhos
  📅 Frequência
  📊 Desempenho
  💬 Comentários
  📢 Comunicados
  📆 Eventos
  🔔 Notificações

[Início — Dashboard do Responsável]
  - Card de resumo do filho: foto + nome + turma
  - Card: "Faltas este mês" (número + alerta se crítico)
  - Card: "Média Geral" + tendência
  - Card: "Último comunicado não lido"
  - Card: "Próximo evento importante"
  - Feed: últimas notificações

[Frequência]
  - Similar ao do aluno, MAS inclui:
      - Nome do professor da sessão
      - Botão "Justificar" em faltas sem justificativa
      - Status da justificativa enviada (pendente / aprovada / rejeitada)
  - Comparativo: % de presença do filho vs média da turma

[Comentários — COM autoria]
  - Cards com: categoria + texto + **nome do professor** + data
  - Filtro por categoria e período

[Comunicados]
  - Lista com badge "Não lido"
  - Ao abrir: conteúdo completo + botão "Marcar como lido"
  - Recibo de leitura salvo

[Justificar Falta — modal]
  - Falta selecionada (data + disciplina + professor)
  - Campo de texto: motivo
  - Upload opcional: atestado/documento
  - Submit → status "Aguardando análise"
```

### 4.5 Telas da ESCOLA / NÚCLEO GESTOR

```
/dashboard/escola

SIDEBAR:
  🏠 Dashboard
  👥 Alunos
  🏛️ Turmas
  👩‍🏫 Professores
  👨‍👩‍👧 Responsáveis
  📊 Relatórios
  📢 Comunicados
  📆 Eventos
  ⚙️ Configurações

[Dashboard da Escola]
  - Card: "Presença hoje" (% de alunos presentes)
  - Card: "Alunos em alerta" (lista clicável — falta acima de X%)
  - Card: "Comunicados não lidos" (nº de responsáveis que não leram)
  - Card: "Justificativas pendentes" (para revisar)
  - Gráfico: frequência dos últimos 30 dias
  - Agenda: próximos eventos da semana

[Alunos — CRUD]
  - Tabela paginada com busca e filtros (turma, série, status)
  - Ação: "Novo Aluno" → formulário em steps
      Step 1: Dados pessoais (nome, nascimento, matrícula, foto)
      Step 2: Vínculo com turma (ano letivo ativo)
      Step 3: Dados de acesso (email para login)
      Step 4: Vincular responsável (existente ou novo)
  - Ao clicar no aluno: ficha completa com tabs:
      → Dados | Frequência | Notas | Comentários | Histórico

[Turmas — CRUD]
  - Cards por série/turma com nº de alunos e professores
  - "Nova Turma": { série, turno, ano letivo }
  - Ao abrir turma:
      → Aba "Alunos": lista + botão "Matricular aluno"
      → Aba "Professores": lista + botão "Vincular professor + disciplina"

[Comunicados]
  - Lista de comunicados publicados (status + nº de leituras / total)
  - "Novo Comunicado":
      → Título + corpo de texto rico
      → Destinatários: Todos | Por turma | Por série | Responsáveis somente
      → Anexos (PDF, imagem)
      → Agendar publicação (opcional)
  - Preview antes de publicar

[Eventos]
  - Calendário anual
  - "Novo Evento": título, data, tipo, descrição, público-alvo
  - Ao publicar → notificação enviada para turmas alvo

[Relatórios]
  - Frequência: filtros por turma + disciplina + período → tabela + exportar CSV/PDF
  - Desempenho: médias por turma + distribuição de notas
  - Comentários: todos os comentários (inclui school_only) por período

[Configurações]
  - Ano letivo: criar / encerrar / períodos de avaliação
  - Perfil da escola: nome, logo, dados
  - Usuários: ativar/desativar contas, redefinir senhas
  - Notificações: configurar quais tipos de alerta são enviados por email vs in-app
```

---

## PARTE 5 — CHECKLIST DE IMPLEMENTAÇÃO (PRIORIDADE)

### 🔴 Alta Prioridade (core do RED)

- [ ] Filtro de `visibility` nos endpoints de comentários (aluno e responsável)
- [ ] Procedure `attendance.record` com todas as validações
- [ ] Sistema de notificações in-app (tabela + trigger automático)
- [ ] Endpoint `guardian.student.attendance` com `teacherName`
- [ ] Dashboard do aluno, professor e responsável (telas)
- [ ] Tela de chamada para professor (step-by-step)
- [ ] Tela de frequência para responsável (com justificativa)

### 🟡 Média Prioridade

- [ ] Procedure `grades.record` com upsert
- [ ] Sistema de justificativa de falta (fluxo responsável → escola)
- [ ] Publicação de comunicados com destinatários bulk
- [ ] Calendário de eventos com filtro por turma
- [ ] Dashboard da escola com métricas

### 🟢 Baixa Prioridade (evolução)

- [ ] Rate limiting e auditoria (LGPD)
- [ ] Exportação de dados
- [ ] Soft-delete generalizado
- [ ] Notificações por email
- [ ] Comparativo de desempenho (filho vs turma)
- [ ] Gráficos de tendência de frequência

---

_Documento gerado com base em pesquisa de mercado EdTech (PowerSchool, ClassDojo, Classter, Educ21, QuickSchools) e análise do projeto RED — Registro Escolar Digital._
