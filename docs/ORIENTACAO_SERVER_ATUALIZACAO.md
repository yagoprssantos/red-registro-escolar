# Orientacao para Atualizacao do apps/server/

Este documento orienta o que precisa ser atualizado no backend para que as telas
do RED tenham dados mais completos e a aplicacao fique pronta para uso real.

---

## 1) Contexto atual

### O que ja existe

O servidor possui rotas tRPC organizadas em:

- **routers.ts** (raiz): auth, contacts, schools, onboarding
- **profiles.ts**: profiles.teacher.*, profiles.student.*, profiles.guardian.*
- **registry.ts**: CRUD generico para 27 entidades + notificacoes
- **domain/attendance**: attendance.create, attendance.bySession
- **domain/comments**: comments.create, comments.forStudent, comments.byTeacher
- **domain/communications**: communications.create, forUser, markRead, readStats, listBySchool
- **domain/events**: events.create, events.forUser
- **domain/grades**: grades.record, assessmentCreate, classSummary, byAssessment
- **domain/justifications**: justifications.create, listMine, listBySchool, review, byId
- **domain/school**: school.dashboard, attendanceReport, gradesReport, exportStudentData
- **domain/audit**: audit.list

O seed fake (fakeData.ts) gera:
- 2 escolas com 2 anos letivos cada
- 4 professores, 20 alunos, 30 responsaveis
- 6 turmas (6A, 7A, 8A por escola), 4 disciplinas
- 1 sessao por classSubject, 1 avaliacao por classSubject
- 1 attendanceRecord por aluno por sessao
- 12 comentarios pedagogicos
- 2 eventos, 2 comunicados, 2 anexos, 2 contatos
- Notificacoes basicas (grade_published, general, event_reminder)

### O que falta

As telas do frontend estao todas dinamicamente conectadas, mas muitos dados
sao escassos ou insuficientes para uma experiencia completa. As secoes abaixo
detalham cada ponto.

---

## 2) Seed: ampliar volume e variedade de dados

### 2.1 Mais sessoes de aula

**Problema:** Hoje o seed cria apenas 1 classSession por classSubject.
As telas StudentAttendance, TeacherAttendance e SchoolReports precisam de
multiplas sessoes para mostrar historico significativo.

**Acao:** Gerar pelo menos 10-15 classSessions por classSubject, espalhadas
ao longo do bimestre (marco a junho), com topicos variados.

```
Exemplo de topicos por disciplina:
- Matematica: "Conjuntos numericos", "Operacoes com fracoes", "Equacoes de 1o grau"...
- Portugues: "Interpretacao textual", "Classes de palavras", "Producao narrativa"...
- Ciencias: "Ciclo da agua", "Ecossistemas", "Sistema digestorio"...
- Historia: "Civilizacoes antigas", "Grecia classica", "Roma republicana"...
```

### 2.2 Mais attendanceRecords (presenca por aula)

**Problema:** Hoje cada aluno tem apenas 1 registro de presenca.
As telas StudentAttendance, GuardianAttendance, SchoolReports e o indicador
"Pe de Meia" (75% presenca) precisam de um historico realista.

**Acao:** Para cada aluno matriculado, gerar attendanceRecords para todas
as classSessions de sua turma. Distribuicao sugerida:
- ~80% present
- ~10% absent
- ~10% justified

Isso permite testar o alerta de frequencia < 75% em alguns alunos de forma realista.

### 2.3 Multiplas avaliacoes por disciplina

**Problema:** Hoje 1 avaliacao por classSubject. As telas StudentGrades,
GuardianGrades, TeacherGrades, StudentTranscript e SchoolReports precisam
de diversidade.

**Acao:** Gerar ao menos 3-4 avaliacoes por classSubject:
- "Avaliacao 1 - 1o Bimestre"
- "Trabalho 1 - 1o Bimestre"
- "Avaliacao 2 - 2o Bimestre"
- "Trabalho 2 - 2o Bimestre"

Com pesos variados (prova peso 2, trabalho peso 1) e maxScore 10.

### 2.4 assessmentScores com variacao realista

**Problema:** Hoje notas entre 6.5-10.0 sem feedback variado.

**Acao:** Expandir faixa para 2.0-10.0 com distribuicao mais realista:
- ~20% dos alunos com nota < 5.0 (abaixo da media, aparece no relatorio de risco)
- ~50% entre 5.0-7.5
- ~30% acima de 7.5

Feedbacks variados: "Excelente", "Bom desenvolvimento", "Precisa reforcar",
"Recomendacao de recuperacao", etc.

### 2.5 Mais comentarios pedagogicos

**Problema:** Hoje apenas 12 comentarios com conteudo generico.

