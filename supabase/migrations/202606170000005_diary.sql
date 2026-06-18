-- ============================================================
-- RED — Registro Escolar Digital
-- Arquivo 05: Diário Escolar
-- classSessions · attendanceRecords · assessments · assessmentScores
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 5.16 classSessions
-- ────────────────────────────────────────────────────────────

CREATE TABLE "classSessions" (
  id                SERIAL PRIMARY KEY,
  "classSubjectId"  INTEGER      NOT NULL REFERENCES "classSubjects" (id) ON DELETE CASCADE,
  "teacherId"       INTEGER              REFERENCES teachers         (id) ON DELETE SET NULL,
  "lessonDate"      DATE         NOT NULL,
  "lessonNumber"    SMALLINT     NOT NULL DEFAULT 1,
  topic             VARCHAR(255),
  notes             TEXT,
  "createdAt"       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  -- Uma sessão por número de aula no mesmo dia
  CONSTRAINT class_sessions_uq UNIQUE ("classSubjectId", "lessonDate", "lessonNumber")
);

CREATE INDEX class_sessions_lesson_date_idx ON "classSessions" ("lessonDate");
CREATE INDEX class_sessions_subject_idx     ON "classSessions" ("classSubjectId");

COMMENT ON TABLE  "classSessions" IS 'Registro de cada aula ministrada.';
COMMENT ON COLUMN "classSessions"."lessonNumber" IS 'Número da aula no dia (ex.: 1ª, 2ª aula).';
COMMENT ON COLUMN "classSessions".topic IS 'Conteúdo trabalhado na aula.';

-- ────────────────────────────────────────────────────────────
-- 5.17 attendanceRecords
-- ────────────────────────────────────────────────────────────

CREATE TABLE "attendanceRecords" (
  id                       SERIAL PRIMARY KEY,
  "classSessionId"         INTEGER           NOT NULL REFERENCES "classSessions" (id) ON DELETE CASCADE,
  "studentId"              INTEGER           NOT NULL REFERENCES students        (id) ON DELETE CASCADE,
  status                   attendance_status NOT NULL DEFAULT 'present',
  reason                   TEXT,
  "recordedByTeacherId"    INTEGER                    REFERENCES teachers        (id) ON DELETE SET NULL,
  "deletedAt"              TIMESTAMPTZ,
  "createdAt"              TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  "updatedAt"              TIMESTAMPTZ       NOT NULL DEFAULT NOW(),

  -- Um registro por aluno por sessão
  CONSTRAINT attendance_records_uq UNIQUE ("classSessionId", "studentId")
);

CREATE INDEX attendance_records_student_id_idx ON "attendanceRecords" ("studentId");
CREATE INDEX attendance_records_status_idx     ON "attendanceRecords" (status);
CREATE INDEX attendance_records_deleted_idx    ON "attendanceRecords" ("deletedAt") WHERE "deletedAt" IS NULL;

COMMENT ON TABLE  "attendanceRecords" IS 'Presença/falta por aluno por aula.';
COMMENT ON COLUMN "attendanceRecords".reason IS 'Motivo da falta ou justificativa prévia.';
COMMENT ON COLUMN "attendanceRecords"."deletedAt" IS 'Soft delete.';

-- ────────────────────────────────────────────────────────────
-- 5.18 assessments
-- ────────────────────────────────────────────────────────────

CREATE TABLE assessments (
  id                SERIAL PRIMARY KEY,
  "classSubjectId"  INTEGER        NOT NULL REFERENCES "classSubjects" (id) ON DELETE CASCADE,
  "teacherId"       INTEGER                 REFERENCES teachers        (id) ON DELETE SET NULL,
  title             VARCHAR(255)   NOT NULL,
  description       TEXT,
  "maxScore"        DECIMAL(5, 2)  NOT NULL DEFAULT 10.00,
  weight            DECIMAL(5, 2)  NOT NULL DEFAULT 1.00,
  "assessmentDate"  DATE           NOT NULL,
  "deletedAt"       TIMESTAMPTZ,
  "createdAt"       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX assessments_class_subject_id_idx ON assessments ("classSubjectId");
CREATE INDEX assessments_assessment_date_idx  ON assessments ("assessmentDate");
CREATE INDEX assessments_deleted_idx          ON assessments ("deletedAt") WHERE "deletedAt" IS NULL;

COMMENT ON TABLE  assessments IS 'Definição de avaliação/prova/trabalho.';
COMMENT ON COLUMN assessments."maxScore" IS 'Nota máxima (padrão 10).';
COMMENT ON COLUMN assessments.weight IS 'Peso na composição da média.';
COMMENT ON COLUMN assessments."deletedAt" IS 'Soft delete.';

-- ────────────────────────────────────────────────────────────
-- 5.19 assessmentScores
-- ────────────────────────────────────────────────────────────

CREATE TABLE "assessmentScores" (
  id             SERIAL PRIMARY KEY,
  "assessmentId" INTEGER       NOT NULL REFERENCES assessments (id) ON DELETE CASCADE,
  "studentId"    INTEGER       NOT NULL REFERENCES students    (id) ON DELETE CASCADE,
  score          DECIMAL(5, 2) NOT NULL,
  feedback       TEXT,
  "deletedAt"    TIMESTAMPTZ,
  "createdAt"    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "updatedAt"    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  -- Nota única por aluno por avaliação
  CONSTRAINT assessment_scores_uq UNIQUE ("assessmentId", "studentId")
);

CREATE INDEX assessment_scores_student_id_idx ON "assessmentScores" ("studentId");
CREATE INDEX assessment_scores_deleted_idx    ON "assessmentScores" ("deletedAt") WHERE "deletedAt" IS NULL;

COMMENT ON TABLE  "assessmentScores" IS 'Notas dos alunos em cada avaliação.';
COMMENT ON COLUMN "assessmentScores".score IS 'Nota obtida (ex.: 7.50).';
COMMENT ON COLUMN "assessmentScores".feedback IS 'Comentário opcional do professor sobre o resultado.';
COMMENT ON COLUMN "assessmentScores"."deletedAt" IS 'Soft delete.';
