-- ============================================================
-- RED — Registro Escolar Digital
-- Arquivo 04: Estrutura Acadêmica
-- subjects · classes · classSubjects · classTeachers · classEnrollments
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 5.11 subjects
-- ────────────────────────────────────────────────────────────

CREATE TABLE subjects (
  id            SERIAL PRIMARY KEY,
  "schoolId"    INTEGER      NOT NULL REFERENCES schools (id) ON DELETE CASCADE,
  name          VARCHAR(255) NOT NULL,
  code          VARCHAR(50),
  description   TEXT,
  "createdAt"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT subjects_school_name_uq UNIQUE ("schoolId", name),
  -- Código único por escola (quando informado)
  CONSTRAINT subjects_school_code_uq UNIQUE ("schoolId", code)
);

CREATE INDEX subjects_school_id_idx ON subjects ("schoolId");

COMMENT ON TABLE  subjects IS 'Catálogo de disciplinas por escola.';
COMMENT ON COLUMN subjects.code IS 'Código interno da disciplina, ex.: MAT001.';

-- ────────────────────────────────────────────────────────────
-- 5.12 classes
-- ────────────────────────────────────────────────────────────

CREATE TABLE classes (
  id              SERIAL PRIMARY KEY,
  "schoolId"      INTEGER       NOT NULL REFERENCES schools      (id) ON DELETE CASCADE,
  "schoolYearId"  INTEGER       NOT NULL REFERENCES "schoolYears" (id) ON DELETE CASCADE,
  name            VARCHAR(50)   NOT NULL,
  "gradeLabel"    VARCHAR(100)  NOT NULL,
  course          VARCHAR(255),
  code            VARCHAR(50),
  shift           class_shift   NOT NULL DEFAULT 'morning',
  status          class_status  NOT NULL DEFAULT 'ativo',
  "deletedAt"     TIMESTAMPTZ,
  "createdAt"     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  -- Nome único por ano letivo (ex.: "6A" em 2026)
  CONSTRAINT classes_year_name_uq UNIQUE ("schoolYearId", name)
);

CREATE INDEX classes_school_id_idx      ON classes ("schoolId");
CREATE INDEX classes_school_year_id_idx ON classes ("schoolYearId");
CREATE INDEX classes_deleted_idx        ON classes ("deletedAt") WHERE "deletedAt" IS NULL;

COMMENT ON TABLE  classes IS 'Turmas por escola e ano letivo.';
COMMENT ON COLUMN classes.name IS 'Identificador curto, ex.: 6A, 2B.';
COMMENT ON COLUMN classes."gradeLabel" IS 'Rótulo legível, ex.: 6º Ano A.';
COMMENT ON COLUMN classes.course IS 'Trilha/curso técnico, ex.: Enfermagem.';
COMMENT ON COLUMN classes."deletedAt" IS 'Soft delete.';

-- ────────────────────────────────────────────────────────────
-- 5.13 classSubjects
-- ────────────────────────────────────────────────────────────

CREATE TABLE "classSubjects" (
  id            SERIAL PRIMARY KEY,
  "classId"     INTEGER     NOT NULL REFERENCES classes  (id) ON DELETE CASCADE,
  "subjectId"   INTEGER     NOT NULL REFERENCES subjects (id) ON DELETE RESTRICT,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT class_subjects_uq UNIQUE ("classId", "subjectId")
);

CREATE INDEX class_subjects_class_id_idx   ON "classSubjects" ("classId");
CREATE INDEX class_subjects_subject_id_idx ON "classSubjects" ("subjectId");

COMMENT ON TABLE "classSubjects" IS 'Liga turma à disciplina (N:N).';

-- ────────────────────────────────────────────────────────────
-- 5.14 classTeachers
-- ────────────────────────────────────────────────────────────

CREATE TABLE "classTeachers" (
  id                SERIAL PRIMARY KEY,
  "classSubjectId"  INTEGER     NOT NULL REFERENCES "classSubjects" (id) ON DELETE CASCADE,
  "teacherId"       INTEGER     NOT NULL REFERENCES teachers        (id) ON DELETE CASCADE,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT class_teachers_uq UNIQUE ("classSubjectId", "teacherId")
);

CREATE INDEX class_teachers_teacher_id_idx ON "classTeachers" ("teacherId");

COMMENT ON TABLE "classTeachers" IS 'Liga professor ao par turma-disciplina.';

-- ────────────────────────────────────────────────────────────
-- 5.15 classEnrollments
-- ────────────────────────────────────────────────────────────

CREATE TABLE "classEnrollments" (
  id               SERIAL PRIMARY KEY,
  "classId"         INTEGER           NOT NULL REFERENCES classes  (id) ON DELETE CASCADE,
  "studentId"       INTEGER           NOT NULL REFERENCES students (id) ON DELETE CASCADE,
  "enrollmentDate"  DATE              NOT NULL DEFAULT CURRENT_DATE,
  status           enrollment_status NOT NULL DEFAULT 'ativo',
  "deletedAt"       TIMESTAMPTZ,
  "createdAt"       TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMPTZ       NOT NULL DEFAULT NOW(),

  -- Aluno matriculado apenas uma vez por turma
  CONSTRAINT class_enrollments_uq UNIQUE ("classId", "studentId")
);

CREATE INDEX class_enrollments_student_id_idx ON "classEnrollments" ("studentId");
CREATE INDEX class_enrollments_status_idx     ON "classEnrollments" (status);
CREATE INDEX class_enrollments_deleted_idx    ON "classEnrollments" ("deletedAt") WHERE "deletedAt" IS NULL;

COMMENT ON TABLE  "classEnrollments" IS 'Matrícula do aluno na turma com histórico de status.';
COMMENT ON COLUMN "classEnrollments"."deletedAt" IS 'Soft delete.';