**Acao:** Gerar comentarios para todos os 20 alunos, variando:
- Categorias: elogio (~25%), melhoria (~25%), ocorrencia (~15%), comentario (~35%)
- Visibilidade: student, guardian, school, all (distribuicao uniforme)
- Conteudos especificos por disciplina e situacao

### 2.6 Mais eventos escolares

**Problema:** 2 eventos apenas (Feira Pedagogica, Semana Cultural).

**Acao:** Gerar 8-12 eventos por escola, cobrindo todos os eventType:
- prova: 2-3 por turma (datas de avaliacao bimestral)
- feriado: 2-3 (carnaval, pascoa, feriado nacional)
- saida_antecipada: 1-2 (reuniao de pais)
- evento_escolar: 2-3 (feira cultural, dia do aluno, olimpiada)
- reuniao: 1-2 (conselho de classe, reuniao pedagogica)

Com eventTargets variados (school, class, student).

### 2.7 Mais comunicados

**Problema:** 2 comunicados apenas por escola.

**Acao:** Gerar 5-8 comunicados por escola:
- announcement: comunicado geral, informativo de matricula
- reminder: lembrete de reuniao, prazo de documentos
- alert: alerta de saude, comunicacao urgente

Com recipients variados (guardians, teachers, staff) e alguns ja com readAt
marcado para testar o filtro de lidos/nao lidos.

### 2.8 absenceJustifications

**Problema:** Nenhuma justificativa e criada no seed.

**Acao:** Gerar 3-5 justificativas por escola:
- 2 pending (para testar a tela de aprovacao da gestao)
- 1 approved (com reviewedByUserId e reviewedAt)
- 1 rejected (com reviewNotes)

### 2.9 schoolPlatforms

**Problema:** Nenhuma plataforma e semeada. As telas StudentPlatforms e
GuardianPlatforms usam fallback hardcoded.

**Acao:** Inserir schoolPlatforms para cada escola com as 5 plataformas
que hoje sao hardcoded no frontend:
- Google Classroom, SISEDU, SIC, Enem na Rede, Conexao Educacao

@ApiReference: ver FALLBACK_PLATFORMS em StudentPlatforms.tsx e GuardianPlatforms.tsx

### 2.10 scheduleSlots

**Problema:** Nenhum slot de horario e semeado. StudentSchedule usa
DEFAULT_HOURS hardcoded.

**Acao:** Inserir scheduleSlots para cada turno:
- Morning: 5 slots (07:00-07:45, 07:45-08:30, 08:45-09:30, 09:30-10:15, 10:30-11:15)
- Afternoon: 5 slots (13:00-13:45, 13:45-14:30, 14:45-15:30, 15:30-16:15, 16:30-17:15)

### 2.11 Notificacoes variadas

**Problema:** Apenas 3 tipos de notificacao (grade_published, general, event_reminder).

**Acao:** Gerar notificacoes de todos os tipos para testar cada tela:
- absence_alert: para responsaveis e alunos com faltas
- comment_received: para responsaveis e alunos com comentarios
- communication: para todos quando comunicado e criado
- justification_pending: para gestao escolar quando ha justificativa pendente
- justification_result: para responsaveis quando justificativa e revisitada
- event_reminder: para todos proximo a evento

### 2.12 Contatos de demonstracao

**Problema:** 2 contatos apenas.

**Acao:** Gerar 4-6 contatos por escola com status variado:
- novo: 2-3
- respondido: 1-2
- descartado: 1

---

## 3) Novos procedures tRPC necessarios

### 3.1 profiles.teacher.schedule

**Tela:** Nao existe tela de horario do professor ainda, mas e necessaria.

**Descricao:** Retorna a grade horaria do professor (classSubjects por dia/semana
com scheduleSlots). Permite o professor ver suas aulas da semana.

**Retorno:**
```ts
{ schedule: Array<{ dayOfWeek: number, slot: ScheduleSlot, classSubject: ClassSubject & { class: Class, subject: Subject } }> }
```

### 3.2 school.managePlatforms

**Tela:** SchoolSettings.tsx (aba de plataformas)

**Descricao:** CRUD de schoolPlatforms (criar, atualizar, remover, reordenar).
Hoje o perfil school nao tem como gerenciar as plataformas sem usar o registry
generico.

**Retorno:** Confirmacao de sucesso + plataforma criada/atualizada.

### 3.3 school.manageSchedule

**Tela:** SchoolSettings.tsx (aba de horarios)

**Descricao:** CRUD de scheduleSlots (criar, atualizar, remover slots por turno).
Permite a gestao configurar os horarios de aula da escola.

**Retorno:** Confirmacao de sucesso + slot criado/atualizado.

