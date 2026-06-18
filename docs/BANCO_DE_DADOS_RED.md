<!-- markdownlint-disable MD032 MD041 -->

# Documento Unico de Apresentacao do Banco de Dados RED

## 1) O que e este banco

Este banco guarda os dados da plataforma RED (Registro Escolar Digital). Ele foi desenhado para suportar quatro perfis principais:

- aluno
- professor
- gestao escolar
- responsavel

Em termos simples, pense no banco como um conjunto de cadernos organizados:

- cada tabela e um caderno
- cada linha e um registro
- cada coluna e um campo daquele registro
- as ligacoes entre tabelas evitam inconsistencias e duplicacoes

## 2) Objetivo do desenho

Objetivos tecnicos do banco:

- representar operacao escolar real (turma, aula, falta, nota, comentarios, eventos e comunicacao)
- manter integridade dos dados com chaves, constraints e relacionamentos
- facilitar consultas para dashboards de perfil
- evitar arquivos pesados no banco (uso de URL em attachments)
- suportar evolucao futura com baixo retrabalho
- oferecer rastreabilidade de acoes relevantes (auditLogs)
- permitir justificativa de faltas com trilha de aprovacao (absenceJustifications)
- suportar plataformas externas por escola (schoolPlatforms)
- definir grade horaria configuravel (scheduleSlots)
- controle de visitas e leitura de comunicados (communicationRecipients com readAt)
- soft delete em registros criticos (deletedAt em varias tabelas)

## 3) Mapa geral por dominio

Dominios principais:

- Identidade e acesso: users
- Institucional: schools, schoolYears, userSchools, schoolStaffProfiles
- Perfis escolares: teachers, students, guardians, studentGuardians
- Academico: subjects, classes, classSubjects, classTeachers, classEnrollments
- Diario escolar: classSessions, attendanceRecords, assessments, assessmentScores
- Justificativa de faltas: absenceJustifications
- Pedagogico e comunicacao: studentComments, schoolEvents, eventTargets, communications, communicationRecipients, notifications, attachments
- Plataformas externas: schoolPlatforms
- Grade horaria: scheduleSlots
- Auditoria: auditLogs
- Comercial/contato: contacts

## 4) Glossario rapido para leigos

Termos essenciais:

- PK (Primary Key): identificador unico da linha
- FK (Foreign Key): campo que aponta para outra tabela
- Index: atalho para busca rapida
- Unique: regra para impedir duplicidade
- Cascade: se apagar o pai, apaga os filhos relacionados
- Set null: se apagar o pai, o campo relacionado vira vazio
- Soft delete: campo deletedAt marca como removido sem apagar a linha fisica

## 5) Dicionario completo: tabela por tabela

### 5.1 users

Para que serve:

- cadastro base de identidade dos usuarios da plataforma

Atributos:

- id: inteiro, PK, auto incremento. Identificador interno do usuario.
- openId: texto curto, unico, obrigatorio. Identidade externa de autenticacao.
- name: texto, opcional. Nome exibivel.
- email: texto curto, opcional, com index. Contato e login auxiliar.
- loginMethod: texto curto, opcional. Metodo de autenticacao usado.
- role: enum obrigatorio (user, admin, teacher, student, guardian, school_staff). Papel global do usuario na plataforma.
- defaultProfile: enum opcional (school, teacher, student, guardian). Perfil padrao para abertura da experiencia.
- createdAt: data/hora obrigatorio. Momento de criacao.
- updatedAt: data/hora obrigatorio. Momento da ultima atualizacao.
- lastSignedIn: data/hora obrigatorio. Ultimo acesso.

Indices:

- users_email_idx sobre email

Por que foi criada:

- centralizar identidade para todos os perfis e evitar duplicar usuario em cada contexto.

### 5.2 schools

Para que serve:

- cadastro da instituicao escolar

Atributos:

- id: inteiro, PK.
- name: texto curto, obrigatorio. Nome da escola.
- email: texto curto, obrigatorio, unico. Email institucional unico.
- phone: texto curto, opcional. Telefone.
- address: texto, opcional. Endereco completo.
- city: texto curto, opcional. Cidade.
- state: texto curto, opcional. Estado/UF.
- zipCode: texto curto, opcional. CEP.
- studentCount: inteiro, opcional. Total estimado de alunos.
- status: enum obrigatorio (ativo, inativo, trial). Estado da escola.
- createdAt: data/hora obrigatorio.
- updatedAt: data/hora obrigatorio.

