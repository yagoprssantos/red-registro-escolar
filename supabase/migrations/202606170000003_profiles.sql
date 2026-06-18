-- ============================================================
-- RED — Registro Escolar Digital
-- Arquivo 03: Perfis Escolares
-- teachers · students · guardians · studentGuardians · contacts
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 5.6 teachers
-- ────────────────────────────────────────────────────────────

CREATE TABLE teachers (
  id            SERIAL PRIMARY KEY,
  "userId"      INTEGER      NOT NULL REFERENCES users   (id) ON DELETE CASCADE,
  "schoolId"    INTEGER      NOT NULL REFERENCES schools (id) ON DELETE CASCADE,
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) NOT NULL,
  phone         VARCHAR(50),
  subject       VARCHAR(100),
  active        SMALLINT     NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  "deletedAt"   TIMESTAMPTZ,
  "createdAt"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT teachers_user_school_uq UNIQUE ("userId", "schoolId")
);

CREATE INDEX teachers_school_id_idx ON teachers ("schoolId");
CREATE INDEX teachers_email_idx     ON teachers (email);
CREATE INDEX teachers_deleted_idx   ON teachers ("deletedAt") WHERE "deletedAt" IS NULL;

COMMENT ON TABLE  teachers IS 'Perfil profissional do professor na escola.';
COMMENT ON COLUMN teachers.subject IS 'Área principal de docência.';
COMMENT ON COLUMN teachers."deletedAt" IS 'Soft delete — preenchido indica professor removido logicamente.';

-- ────────────────────────────────────────────────────────────
-- 5.7 students
-- ────────────────────────────────────────────────────────────

CREATE TABLE students (
  id                 SERIAL PRIMARY KEY,
  "userId"           INTEGER        REFERENCES users   (id) ON DELETE SET NULL,
  "schoolId"         INTEGER        NOT NULL REFERENCES schools (id) ON DELETE CASCADE,
  "enrollmentNumber" VARCHAR(100),
  name               VARCHAR(255)   NOT NULL,
  email              VARCHAR(255),
  phone              VARCHAR(50),
  "dateOfBirth"      DATE,
  grade              VARCHAR(50),
  status             student_status NOT NULL DEFAULT 'ativo',
  "deletedAt"        TIMESTAMPTZ,
  "createdAt"        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  "updatedAt"        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

  -- Um usuário pode ter apenas um perfil de aluno por escola
  CONSTRAINT students_user_school_uq   UNIQUE ("userId", "schoolId"),
  -- Matrícula única por escola
  CONSTRAINT students_enrollment_uq    UNIQUE ("schoolId", "enrollmentNumber")
);

CREATE INDEX students_school_id_idx ON students ("schoolId");
CREATE INDEX students_status_idx    ON students (status);
CREATE INDEX students_deleted_idx   ON students ("deletedAt") WHERE "deletedAt" IS NULL;

COMMENT ON TABLE  students IS 'Perfil acadêmico do aluno.';
COMMENT ON COLUMN students."userId" IS 'Nullable: permite aluno cadastrado sem login próprio.';
COMMENT ON COLUMN students."deletedAt" IS 'Soft delete — preenchido indica aluno removido logicamente.';

-- ────────────────────────────────────────────────────────────
-- 5.8 guardians
-- ────────────────────────────────────────────────────────────

CREATE TABLE guardians (
  id            SERIAL PRIMARY KEY,
  "userId"      INTEGER      REFERENCES users   (id) ON DELETE SET NULL,
  "schoolId"    INTEGER      NOT NULL REFERENCES schools (id) ON DELETE CASCADE,
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) NOT NULL,
  phone         VARCHAR(50),
  relationship  VARCHAR(100),
  "deletedAt"   TIMESTAMPTZ,
  "createdAt"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT guardians_user_school_uq UNIQUE ("userId", "schoolId")
);

CREATE INDEX guardians_school_id_idx ON guardians ("schoolId");
CREATE INDEX guardians_email_idx     ON guardians (email);
CREATE INDEX guardians_deleted_idx   ON guardians ("deletedAt") WHERE "deletedAt" IS NULL;

COMMENT ON TABLE  guardians IS 'Perfil de responsável legal.';
COMMENT ON COLUMN guardians.relationship IS 'Ex.: mãe, pai, tutor, avó.';
COMMENT ON COLUMN guardians."deletedAt" IS 'Soft delete.';

-- ────────────────────────────────────────────────────────────
-- 5.9 studentGuardians
-- ────────────────────────────────────────────────────────────

CREATE TABLE "studentGuardians" (
  id            SERIAL PRIMARY KEY,
  "studentId"   INTEGER     NOT NULL REFERENCES students  (id) ON DELETE CASCADE,
  "guardianId"  INTEGER     NOT NULL REFERENCES guardians (id) ON DELETE CASCADE,
  relationship  VARCHAR(100),
  "isPrimary"   SMALLINT    NOT NULL DEFAULT 0 CHECK ("isPrimary" IN (0, 1)),
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT student_guardians_uq UNIQUE ("studentId", "guardianId")
);

CREATE INDEX student_guardians_student_id_idx  ON "studentGuardians" ("studentId");
CREATE INDEX student_guardians_guardian_id_idx ON "studentGuardians" ("guardianId");

COMMENT ON TABLE  "studentGuardians" IS 'Relação N:N entre alunos e responsáveis.';
COMMENT ON COLUMN "studentGuardians"."isPrimary" IS '1 = responsável principal.';

-- ────────────────────────────────────────────────────────────
-- 5.10 contacts
-- ────────────────────────────────────────────────────────────

CREATE TABLE contacts (
  id            SERIAL PRIMARY KEY,
  "schoolId"    INTEGER        REFERENCES schools (id) ON DELETE SET NULL,
  name          VARCHAR(255)   NOT NULL,
  email         VARCHAR(255)   NOT NULL,
  school        VARCHAR(255)   NOT NULL,
  role          VARCHAR(100)   NOT NULL,
  students      VARCHAR(50),
  message       TEXT,
  status        contact_status NOT NULL DEFAULT 'novo',
  "createdAt"   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX contacts_school_id_idx ON contacts ("schoolId");
CREATE INDEX contacts_status_idx    ON contacts (status);

COMMENT ON TABLE  contacts IS 'Registros de contatos recebidos (ex.: formulários de interesse).';
COMMENT ON COLUMN contacts.school IS 'Nome da escola informado pelo contato (campo livre).';
