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

## 3) Mapa geral por dominio

Dominios principais:

- Identidade e acesso: users
- Institucional: schools, schoolYears, userSchools, schoolStaffProfiles
- Perfis escolares: teachers, students, guardians, studentGuardians
- Academico: subjects, classes, classSubjects, classTeachers, classEnrollments
- Diario escolar: classSessions, attendanceRecords, assessments, assessmentScores
- Pedagogico e comunicacao: studentComments, schoolEvents, eventTargets, communications, communicationRecipients, notifications, attachments
- Comercial/contato: contacts

## 4) Glossario rapido para leigos

Termos essenciais:

- PK (Primary Key): identificador unico da linha
- FK (Foreign Key): campo que aponta para outra tabela
- Index: atalho para busca rapida
- Unique: regra para impedir duplicidade
- Cascade: se apagar o pai, apaga os filhos relacionados
- Set null: se apagar o pai, o campo relacionado vira vazio

## 5) Dicionario completo: tabela por tabela

### 5.1 users

Para que serve:

- cadastro base de identidade dos usuarios da plataforma

Atributos:

- id: inteiro, PK, auto incremento. Identificador interno do usuario.
- openId: texto curto, unico, obrigatorio. Identidade externa de autenticacao.
- name: texto, opcional. Nome exibivel.
- email: texto curto, opcional. Contato e login auxiliar.
- loginMethod: texto curto, opcional. Metodo de autenticacao usado.
- role: enum obrigatorio. Papel global do usuario na plataforma.
- defaultProfile: enum opcional. Perfil padrao para abertura da experiencia.
- createdAt: data/hora obrigatorio. Momento de criacao.
- updatedAt: data/hora obrigatorio. Momento da ultima atualizacao.
- lastSignedIn: data/hora obrigatorio. Ultimo acesso.

Por que foi criada:

- centralizar identidade para todos os perfis e evitar duplicar usuario em cada contexto.

### 5.2 schools

Para que serve:

- cadastro da instituicao escolar

Atributos:

- id: inteiro, PK.
- name: texto, obrigatorio. Nome da escola.
- email: texto curto, obrigatorio, unico. Email institucional unico.
- phone: texto curto, opcional. Telefone.
- address: texto, opcional. Endereco completo.
- city: texto curto, opcional. Cidade.
- state: texto curto, opcional. Estado/UF.
- zipCode: texto curto, opcional. CEP.
- studentCount: inteiro, opcional. Total estimado de alunos.
- status: enum obrigatorio. Estado da escola (ativo/inativo/trial).
- createdAt: data/hora obrigatorio.
- updatedAt: data/hora obrigatorio.

Por que foi criada:

- separar o contexto institucional e permitir multi escola.

### 5.3 schoolYears

Para que serve:

- representar ano letivo por escola

Atributos:

- id: inteiro, PK.
- schoolId: inteiro, FK para schools, obrigatorio.
- name: texto curto, obrigatorio. Exemplo: 2026.
- startDate: data obrigatorio.
- endDate: data obrigatorio.
- isCurrent: inteiro obrigatorio (0 ou 1). Marca ano atual.
- createdAt: data/hora obrigatorio.
- updatedAt: data/hora obrigatorio.

Por que foi criada:

- dar contexto temporal para turmas, matriculas e historico.

### 5.4 userSchools

Para que serve:

- vincular usuario a escola com papel operacional

Atributos:

- id: inteiro, PK.
- userId: inteiro, FK para users, obrigatorio.
- schoolId: inteiro, FK para schools, obrigatorio.
- role: enum obrigatorio. Papel do usuario naquela escola.
- createdAt: data/hora obrigatorio.

Por que foi criada:

- um usuario pode atuar em escolas diferentes com papeis diferentes.

### 5.5 schoolStaffProfiles

Para que serve:

- detalhar perfil de equipe escolar (gestao/secretaria)

Atributos:

- id: inteiro, PK.
- userId: inteiro, FK para users, obrigatorio.
- schoolId: inteiro, FK para schools, obrigatorio.
- role: enum obrigatorio (admin/director/coordinator/secretary).
- positionTitle: texto curto, opcional. Cargo legivel.
- createdAt: data/hora obrigatorio.
- updatedAt: data/hora obrigatorio.

Por que foi criada:

- separar equipe administrativa dos demais papeis e dar flexibilidade de gestao.

### 5.6 teachers

Para que serve:

- perfil de professor na escola

Atributos:

- id: inteiro, PK.
- userId: inteiro, FK para users, obrigatorio.
- schoolId: inteiro, FK para schools, obrigatorio.
- name: texto curto, obrigatorio.
- email: texto curto, obrigatorio.
- phone: texto curto, opcional.
- subject: texto curto, opcional. Area principal.
- active: inteiro obrigatorio (0 ou 1). Ativo/inativo.
- createdAt: data/hora obrigatorio.
- updatedAt: data/hora obrigatorio.

Por que foi criada:

- manter dados profissionais e ligacoes academicas de docencia.

### 5.7 students

Para que serve:

- perfil academico do aluno

Atributos:

- id: inteiro, PK.
- userId: inteiro, FK opcional para users. Permite aluno sem login.
- schoolId: inteiro, FK para schools, obrigatorio.
- enrollmentNumber: texto curto, opcional. Matricula interna.
- name: texto curto, obrigatorio.
- email: texto curto, opcional.
- phone: texto curto, opcional.
- dateOfBirth: data, opcional.
- grade: texto curto, opcional. Serie/ano.
- status: enum obrigatorio. Situacao academica.
- createdAt: data/hora obrigatorio.
- updatedAt: data/hora obrigatorio.

Por que foi criada:

- concentrar identidade academica, status e vinculos escolares do aluno.

### 5.8 guardians

Para que serve:

- perfil de responsavel legal

Atributos:

- id: inteiro, PK.
- userId: inteiro, FK opcional para users.
- schoolId: inteiro, FK para schools, obrigatorio.
- name: texto curto, obrigatorio.
- email: texto curto, obrigatorio.
- phone: texto curto, opcional.
- relationship: texto curto, opcional. Exemplo: mae/pai/tutor.
- createdAt: data/hora obrigatorio.
- updatedAt: data/hora obrigatorio.

Por que foi criada:

- suportar comunicacao e acompanhamento de alunos por familia.

### 5.9 studentGuardians

Para que serve:

- relacao N para N entre alunos e responsaveis

Atributos:

- id: inteiro, PK.
- studentId: inteiro, FK para students, obrigatorio.
- guardianId: inteiro, FK para guardians, obrigatorio.
- relationship: texto curto, opcional.
- isPrimary: inteiro obrigatorio (0 ou 1). Responsavel principal.
- createdAt: data/hora obrigatorio.

Por que foi criada:

- um aluno pode ter varios responsaveis e um responsavel pode acompanhar varios alunos.

### 5.10 contacts

Para que serve:

- registro de contatos recebidos (ex.: formularios)

Atributos:

- id: inteiro, PK.
- schoolId: inteiro, FK opcional para schools.
- name: texto curto, obrigatorio.
- email: texto curto, obrigatorio.
- school: texto curto, obrigatorio. Nome informado no contato.
- role: texto curto, obrigatorio. Papel de quem contatou.
- students: texto curto, opcional. Faixa de alunos.
- message: texto, opcional.
- status: enum obrigatorio. Estado de tratamento.
- createdAt: data/hora obrigatorio.
- updatedAt: data/hora obrigatorio.

Por que foi criada:

- manter trilha comercial e operacional de contatos externos.

### 5.11 subjects

Para que serve:

- catalogo de disciplinas por escola

Atributos:

- id: inteiro, PK.
- schoolId: inteiro, FK para schools, obrigatorio.
- name: texto curto, obrigatorio.
- code: texto curto, opcional. Codigo da disciplina.
- description: texto, opcional.
- createdAt: data/hora obrigatorio.
- updatedAt: data/hora obrigatorio.

Por que foi criada:

- normalizar disciplinas e evitar repeticoes em turmas e avaliacoes.

### 5.12 classes

Para que serve:

- cadastro de turmas

Atributos:

- id: inteiro, PK.
- schoolId: inteiro, FK para schools, obrigatorio.
- schoolYearId: inteiro, FK para schoolYears, obrigatorio.
- name: texto curto, obrigatorio. Exemplo: 6A.
- gradeLabel: texto curto, obrigatorio. Exemplo: 6o Ano A.
- shift: enum obrigatorio. Turno.
- status: enum obrigatorio. Situacao da turma.
- createdAt: data/hora obrigatorio.
- updatedAt: data/hora obrigatorio.

Por que foi criada:

- dar unidade academica para alocar alunos e disciplinas.

### 5.13 classSubjects

Para que serve:

- ligar turma com disciplina

Atributos:

- id: inteiro, PK.
- classId: inteiro, FK para classes, obrigatorio.
- subjectId: inteiro, FK para subjects, obrigatorio.
- createdAt: data/hora obrigatorio.

Por que foi criada:

- uma turma tem varias disciplinas e uma disciplina pode estar em varias turmas.

### 5.14 classTeachers

Para que serve:

- ligar professor ao par turma-disciplina

Atributos:

- id: inteiro, PK.
- classSubjectId: inteiro, FK para classSubjects, obrigatorio.
- teacherId: inteiro, FK para teachers, obrigatorio.
- createdAt: data/hora obrigatorio.

Por que foi criada:

- registrar docencia real e permitir multiplos professores por contexto quando necessario.

### 5.15 classEnrollments

Para que serve:

- matricula de aluno na turma

Atributos:

- id: inteiro, PK.
- classId: inteiro, FK para classes, obrigatorio.
- studentId: inteiro, FK para students, obrigatorio.
- enrollmentDate: data obrigatorio.
- status: enum obrigatorio. Ativo/transferido/concluido.
- createdAt: data/hora obrigatorio.
- updatedAt: data/hora obrigatorio.

Por que foi criada:

- guardar historico de alocacao e situacao da matricula do aluno.

### 5.16 classSessions

Para que serve:

- registrar cada aula dada

Atributos:

- id: inteiro, PK.
- classSubjectId: inteiro, FK para classSubjects, obrigatorio.
- teacherId: inteiro, FK opcional para teachers.
- lessonDate: data obrigatorio.
- lessonNumber: inteiro obrigatorio. Numero da aula no dia.
- topic: texto curto, opcional. Tema da aula.
- notes: texto, opcional.
- createdAt: data/hora obrigatorio.

Por que foi criada:

- base temporal para chamada de presenca e contexto pedagogico.

### 5.17 attendanceRecords

Para que serve:

- presenca/falta por aluno por aula

Atributos:

- id: inteiro, PK.
- classSessionId: inteiro, FK para classSessions, obrigatorio.
- studentId: inteiro, FK para students, obrigatorio.
- status: enum obrigatorio. Presente/falta/justificada.
- reason: texto, opcional. Motivo da justificativa/falta.
- recordedByTeacherId: inteiro, FK opcional para teachers.
- createdAt: data/hora obrigatorio.
- updatedAt: data/hora obrigatorio.

Por que foi criada:

- controle fino de frequencia por aula, nao apenas por periodo agregado.

### 5.18 assessments

Para que serve:

- definicao de avaliacao/prova/trabalho

Atributos:

- id: inteiro, PK.
- classSubjectId: inteiro, FK para classSubjects, obrigatorio.
- teacherId: inteiro, FK opcional para teachers.
- title: texto curto, obrigatorio.
- description: texto, opcional.
- maxScore: decimal obrigatorio. Nota maxima (padrao 10.00).
- weight: decimal obrigatorio. Peso (padrao 1.00).
- assessmentDate: data obrigatorio.
- createdAt: data/hora obrigatorio.
- updatedAt: data/hora obrigatorio.

Por que foi criada:

- separar definicao da avaliacao dos resultados por aluno.