### 3.4 school.createSchoolYear

**Tela:** SchoolSettings.tsx (ja chama registry.create para schoolYears)

**Descricao:** Procedure dedicada para criar ano letivo com validacao
(nao permitir ano duplicado, validar datas).

**Retorno:** schoolYear criado.

### 3.5 school.closeSchoolYear

**Tela:** SchoolSettings.tsx

**Descricao:** Marca isCurrent = 0 no ano letivo e cria novo ano como atual.
Valida se ha turmas ativas.

**Retorno:** ano antigo + novo ano.

### 3.6 guardian.studentsAttendanceDetail

**Tela:** GuardianAttendance.tsx (hoje faz multiplas chamadas registry.list)

**Descricao:** Procedure otimizada que retorna, para cada aluno do responsavel:
- estatisticas de presenca (total, presentes, ausentes, justificados, %)
- registros de presenca com detalhes (data, disciplina, professor)
- alertas se frequencia < 75%

**Retorno:**
```ts
{ students: Array<{ student: Student, stats: AttendanceStats, records: AttendanceRecordDetail[], alerts: string[] }> }
```

### 3.7 student.classSchedule

**Tela:** StudentSchedule.tsx (hoje monta a grade com multiplas queries)

**Descricao:** Procedure otimizada que retorna a grade semanal do aluno:
- scheduleSlots do turno da turma
- classSubjects mapeados por dia da semana (via classSessions ou tabela futura)

**Retorno:**
```ts
{ slots: ScheduleSlot[], grid: Array<{ dayOfWeek: number, slotNumber: number, classSession: ClassSessionDetail | null }> }
```

---

## 4) Melhorias em procedures existentes

### 4.1 profiles.student.me: incluir media geral

**Tela:** StudentDashboard.tsx, StudentBio.tsx

**Acao:** A procedure ja retorna dados basicos, mas poderia incluir
a media geral do aluno (calculada a partir de assessmentScores) para
evitar query extra no frontend.

### 4.2 profiles.guardian.studentPerformance: ampliar dados

**Tela:** GuardianDashboard.tsx, GuardianGrades.tsx

**Acao:** Incluir historico de frequencia mensal (para grafico de tendencia),
ranking relativo na turma (quartil), e indicador de Pe de Meia.

### 4.3 communications.forUser: incluir unreadCount

**Tela:** StudentCommunications.tsx, GuardianCommunications.tsx, TeacherCommunications.tsx

**Acao:** Retornar tambem o total de comunicados nao lidos no objeto
de retorno para facilitar o badge de notificacao sem query extra.

### 4.4 school.dashboard: incluir trend

**Tela:** SchoolDashboard.tsx

**Acao:** Adicionar tendencia comparativa (presenca hoje vs semana passada,
alunos em risco vs mes passado) para indicar se a situacao esta melhorando ou piorando.

### 4.5 registry: suportar bulk operations

**Tela:** SchoolStudents.tsx, SchoolClasses.tsx

**Acao:** Adicionar procedures para criacao em lote:
- registry.createBulk: inserir varios registros de uma vez (ex.: importar planilha de alunos)
- registry.enrollBulk: matricular varios alunos em uma turma

---

## 5) Relacoes Drizzle pendentes

### 5.1 absenceJustifications

**Problema:** A tabela existe no schema mas nao tem relacoes definidas em relations.ts.

**Acao:** Adicionar em relations.ts:
```ts
export const absenceJustificationsRelations = relations(absenceJustifications, ({ one }) => ({
  attendanceRecord: one(attendanceRecords, {
    fields: [absenceJustifications.attendanceRecordId],
    references: [attendanceRecords.id],
  }),
  guardian: one(guardians, {
    fields: [absenceJustifications.guardianId],
    references: [guardians.id],
  }),
  reviewer: one(users, {
    fields: [absenceJustifications.reviewedByUserId],
    references: [users.id],
  }),
}));
```

E adicionar relacoes reversas nas tabelas existentes:
- attendanceRecords: `many(absenceJustifications)`
- guardians: `many(absenceJustifications)`

### 5.2 schoolPlatforms

**Acao:** Adicionar em relations.ts:
```ts
export const schoolPlatformsRelations = relations(schoolPlatforms, ({ one }) => ({
  school: one(schools, {
    fields: [schoolPlatforms.schoolId],
    references: [schools.id],
  }),
}));
```

E adicionar no schoolsRelations: `platforms: many(schoolPlatforms)`.

### 5.3 scheduleSlots

**Acao:** Adicionar em relations.ts:
```ts
export const scheduleSlotsRelations = relations(scheduleSlots, ({ one }) => ({
  school: one(schools, {
    fields: [scheduleSlots.schoolId],
    references: [schools.id],
  }),
}));
```