Por que foi criada:

- separar o contexto institucional e permitir multi escola.

### 5.3 schoolYears

Para que serve:

- representar ano letivo por escola

Atributos:

- id: inteiro, PK.
- schoolId: inteiro, FK para schools, obrigatorio, cascade.
- name: texto curto, obrigatorio. Exemplo: 2026.
- startDate: data obrigatorio.
- endDate: data obrigatorio.
- isCurrent: inteiro obrigatorio (0 ou 1). Marca ano atual.
- createdAt: data/hora obrigatorio.
- updatedAt: data/hora obrigatorio.

Indices:

- Unique: schoolId + name
- schoolId
- schoolId + isCurrent

Por que foi criada:

- dar contexto temporal para turmas, matriculas e historico.

### 5.4 userSchools

Para que serve:

- vincular usuario a escola com papel operacional

Atributos:

- id: inteiro, PK.
- userId: inteiro, FK para users, obrigatorio, cascade.
- schoolId: inteiro, FK para schools, obrigatorio, cascade.
- role: enum obrigatorio (admin, director, coordinator, teacher, guardian, student). Papel do usuario naquela escola.
- createdAt: data/hora obrigatorio.

Indices:

- Unique: userId + schoolId
- userId
- schoolId

Por que foi criada:

- um usuario pode atuar em escolas diferentes com papeis diferentes.

### 5.5 schoolStaffProfiles

Para que serve:

- detalhar perfil de equipe escolar (gestao/secretaria)

Atributos:

- id: inteiro, PK.
- userId: inteiro, FK para users, obrigatorio, cascade.
- schoolId: inteiro, FK para schools, obrigatorio, cascade.
- role: enum obrigatorio (admin, director, coordinator, secretary).
- positionTitle: texto curto, opcional. Cargo legivel.
- createdAt: data/hora obrigatorio.
- updatedAt: data/hora obrigatorio.

Indices:

- Unique: userId + schoolId + role
- schoolId

Por que foi criada:

- separar equipe administrativa dos demais papeis e dar flexibilidade de gestao.

### 5.6 teachers

Para que serve:

- perfil de professor na escola

Atributos:

- id: inteiro, PK.
- userId: inteiro, FK para users, obrigatorio, cascade.
- schoolId: inteiro, FK para schools, obrigatorio, cascade.
- name: texto curto, obrigatorio.
- email: texto curto, obrigatorio.
- phone: texto curto, opcional.
- subject: texto curto, opcional. Area principal.
- active: inteiro obrigatorio (0 ou 1). Ativo/inativo.
- deletedAt: data/hora, opcional. Soft delete.
- createdAt: data/hora obrigatorio.
- updatedAt: data/hora obrigatorio.

Indices:

- Unique: userId + schoolId
- schoolId
- email

Por que foi criada:

- manter dados profissionais e ligacoes academicas de docencia com suporte a remocao logica.

### 5.7 students

Para que serve:

- perfil academico do aluno

Atributos:

- id: inteiro, PK.
- userId: inteiro, FK opcional para users, set null. Permite aluno sem login.
- schoolId: inteiro, FK para schools, obrigatorio, cascade.
- enrollmentNumber: texto curto, opcional. Matricula interna.
- name: texto curto, obrigatorio.
- email: texto curto, opcional.
- phone: texto curto, opcional.
- dateOfBirth: data, opcional.
- grade: texto curto, opcional. Serie/ano.
- status: enum obrigatorio (ativo, inativo, transferido). Situacao academica.
- deletedAt: data/hora, opcional. Soft delete.
- createdAt: data/hora obrigatorio.
- updatedAt: data/hora obrigatorio.

Indices:

- Unique: userId + schoolId
- Unique: schoolId + enrollmentNumber
- schoolId
- status

Por que foi criada:

- concentrar identidade academica, status e vinculos escolares do aluno.

### 5.8 guardians

Para que serve:

- perfil de responsavel legal

