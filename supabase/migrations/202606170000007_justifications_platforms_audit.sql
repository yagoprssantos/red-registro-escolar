-- ============================================================
-- RED — Registro Escolar Digital
-- Arquivo 07: Justificativas, Plataformas, Grade Horária e Auditoria
-- absenceJustifications · schoolPlatforms · scheduleSlots · auditLogs
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 5.27 absenceJustifications
-- ────────────────────────────────────────────────────────────

CREATE TABLE "absenceJustifications" (
  id                     SERIAL PRIMARY KEY,
  "attendanceRecordId"   INTEGER                NOT NULL REFERENCES "attendanceRecords" (id) ON DELETE CASCADE,
  "guardianId"           INTEGER                NOT NULL REFERENCES guardians           (id) ON DELETE CASCADE,
  reason                 TEXT                   NOT NULL,
  "attachmentUrl"        VARCHAR(1000),
  status                 justification_status   NOT NULL DEFAULT 'pending',
  "reviewedByUserId"     INTEGER                         REFERENCES users               (id) ON DELETE SET NULL,
  "reviewedAt"           TIMESTAMPTZ,
  "reviewNotes"          TEXT,
  "createdAt"            TIMESTAMPTZ            NOT NULL DEFAULT NOW(),
  "updatedAt"            TIMESTAMPTZ            NOT NULL DEFAULT NOW()
);

CREATE INDEX absence_justifications_attendance_idx ON "absenceJustifications" ("attendanceRecordId");
CREATE INDEX absence_justifications_guardian_idx   ON "absenceJustifications" ("guardianId");
CREATE INDEX absence_justifications_status_idx     ON "absenceJustifications" (status);

COMMENT ON TABLE  "absenceJustifications" IS 'Justificativas de faltas com trilha de aprovação da gestão.';
COMMENT ON COLUMN "absenceJustifications"."attachmentUrl" IS 'URL de comprovante opcional (atestado, declaração, etc.).';
COMMENT ON COLUMN "absenceJustifications".status IS 'pending = aguardando análise, approved = aprovada, rejected = recusada.';
COMMENT ON COLUMN "absenceJustifications"."reviewedByUserId" IS 'Usuário da gestão que revisou a justificativa.';
COMMENT ON COLUMN "absenceJustifications"."reviewNotes" IS 'Observações da gestão ao aprovar ou rejeitar.';

-- ────────────────────────────────────────────────────────────
-- 5.28 schoolPlatforms
-- ────────────────────────────────────────────────────────────

CREATE TABLE "schoolPlatforms" (
  id              SERIAL PRIMARY KEY,
  "schoolId"      INTEGER       NOT NULL REFERENCES schools (id) ON DELETE CASCADE,
  name            VARCHAR(255)  NOT NULL,
  description     TEXT,
  url             VARCHAR(1000) NOT NULL,
  emoji           VARCHAR(10),
  "colorGradient" VARCHAR(255),
  "sortOrder"     SMALLINT      NOT NULL DEFAULT 0,
  "createdAt"     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX school_platforms_school_id_idx ON "schoolPlatforms" ("schoolId");

COMMENT ON TABLE  "schoolPlatforms" IS 'Plataformas e serviços externos vinculados à escola.';
COMMENT ON COLUMN "schoolPlatforms".emoji IS 'Ícone visual para exibição no card.';
COMMENT ON COLUMN "schoolPlatforms"."colorGradient" IS 'Classe Tailwind de gradiente, ex.: from-blue-500 to-blue-700.';
COMMENT ON COLUMN "schoolPlatforms"."sortOrder" IS 'Ordem de exibição crescente.';

-- ────────────────────────────────────────────────────────────
-- 5.29 scheduleSlots
-- ────────────────────────────────────────────────────────────

CREATE TABLE "scheduleSlots" (
  id           SERIAL PRIMARY KEY,
  "schoolId"  INTEGER      NOT NULL REFERENCES schools (id) ON DELETE CASCADE,
  shift        VARCHAR(20)  NOT NULL,
  "slotNumber" SMALLINT     NOT NULL,
  "startTime"  VARCHAR(5)   NOT NULL,
  "endTime"    VARCHAR(5)   NOT NULL,
  "createdAt"  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT schedule_slots_uq UNIQUE ("schoolId", shift, "slotNumber")
);

CREATE INDEX schedule_slots_school_id_idx ON "scheduleSlots" ("schoolId");

COMMENT ON TABLE  "scheduleSlots" IS 'Grade horária configurável por escola e turno.';
COMMENT ON COLUMN "scheduleSlots".shift IS 'Turno: morning, afternoon ou evening.';
COMMENT ON COLUMN "scheduleSlots"."slotNumber" IS 'Número da aula no turno, ex.: 1, 2, 3.';
COMMENT ON COLUMN "scheduleSlots"."startTime" IS 'Horário de início no formato HH:MM.';
COMMENT ON COLUMN "scheduleSlots"."endTime" IS 'Horário de fim no formato HH:MM.';

-- ────────────────────────────────────────────────────────────
-- 5.30 auditLogs
-- ────────────────────────────────────────────────────────────

CREATE TABLE "auditLogs" (
  id           SERIAL PRIMARY KEY,
  "userId"     INTEGER      REFERENCES users   (id) ON DELETE SET NULL,
  action       VARCHAR(50)  NOT NULL,
  entity       VARCHAR(100) NOT NULL,
  "entityId"   INTEGER,
  changes      TEXT,
  "schoolId"   INTEGER      REFERENCES schools (id) ON DELETE SET NULL,
  "ipAddress"  VARCHAR(45),
  "createdAt"  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX audit_logs_user_id_idx      ON "auditLogs" ("userId");
CREATE INDEX audit_logs_entity_idx       ON "auditLogs" (entity, "entityId");
CREATE INDEX audit_logs_school_id_idx    ON "auditLogs" ("schoolId");
CREATE INDEX audit_logs_created_at_idx   ON "auditLogs" ("createdAt");

COMMENT ON TABLE  "auditLogs" IS 'Rastreabilidade de ações relevantes (LGPD e conformidade).';
COMMENT ON COLUMN "auditLogs".action IS 'Tipo de ação: create, update, delete, restore, access.';
COMMENT ON COLUMN "auditLogs".entity IS 'Nome da tabela/entidade afetada.';
COMMENT ON COLUMN "auditLogs"."entityId" IS 'Id do registro afetado.';
COMMENT ON COLUMN "auditLogs".changes IS 'JSON com os campos antes/depois da alteração.';
COMMENT ON COLUMN "auditLogs"."ipAddress" IS 'IP do usuário no momento da ação.';
