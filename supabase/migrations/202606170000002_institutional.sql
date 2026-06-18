-- ============================================================
-- RED — Registro Escolar Digital
-- Arquivo 02: Domínio Institucional
-- schools · schoolYears · userSchools · schoolStaffProfiles
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 5.2 schools
-- ────────────────────────────────────────────────────────────

CREATE TABLE schools (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(255)   NOT NULL,
  email           VARCHAR(255)   NOT NULL,
  phone           VARCHAR(50),
  address         TEXT,
  city            VARCHAR(100),
  state           VARCHAR(50),
  "zipCode"       VARCHAR(20),
  "studentCount"  INTEGER,
  status          school_status  NOT NULL DEFAULT 'trial',
  "createdAt"     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

  CONSTRAINT schools_email_uq UNIQUE (email)
);

COMMENT ON TABLE  schools IS 'Cadastro das instituições escolares.';
COMMENT ON COLUMN schools.status IS 'Estado operacional: ativo, inativo ou trial.';

-- ────────────────────────────────────────────────────────────
-- 5.3 schoolYears
-- ────────────────────────────────────────────────────────────

CREATE TABLE "schoolYears" (
  id            SERIAL PRIMARY KEY,
  "schoolId"    INTEGER        NOT NULL REFERENCES schools (id) ON DELETE CASCADE,
  name          VARCHAR(50)    NOT NULL,
  "startDate"   DATE           NOT NULL,
  "endDate"     DATE           NOT NULL,
  "isCurrent"   SMALLINT       NOT NULL DEFAULT 0 CHECK ("isCurrent" IN (0, 1)),
  "createdAt"   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

  CONSTRAINT school_years_school_name_uq UNIQUE ("schoolId", name)
);

CREATE INDEX school_years_school_id_idx          ON "schoolYears" ("schoolId");
CREATE INDEX school_years_school_is_current_idx  ON "schoolYears" ("schoolId", "isCurrent");

COMMENT ON TABLE  "schoolYears" IS 'Ano letivo por escola.';
COMMENT ON COLUMN "schoolYears"."isCurrent" IS '1 = ano letivo ativo no momento.';

-- ────────────────────────────────────────────────────────────
-- 5.4 userSchools
-- ────────────────────────────────────────────────────────────

CREATE TABLE "userSchools" (
  id            SERIAL PRIMARY KEY,
  "userId"      INTEGER          NOT NULL REFERENCES users   (id) ON DELETE CASCADE,
  "schoolId"    INTEGER          NOT NULL REFERENCES schools (id) ON DELETE CASCADE,
  role          user_school_role NOT NULL DEFAULT 'student',
  "createdAt"   TIMESTAMPTZ      NOT NULL DEFAULT NOW(),

  CONSTRAINT user_schools_user_school_uq UNIQUE ("userId", "schoolId")
);

CREATE INDEX user_schools_user_id_idx   ON "userSchools" ("userId");
CREATE INDEX user_schools_school_id_idx ON "userSchools" ("schoolId");

COMMENT ON TABLE  "userSchools" IS 'Vínculo entre usuário e escola com papel operacional.';

-- ────────────────────────────────────────────────────────────
-- 5.5 schoolStaffProfiles
-- ────────────────────────────────────────────────────────────

CREATE TABLE "schoolStaffProfiles" (
  id               SERIAL PRIMARY KEY,
  "userId"         INTEGER     NOT NULL REFERENCES users   (id) ON DELETE CASCADE,
  "schoolId"       INTEGER     NOT NULL REFERENCES schools (id) ON DELETE CASCADE,
  role             staff_role  NOT NULL,
  "positionTitle"  VARCHAR(100),
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT school_staff_profiles_uq UNIQUE ("userId", "schoolId", role)
);

CREATE INDEX school_staff_profiles_school_id_idx ON "schoolStaffProfiles" ("schoolId");

COMMENT ON TABLE  "schoolStaffProfiles" IS 'Detalhamento de perfil de equipe escolar (gestão/secretaria).';
COMMENT ON COLUMN "schoolStaffProfiles"."positionTitle" IS 'Cargo legível, ex.: Coordenador Pedagógico.';