Atributos:

- id: inteiro, PK.
- userId: inteiro, FK opcional para users, set null.
- schoolId: inteiro, FK para schools, obrigatorio, cascade.
- name: texto curto, obrigatorio.
- email: texto curto, obrigatorio.
- phone: texto curto, opcional.
- relationship: texto curto, opcional. Exemplo: mae/pai/tutor.
- deletedAt: data/hora, opcional. Soft delete.
- createdAt: data/hora obrigatorio.
- updatedAt: data/hora obrigatorio.

Indices:

- Unique: userId + schoolId
- schoolId
- email

Por que foi criada:

- suportar comunicacao e acompanhamento de alunos por familia com suporte a remocao logica.

### 5.9 studentGuardians

Para que serve:

- relacao N para N entre alunos e responsaveis

Atributos:

- id: inteiro, PK.
- studentId: inteiro, FK para students, obrigatorio, cascade.
- guardianId: inteiro, FK para guardians, obrigatorio, cascade.
- relationship: texto curto, opcional.
- isPrimary: inteiro obrigatorio (0 ou 1). Responsavel principal.
- createdAt: data/hora obrigatorio.

Indices:

- Unique: studentId + guardianId
- studentId
- guardianId

Por que foi criada:

- um aluno pode ter varios responsaveis e um responsavel pode acompanhar varios alunos.

### 5.10 contacts

Para que serve:

- registro de contatos recebidos (ex.: formularios)

Atributos:

- id: inteiro, PK.
- schoolId: inteiro, FK opcional para schools, set null.
- name: texto curto, obrigatorio.
- email: texto curto, obrigatorio.
- school: texto curto, obrigatorio. Nome informado no contato.
- role: texto curto, obrigatorio. Papel de quem contatou.
- students: texto curto, opcional. Faixa de alunos.
- message: texto, opcional.
- status: enum obrigatorio (novo, respondido, descartado). Estado de tratamento.
- createdAt: data/hora obrigatorio.
- updatedAt: data/hora obrigatorio.

Indices:

- schoolId

Por que foi criada:

- manter trilha comercial e operacional de contatos externos.

### 5.11 subjects

Para que serve:

- catalogo de disciplinas por escola

Atributos:

- id: inteiro, PK.
- schoolId: inteiro, FK para schools, obrigatorio, cascade.
- name: texto curto, obrigatorio.
- code: texto curto, opcional. Codigo da disciplina.
- description: texto, opcional.
- createdAt: data/hora obrigatorio.
- updatedAt: data/hora obrigatorio.

Indices:

- Unique: schoolId + name
- Unique: schoolId + code
- schoolId

Por que foi criada:

- normalizar disciplinas e evitar repeticoes em turmas e avaliacoes.

### 5.12 classes

Para que serve:

- cadastro de turmas

Atributos:

- id: inteiro, PK.
- schoolId: inteiro, FK para schools, obrigatorio, cascade.
- schoolYearId: inteiro, FK para schoolYears, obrigatorio, cascade.
- name: texto curto, obrigatorio. Exemplo: 6A.
- gradeLabel: texto curto, obrigatorio. Exemplo: 6o Ano A.
- course: texto curto, opcional. Nome do curso/trilha.
- shift: enum obrigatorio (morning, afternoon, evening, full_day). Turno.
- status: enum obrigatorio (ativo, inativo, encerrada). Situacao da turma.
- deletedAt: data/hora, opcional. Soft delete.
- createdAt: data/hora obrigatorio.
- updatedAt: data/hora obrigatorio.

Indices:

- Unique: schoolYearId + name
- schoolId
- schoolYearId

Por que foi criada:

- dar unidade academica para alocar alunos e disciplinas, com campo de curso para especializacao e suporte a remocao logica.

### 5.13 classSubjects

Para que serve:

- ligar turma com disciplina

Atributos:

- id: inteiro, PK.
- classId: inteiro, FK para classes, obrigatorio, cascade.
- subjectId: inteiro, FK para subjects, obrigatorio, restrict.
- createdAt: data/hora obrigatorio.

Indices:

- Unique: classId + subjectId
- classId
- subjectId

Por que foi criada:

- uma turma tem varias disciplinas e uma disciplina pode estar em varias turmas.

### 5.14 classTeachers

Para que serve:

- ligar professor ao par turma-disciplina

Atributos:

- id: inteiro, PK.
- classSubjectId: inteiro, FK para classSubjects, obrigatorio, cascade.
- teacherId: inteiro, FK para teachers, obrigatorio, cascade.
- createdAt: data/hora obrigatorio.

Indices:

- Unique: classSubjectId + teacherId
- teacherId

Por que foi criada:

- registrar docencia real e permitir multiplos professores por contexto quando necessario.

### 5.15 classEnrollments

Para que serve:

- matricula de aluno na turma

Atributos:

- id: inteiro, PK.
- classId: inteiro, FK para classes, obrigatorio, cascade.
- studentId: inteiro, FK para students, obrigatorio, cascade.
- enrollmentDate: data obrigatorio.
- status: enum obrigatorio (ativo, transferido, concluido).
- deletedAt: data/hora, opcional. Soft delete.
- createdAt: data/hora obrigatorio.
- updatedAt: data/hora obrigatorio.

Indices:

- Unique: classId + studentId
- studentId

Por que foi criada:

- guardar historico de alocacao e situacao da matricula do aluno com suporte a remocao logica.

### 5.16 classSessions

Para que serve:

- registrar cada aula dada

Atributos:

- id: inteiro, PK.
- classSubjectId: inteiro, FK para classSubjects, obrigatorio, cascade.
- teacherId: inteiro, FK opcional para teachers, set null.
- lessonDate: data obrigatorio.
- lessonNumber: inteiro obrigatorio. Numero da aula no dia.
- topic: texto curto, opcional. Tema da aula.
- notes: texto, opcional.
- createdAt: data/hora obrigatorio.

Indices:

- Unique: classSubjectId + lessonDate + lessonNumber
- lessonDate

Por que foi criada:

- base temporal para chamada de presenca e contexto pedagogico.

### 5.17 attendanceRecords

Para que serve:

- presenca/falta por aluno por aula

Atributos:

- id: inteiro, PK.
- classSessionId: inteiro, FK para classSessions, obrigatorio, cascade.
- studentId: inteiro, FK para students, obrigatorio, cascade.
- status: enum obrigatorio (present, absent, justified).
- reason: texto, opcional. Motivo da justificativa/falta.
- recordedByTeacherId: inteiro, FK opcional para teachers, set null.
- deletedAt: data/hora, opcional. Soft delete.
- createdAt: data/hora obrigatorio.
- updatedAt: data/hora obrigatorio.

Indices:

- Unique: classSessionId + studentId
- studentId
- status

Por que foi criada:

- controle fino de frequencia por aula, nao apenas por periodo agregado, com suporte a remocao logica.

### 5.18 assessments

Para que serve:

- definicao de avaliacao/prova/trabalho

Atributos:

- id: inteiro, PK.
- classSubjectId: inteiro, FK para classSubjects, obrigatorio, cascade.
- teacherId: inteiro, FK opcional para teachers, set null.
- title: texto curto, obrigatorio.
- description: texto, opcional.
- maxScore: decimal obrigatorio. Nota maxima (padrao 10.00).
- weight: decimal obrigatorio. Peso (padrao 1.00).
- assessmentDate: data obrigatorio.
- deletedAt: data/hora, opcional. Soft delete.
- createdAt: data/hora obrigatorio.
- updatedAt: data/hora obrigatorio.

Indices:

- classSubjectId
- assessmentDate

Por que foi criada:

- separar definicao da avaliacao dos resultados por aluno, com suporte a remocao logica.

### 5.19 assessmentScores

Para que serve:

- notas dos alunos em cada avaliacao

Atributos:

- id: inteiro, PK.
- assessmentId: inteiro, FK para assessments, obrigatorio, cascade.
- studentId: inteiro, FK para students, obrigatorio, cascade.
- score: decimal obrigatorio.
- feedback: texto, opcional.
- deletedAt: data/hora, opcional. Soft delete.
- createdAt: data/hora obrigatorio.
- updatedAt: data/hora obrigatorio.

Indices:

- Unique: assessmentId + studentId
- studentId