E adicionar no schoolsRelations: `scheduleSlots: many(scheduleSlots)`.

### 5.4 auditLogs

**Acao:** Adicionar em relations.ts:
```ts
export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
  school: one(schools, {
    fields: [auditLogs.schoolId],
    references: [schools.id],
  }),
}));
```

E adicionar nas relacoes existentes:
- usersRelations: `auditLogs: many(auditLogs)`
- schoolsRelations: `auditLogs: many(auditLogs)`

### 5.5 attachments

**Acao:** Criar relacao ([nota]: attachments usa ownerType polimorfico, entao
relacoes tipadas sao parciais). Adicionar relacao reversa em communications:
```ts
// em communicationsRelations:
attachments: many(attachments)
```
(Obs.: so faz sentido se usado frequentemente com communications; caso contrario,
a busca polimorfica via ownerType + ownerId no codigo e suficiente.)

---

## 6) Schema: novas tabelas recomendadas

### 6.1 classSchedule (grade semanal por turma)

**Problema:** Hoje nao ha forma de vincular um classSubject a um dia da semana
e horario especifico. A tela StudentSchedule.tsx monta a grade a partir
de classSessionsexistentes, mas sem uma definicao fixa a grade muda conforme
as sessoes sao registradas.

**Acao:** Criar tabela classSchedule:
```ts
export const classSchedule = mysqlTable("classSchedule", {
  id: serial("id").primaryKey(),
  classSubjectId: int("classSubjectId").notNull().references(() => classSubjects.id, { onDelete: "cascade" }),
  dayOfWeek: int("dayOfWeek").notNull(), // 1=seg, 5=sex
  slotId: int("slotId").notNull().references(() => scheduleSlots.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  uniqueIndex("classSchedule_slot_uq").on(table.classSubjectId, table.dayOfWeek, table.slotId),
  index("classSchedule_day_idx").on(table.dayOfWeek),
]);
```

Isso permite definir "Matematica acontece toda segunda no 1o horario" e resolve
a grade semanal de forma estruturada.

### 6.2 Tabela futura: onlineAssessments

**Problema:** StudentOnlineAssessments.tsx existe mas usa dados de assessments
com filtros simples. Nao ha tabela especifica para avaliacoes online com
prazo, formato (multipla escolha, dissertativa), e status de submissao.

**Acao (fase futura):** Criar tabela onlineAssessments com:
- assessmentId (FK)
- dueDate
- format (multiple_choice, essay, mixed)
- timeLimit (minutos)
- status (draft, published, closed)
E tabela onlineAssessmentSubmissions com:
- onlineAssessmentId, studentId, submittedAt, score, answers (JSON)

---

## 7) Priorizacao sugerida

### Alta (impacto imediato nas telas)

1. **Ampliar seed** (secoes 2.1-2.12) - sem dados suficientes, as telas parem vazias
2. **Adicionar relacoes Drizzle** (secao 5) - relacoes faltantes impedem joins automaticos
3. **schoolPlatforms + scheduleSlots no seed** (secoes 2.9-2.10) - remove fallbacks hardcoded

### Media (melhora a experiencia)

4. **Procedures otimizados** (secoes 3.6-3.7, 4.1-4.4) - reduz chamadas multiplas do frontend
5. **Tabela classSchedule** (secao 6.1) - resolva grade semanal de forma estruturada
6. **Bulk operations** (secao 4.5) - facilita imports e operacoes em massa

### Baixa (futuro)

7. **onlineAssessments** (secao 6.2) - quando a funcionalidade de prova online for priorizada
8. **Procedures de gestao** (secoes 3.1-3.5) - telas novas ou melhorias em SchoolSettings

---

## 8) Resumo dos arquivos a alterar

| Arquivo | O que fazer |
|---------|-------------|
| `apps/server/src/scripts/fakeData.ts` | Ampliar seed conforme secao 2 |
| `drizzle/relations.ts` | Adicionar relacoes ausentes (secao 5) |
| `apps/server/src/profiles.ts` | Melhorar procedures existentes (secao 4.1-4.4) e adicionar novos (secao 3.1, 3.6-3.7) |
| `apps/server/src/domain/school/school.router.ts` | Adicionar managePlatforms, manageSchedule, createSchoolYear, closeSchoolYear (secao 3.2-3.5) |
| `apps/server/src/registry.ts` | Adicionar createBulk, enrollBulk (secao 4.5) |
| `drizzle/schema.ts` | Adicionar classSchedule (secao 6.1) |
| `apps/server/src/db.ts` | Adicionar funcoes de acesso para novos dominios |