### 5.19 assessmentScores

Para que serve:

- notas dos alunos em cada avaliacao

Atributos:

- id: inteiro, PK.
- assessmentId: inteiro, FK para assessments, obrigatorio.
- studentId: inteiro, FK para students, obrigatorio.
- score: decimal obrigatorio.
- feedback: texto, opcional.
- createdAt: data/hora obrigatorio.
- updatedAt: data/hora obrigatorio.

Por que foi criada:

- armazenar resultados individuais e possibilitar medias e historicos.

### 5.20 studentComments

Para que serve:

- comentarios pedagogicos e ocorrencias por aluno

Atributos:

- id: inteiro, PK.
- schoolId: inteiro, FK para schools, obrigatorio.
- studentId: inteiro, FK para students, obrigatorio.
- teacherId: inteiro, FK opcional para teachers.
- classSubjectId: inteiro, FK opcional para classSubjects.
- category: enum obrigatorio. elogio/melhoria/ocorrencia/comentario.
- visibility: enum obrigatorio. student/guardian/school/all.
- content: texto obrigatorio.
- createdAt: data/hora obrigatorio.
- updatedAt: data/hora obrigatorio.

Por que foi criada:

- registrar observacoes de desenvolvimento e ocorrencias com regra de visibilidade.

### 5.21 schoolEvents

Para que serve:

- calendario de eventos escolares

Atributos:

- id: inteiro, PK.
- schoolId: inteiro, FK para schools, obrigatorio.
- title: texto curto, obrigatorio.
- description: texto, opcional.
- eventType: enum obrigatorio. Tipo do evento.
- startsAt: data/hora obrigatorio.
- endsAt: data/hora opcional.
- createdByUserId: inteiro, FK opcional para users.
- createdAt: data/hora obrigatorio.
- updatedAt: data/hora obrigatorio.

Por que foi criada:

- centralizar agenda escolar e integrar com comunicacao.

### 5.22 eventTargets

Para que serve:

- definir publico alvo de evento

Atributos:

- id: inteiro, PK.
- eventId: inteiro, FK para schoolEvents, obrigatorio.
- targetType: enum obrigatorio. school/class/student/guardian.
- targetRefId: inteiro obrigatorio. Id alvo conforme tipo.
- createdAt: data/hora obrigatorio.

Por que foi criada:

- permitir eventos globais ou segmentados.

### 5.23 communications

Para que serve:

- mensagens oficiais da escola

Atributos:

- id: inteiro, PK.
- schoolId: inteiro, FK para schools, obrigatorio.
- authorUserId: inteiro, FK opcional para users.
- title: texto curto, obrigatorio.
- body: texto obrigatorio.
- communicationType: enum obrigatorio. announcement/reminder/alert.
- relatedEventId: inteiro, FK opcional para schoolEvents.
- createdAt: data/hora obrigatorio.
- updatedAt: data/hora obrigatorio.

Por que foi criada:

- padronizar comunicados e apoiar rastreabilidade de origem.

### 5.24 communicationRecipients

Para que serve:

- destinatarios de cada comunicado

Atributos:

- id: inteiro, PK.
- communicationId: inteiro, FK para communications, obrigatorio.
- recipientType: enum obrigatorio. student/guardian/teacher/staff.
- recipientRefId: inteiro obrigatorio. Id do destinatario no contexto.
- readAt: data/hora opcional. Momento da leitura.
- createdAt: data/hora obrigatorio.

Por que foi criada:

- permitir distribuicao segmentada e futuro controle de leitura.

### 5.25 notifications

Para que serve:

- notificacoes de usuario (alertas no sistema)

Atributos:

- id: inteiro, PK.
- userId: inteiro, FK para users, obrigatorio.
- notificationType: enum obrigatorio.
- title: texto curto, obrigatorio.
- body: texto obrigatorio.
- actionUrl: texto curto longo, opcional. Link de acao.
- isRead: inteiro obrigatorio (0 ou 1).
- readAt: data/hora opcional.
- createdAt: data/hora obrigatorio.

Por que foi criada:

- desacoplar notificacao de comunicados e oferecer experiencia pessoal por usuario.

### 5.26 attachments

Para que serve:

- metadados de anexos por URL

Atributos:

- id: inteiro, PK.
- ownerType: enum obrigatorio. event/communication/comment.
- ownerId: inteiro obrigatorio. Id da entidade dona do anexo.
- fileUrl: texto curto longo, obrigatorio. URL do arquivo.
- fileName: texto curto, obrigatorio.
- mimeType: texto curto, opcional.
- sizeBytes: inteiro, opcional.
- createdAt: data/hora obrigatorio.

Por que foi criada:

- manter anexos sem salvar binario dentro do banco, reduzindo custo e complexidade.

## 6) Relacoes criticas de integridade

Relacoes de maior impacto:

- users -> userSchools, teachers, students, guardians, schoolStaffProfiles, notifications
- schools -> quase todo dominio institucional e academico
- schoolYears -> classes
- classes + subjects -> classSubjects
- classSubjects + teachers -> classTeachers
- classSessions -> attendanceRecords
- assessments -> assessmentScores
- students <-> guardians via studentGuardians

Protecoes contra duplicidade:

- userSchools (userId + schoolId)
- studentGuardians (studentId + guardianId)
- classes (schoolYearId + name)
- classSubjects (classId + subjectId)
- classTeachers (classSubjectId + teacherId)
- classEnrollments (classId + studentId)
- attendanceRecords (classSessionId + studentId)
- assessmentScores (assessmentId + studentId)

## 7) Como os requisitos foram cobertos

Requisitos funcionais atendidos:

- quatro perfis: aluno, professor, gestao e responsavel
- faltas por aula/disciplina
- notas por avaliacao na escala decimal (com maximo padrao 10)
- comentarios com controle de visibilidade
- eventos e comunicacao segmentada
- notificacoes por usuario
- anexos por URL (sem binario no banco)

Evidencias de implementacao:

- modelagem de tabelas: drizzle/schema.ts
- relacoes tipadas: drizzle/relations.ts
- baseline resetado: drizzle/0000_broken_hairball.sql e drizzle/meta
- camada de dados real: apps/server/src/db.ts
- rotas de perfil sem mocks: apps/server/src/profiles.ts
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
- trilha de auditoria por autor e data.
- politicas de acesso por perfil e escola.

### 8.5 Risco operacional de ambiente

Problema:

- falhas de conexao/autenticacao impedem validar migrate em ambiente local.

Contorno:

- padronizar DATABASE_URL por ambiente.
- validar conexao no pipeline antes de migrate.
- executar testes MySQL com flag dedicada em ambiente preparado.

## 9) Adaptabilidade e flexibilidade (evolucao recomendada)

Melhorias de curto e medio prazo:

- trocar campos inteiros booleanos (isCurrent, isPrimary, isRead, active) por tipo boolean quando adequado ao dialeto e padrao do projeto.
- introduzir auditoria padrao (createdBy, updatedBy) em tabelas de alto impacto pedagogico.
- criar soft delete em entidades administrativas, quando for necessario historico sem remocao fisica.
- versionar rubricas de avaliacao para historico de criterio pedagogico.
- adicionar particionamento por ano letivo em tabelas muito volumosas, se volume crescer fortemente.
- consolidar convenios de naming de enums para facilitar analytics e BI.

## 10) Estado de completude do plano

Status por fase:

- Fase 0: concluida
- Fase 1: concluida
- Fase 2: concluida
- Fase 3: concluida
- Fase 4: concluida
- Fase 5: concluida
- Fase 6: concluida
- Fase 7: tecnicamente pronta no codigo, pendente apenas de validacao em banco remoto com credencial valida

Resumo final:

- A estrutura do banco foi de fato reconstruida do zero conforme o plano.
- O desenho esta coerente para operacao escolar real e preparado para evolucao.
- O unico ponto pendente para fechamento operacional total e executar a validacao final de migracao em um MySQL acessivel (nuvem, conforme proxima etapa).