Por que foi criada:

- armazenar resultados individuais e possibilitar medias e historicos, com suporte a remocao logica.

### 5.20 studentComments

Para que serve:

- comentarios pedagogicos e ocorrencias por aluno

Atributos:

- id: inteiro, PK.
- schoolId: inteiro, FK para schools, obrigatorio, cascade.
- studentId: inteiro, FK para students, obrigatorio, cascade.
- teacherId: inteiro, FK opcional para teachers, set null.
- classSubjectId: inteiro, FK opcional para classSubjects, set null.
- category: enum obrigatorio (elogio, melhoria, ocorrencia, comentario).
- visibility: enum obrigatorio (student, guardian, school, all).
- content: texto obrigatorio.
- deletedAt: data/hora, opcional. Soft delete.
- createdAt: data/hora obrigatorio.
- updatedAt: data/hora obrigatorio.

Indices:

- schoolId
- studentId
- category
- createdAt

Por que foi criada:

- registrar observacoes de desenvolvimento e ocorrencias com regra de visibilidade e suporte a remocao logica.

### 5.21 schoolEvents

Para que serve:

- calendario de eventos escolares

Atributos:

- id: inteiro, PK.
- schoolId: inteiro, FK para schools, obrigatorio, cascade.
- title: texto curto, obrigatorio.
- description: texto, opcional.
- eventType: enum obrigatorio (prova, feriado, saida_antecipada, evento_escolar, reuniao).
- startsAt: data/hora obrigatorio.
- endsAt: data/hora opcional.
- createdByUserId: inteiro, FK opcional para users, set null.
- deletedAt: data/hora, opcional. Soft delete.
- createdAt: data/hora obrigatorio.
- updatedAt: data/hora obrigatorio.

Indices:

- schoolId
- startsAt

Por que foi criada:

- centralizar agenda escolar e integrar com comunicacao, com suporte a remocao logica.

### 5.22 eventTargets

Para que serve:

- definir publico alvo de evento

Atributos:

- id: inteiro, PK.
- eventId: inteiro, FK para schoolEvents, obrigatorio, cascade.
- targetType: enum obrigatorio (school, class, student, guardian).
- targetRefId: inteiro obrigatorio. Id alvo conforme tipo.
- createdAt: data/hora obrigatorio.

Indices:

- Unique: eventId + targetType + targetRefId
- targetType + targetRefId

Por que foi criada:

- permitir eventos globais ou segmentados.

### 5.23 communications

Para que serve:

- mensagens oficiais da escola

Atributos:

- id: inteiro, PK.
- schoolId: inteiro, FK para schools, obrigatorio, cascade.
- authorUserId: inteiro, FK opcional para users, set null.
- title: texto curto, obrigatorio.
- body: texto obrigatorio.
- communicationType: enum obrigatorio (announcement, reminder, alert).
- relatedEventId: inteiro, FK opcional para schoolEvents, set null.
- deletedAt: data/hora, opcional. Soft delete.
- createdAt: data/hora obrigatorio.
- updatedAt: data/hora obrigatorio.

Indices:

- schoolId
- communicationType

Por que foi criada:

- padronizar comunicados e apoiar rastreabilidade de origem, com suporte a remocao logica.

### 5.24 communicationRecipients

Para que serve:

- destinatarios de cada comunicado com controle de leitura

Atributos:

- id: inteiro, PK.
- communicationId: inteiro, FK para communications, obrigatorio, cascade.
- recipientType: enum obrigatorio (student, guardian, teacher, staff).
- recipientRefId: inteiro obrigatorio. Id do destinatario no contexto.
- readAt: data/hora opcional. Momento da leitura.
- createdAt: data/hora obrigatorio.

Indices:

- Unique: communicationId + recipientType + recipientRefId
- recipientType + recipientRefId

Por que foi criada:

- permitir distribuicao segmentada e controle de leitura por destinatario.

### 5.25 notifications

Para que serve:

- notificacoes de usuario (alertas no sistema)

Atributos:

- id: inteiro, PK.
- userId: inteiro, FK para users, obrigatorio, cascade.
- notificationType: enum obrigatorio (absence_alert, grade_published, comment_received, communication, event_reminder, justification_pending, justification_result, general).
- title: texto curto, obrigatorio.
- body: texto obrigatorio.
- actionUrl: texto curto longo, opcional. Link de acao.
- isRead: inteiro obrigatorio (0 ou 1).
- readAt: data/hora opcional.
- deletedAt: data/hora, opcional. Soft delete.
- createdAt: data/hora obrigatorio.

Indices:

- userId
- userId + isRead
- createdAt

Por que foi criada:

- desacoplar notificacao de comunicados e oferecer experiencia pessoal por usuario com tipos especificos para cada contexto (falta, nota, comentario, justificativa, evento) e suporte a remocao logica.

### 5.26 attachments

Para que serve:

- metadados de anexos por URL

Atributos:

- id: inteiro, PK.
- ownerType: enum obrigatorio (event, communication, comment).
- ownerId: inteiro obrigatorio. Id da entidade dona do anexo.
- fileUrl: texto curto longo, obrigatorio. URL do arquivo.
- fileName: texto curto, obrigatorio.
- mimeType: texto curto, opcional.
- sizeBytes: inteiro, opcional.
- createdAt: data/hora obrigatorio.

Indices:

- ownerType + ownerId

Por que foi criada:

- manter anexos sem salvar binario dentro do banco, reduzindo custo e complexidade.

### 5.27 absenceJustifications

Para que serve:

- justificativa de faltas com trilha de aprovacao pela gestao escolar

Atributos:

- id: inteiro, PK.
- attendanceRecordId: inteiro, FK para attendanceRecords, obrigatorio, cascade.
- guardianId: inteiro, FK para guardians, obrigatorio, cascade.
- reason: texto obrigatorio. Motivo da justificativa.
- attachmentUrl: texto curto longo, opcional. URL de comprovante anexo.
- status: enum obrigatorio (pending, approved, rejected). Estado da justificativa.
- reviewedByUserId: inteiro, FK opcional para users, set null.
- reviewedAt: data/hora, opcional.
- reviewNotes: texto, opcional.
- createdAt: data/hora obrigatorio.
- updatedAt: data/hora obrigatorio.

Indices:

- attendanceRecordId
- guardianId
- status

Por que foi criada:

- permitir que responsaveis justifiquem faltas de alunos e que a gestao escolar as aprove ou rejeite, com rastreabilidade do revisor e notas de revisao.

### 5.28 schoolPlatforms

Para que serve:

- plataformas e servicos externos vinculados a escola

Atributos:

- id: inteiro, PK.
- schoolId: inteiro, FK para schools, obrigatorio, cascade.
- name: texto curto, obrigatorio. Nome da plataforma.
- description: texto, opcional.
- url: texto curto longo, obrigatorio. Link de acesso.
- emoji: texto curto, opcional. Icone visual.
- colorGradient: texto curto, opcional. Estilo de cor do card.
- sortOrder: inteiro obrigatorio. Ordem de exibicao.
- createdAt: data/hora obrigatorio.
- updatedAt: data/hora obrigatorio.

Indices:

- schoolId

Por que foi criada:

- permitir que cada escola configure as plataformas externas que seus alunos e responsaveis usam (Google Classroom, SISEDU, etc.), substituindo listas estaticas no frontend.

### 5.29 scheduleSlots

Para que serve:

- grade horaria configuravel por escola e turno

Atributos:

- id: inteiro, PK.
- schoolId: inteiro, FK para schools, obrigatorio, cascade.
- shift: texto curto, obrigatorio. Turno (morning/afternoon/evening).
- slotNumber: inteiro obrigatorio. Numero da aula no turno.
- startTime: texto curto, obrigatorio. Horario de inicio (HH:MM).
- endTime: texto curto, obrigatorio. Horario de fim (HH:MM).
- createdAt: data/hora obrigatorio.

Indices:

- Unique: schoolId + shift + slotNumber
- schoolId

Por que foi criada:

- permitir que cada escola defina os horarios de aula por turno, substituindo listas estaticas no frontend e suportando a tela de horario do aluno.

### 5.30 auditLogs

Para que serve:

- registro de acoes relevantes para rastreabilidade e conformidade

Atributos:

- id: inteiro, PK.
- userId: inteiro, FK opcional para users, set null.
- action: texto curto, obrigatorio. Tipo de acao (create, update, delete, restore, access).
- entity: texto curto, obrigatorio. Nome da tabela/entidade.
- entityId: inteiro, opcional. Id da entidade afetada.
- changes: texto, opcional. JSON das alteracoes.
- schoolId: inteiro, FK opcional para schools, set null.
- ipAddress: texto curto, opcional. IP do usuario.
- createdAt: data/hora obrigatorio.

Indices:

- userId
- entity + entityId
- schoolId
- createdAt

Por que foi criada:

- registrar quem fez o que, quando e em qual entidade, atendendo requisitos de auditoria, LGPD e rastreabilidade de acoes administrativas.

## 6) Relacoes criticas de integridade

Relacoes de maior impacto:

- users -> userSchools, teachers, students, guardians, schoolStaffProfiles, notifications, schoolEvents, communications, auditLogs
- schools -> quase todo dominio institucional e academico
- schoolYears -> classes
- classes + subjects -> classSubjects
- classSubjects + teachers -> classTeachers
- classSessions -> attendanceRecords
- assessments -> assessmentScores
- students <-> guardians via studentGuardians
- attendanceRecords -> absenceJustifications
- guardians -> absenceJustifications
- schools -> schoolPlatforms, scheduleSlots

Protecoes contra duplicidade:

- userSchools (userId + schoolId)
- schoolStaffProfiles (userId + schoolId + role)
- studentGuardians (studentId + guardianId)
- classes (schoolYearId + name)
- classSubjects (classId + subjectId)
- classTeachers (classSubjectId + teacherId)
- classEnrollments (classId + studentId)
- attendanceRecords (classSessionId + studentId)
- assessmentScores (assessmentId + studentId)
- eventTargets (eventId + targetType + targetRefId)
- communicationRecipients (communicationId + recipientType + recipientRefId)
- scheduleSlots (schoolId + shift + slotNumber)
- subjects (schoolId + name e schoolId + code)

## 7) Como os requisitos foram cobertos

Requisitos funcionais atendidos:

- quatro perfis: aluno, professor, gestao e responsavel
- faltas por aula/disciplina
- notas por avaliacao na escala decimal (com maximo padrao 10)
- comentarios com controle de visibilidade
- eventos e comunicacao segmentada
- notificacoes por usuario com tipos especificos (absence_alert, grade_published, comment_received, communication, event_reminder, justification_pending, justification_result, general)
- anexos por URL (sem binario no banco)
- justificativa de faltas com trilha de aprovacao (responsavel submete, gestao revisa)
- plataformas externas por escola (substitui lista estatica)
- grade horaria configuravel por escola e turno (substitui lista estatica)
- auditoria de acoes criticas (create, update, delete, restore, access)
- controle de leitura de comunicados (readAt em communicationRecipients)
- soft delete em entidades criticas (teachers, students, guardians, classes, classEnrollments, attendanceRecords, assessments, assessmentScores, studentComments, schoolEvents, communications, notifications)
- LGPD: exportacao de dados do aluno via school.exportStudentData
- multi-tenant: todas as consultas filtram por schoolId e validam vinculo

Evidencias de implementacao:

- modelagem de tabelas: drizzle/schema.ts (30 tabelas)
- relacoes tipadas: drizzle/relations.ts
- baseline resetado: drizzle/0000_silky_hellfire_club.sql e drizzle/meta
- camada de dados real: apps/server/src/db.ts
- rotas de perfil sem mocks: apps/server/src/profiles.ts
- routers de dominio: apps/server/src/domain/ (attendance, comments, communications, events, grades, justifications, school, audit)
- registro generico CRUD: apps/server/src/registry.ts
- seed com dados fake integrado: apps/server/src/scripts/fakeData.ts
- onboarding integrando perfis: apps/server/src/routers.ts
- testes estruturais e de regra: apps/server/test

## 8) Analise pratica: problemas possiveis e como contornar

### 8.1 Risco de acesso indevido entre escolas

Problema:

- consultas sem filtro por vinculo podem vazar dados entre escolas.

Contorno:

- reforcar sempre filtro por schoolId e validacao de vinculo do usuario.
- manter testes de isolamento multi-tenant ativos.

### 8.2 Risco de carga alta em dashboards

Problema:

- crescimento de tabelas de diario (attendanceRecords, assessmentScores) pode degradar resposta.

Contorno:

- indices ja criados para joins principais.
- adicionar cache por leitura de dashboard.
- paginacao e janela temporal por periodo letivo.

### 8.3 Risco de inconsistencia em anexos polimorficos

Problema:

- attachments usa ownerType + ownerId sem FK direta para cada tabela alvo.

Contorno:

- validar no backend se owner existe antes de inserir anexo.
- opcional futuro: dividir em tabelas de anexo por contexto quando exigir rastreio mais rigido.

### 8.4 Risco de dados sensiveis

Problema:

- comentarios e dados pessoais exigem cuidado de privacidade.

Contorno:

- mascarar autor para aluno (ja implementado).
- trilha de auditoria por autor e data (auditLogs).
- politicas de acesso por perfil e escola.
- exportacao LGPD via school.exportStudentData.

### 8.5 Risco operacional de ambiente

Problema:

- falhas de conexao/autenticacao impedem validar migrate em ambiente local.

Contorno:

- padronizar DATABASE_URL por ambiente.
- validar conexao no pipeline antes de migrate.
- executar testes MySQL com flag dedicada em ambiente preparado.

### 8.6 Risco de justificativas orfas

Problema:

- se um attendanceRecord for removido em cascade, a absenceJustification associada tambem e removida, perdendo historico.

Contorno:

- considerar set null em vez de cascade na FK attendanceRecordId quando a justificativa ja estiver approved.
- ou arquivar justificativas aprovadas antes de permitir remocao do registro de presenca.

### 8.7 Risco de scheduleSlots sem classSessions vinculados

Problema:

- scheduleSlots define horarios mas nao tem FK direta para classSessions.

Contorno:

- garantir no backend que o slot usado na aula corresponde ao horario configurado da escola.
- validar consistencia ao registrar classSessions.

## 9) Adaptabilidade e flexibilidade (evolucao recomendada)

Melhorias de curto e medio prazo:

- trocar campos inteiros booleanos (isCurrent, isPrimary, isRead, active) por tipo boolean quando adequado ao dialeto e padrao do projeto.
- introduzir auditoria padrao (createdBy, updatedBy) em tabelas de alto impacto pedagogico.
- criar soft delete em entidades administrativas restantes (schools, subjects, contacts, userSchools) quando for necessario historico sem remocao fisica.
- versionar rubricas de avaliacao para historico de criterio pedagogico.
- adicionar particionamento por ano letivo em tabelas muito volumosas, se volume crescer fortemente.
- consolidar convenios de naming de enums para facilitar analytics e BI.
- adicionar FK de scheduleSlots em classSessions para garantir consistencia de horario.
- ampliar tipos de notificationType conforme surjam novas integracoes (ex.: message_received, assignment_due).
- criar tabela de turma-horario (classSchedule) ligando classSubject a scheduleSlot para grade semanal por turma.

## 10) Estado de completude do plano

Status por fase:

- Fase 0: concluida
- Fase 1: concluida
- Fase 2: concluida
- Fase 3: concluida
- Fase 4: concluida
- Fase 5: concluida
- Fase 6: concluida
- Fase 7: concluida (migracao executada em banco remoto)
- Fase 8: concluida (tabelas absenceJustifications, schoolPlatforms, scheduleSlots, auditLogs e aprimoramentos em notifications e soft deletes)
- Fase 9: em andamento (orientacao para ampliar dados e endpoints no servidor)

Resumo final:

- A estrutura do banco foi de fato reconstruida do zero conforme o plano.
- O desenho esta coerente para operacao escolar real e preparado para evolucao.
- 30 tabelas implementadas cobrindo identidade, institucional, academico, diario, justificativa, comunicacao, plataformas, horarios e auditoria.
- O frontend ja consome dados dinamicamente via tRPC em todas as telas de dashboard.
- Proximo passo: ampliar seed e procedures tRPC para enriquecer os dados disponiveis nas telas (ver ORIENTACAO_SERVER_ATUALIZACAO.md).
