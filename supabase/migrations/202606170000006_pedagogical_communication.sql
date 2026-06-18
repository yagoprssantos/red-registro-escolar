-- ============================================================
-- RED — Registro Escolar Digital
-- Arquivo 06: Pedagógico, Comunicação e Notificações
-- studentComments · schoolEvents · eventTargets
-- communications · communicationRecipients · notifications · attachments
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 5.20 studentComments
-- ────────────────────────────────────────────────────────────

CREATE TABLE "studentComments" (
  id                SERIAL PRIMARY KEY,
  "schoolId"        INTEGER             NOT NULL REFERENCES schools        (id) ON DELETE CASCADE,
  "studentId"       INTEGER             NOT NULL REFERENCES students       (id) ON DELETE CASCADE,
  "teacherId"       INTEGER                      REFERENCES teachers       (id) ON DELETE SET NULL,
  "classSubjectId"  INTEGER                      REFERENCES "classSubjects" (id) ON DELETE SET NULL,
  category          comment_category    NOT NULL DEFAULT 'comentario',
  visibility        comment_visibility  NOT NULL DEFAULT 'all',
  content           TEXT                NOT NULL,
  "deletedAt"       TIMESTAMPTZ,
  "createdAt"       TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX student_comments_school_id_idx   ON "studentComments" ("schoolId");
CREATE INDEX student_comments_student_id_idx  ON "studentComments" ("studentId");
CREATE INDEX student_comments_category_idx    ON "studentComments" (category);
CREATE INDEX student_comments_created_at_idx  ON "studentComments" ("createdAt");
CREATE INDEX student_comments_deleted_idx     ON "studentComments" ("deletedAt") WHERE "deletedAt" IS NULL;

COMMENT ON TABLE  "studentComments" IS 'Comentários pedagógicos e ocorrências por aluno.';
COMMENT ON COLUMN "studentComments".visibility IS 'Controle de acesso: student, guardian, school ou all.';
COMMENT ON COLUMN "studentComments"."deletedAt" IS 'Soft delete.';

-- ────────────────────────────────────────────────────────────
-- 5.21 schoolEvents
-- ────────────────────────────────────────────────────────────

CREATE TABLE "schoolEvents" (
  id                  SERIAL PRIMARY KEY,
  "schoolId"          INTEGER     NOT NULL REFERENCES schools (id) ON DELETE CASCADE,
  title               VARCHAR(255) NOT NULL,
  description         TEXT,
  "eventType"         event_type  NOT NULL DEFAULT 'evento_escolar',
  "startsAt"          TIMESTAMPTZ NOT NULL,
  "endsAt"            TIMESTAMPTZ,
  "createdByUserId"   INTEGER              REFERENCES users   (id) ON DELETE SET NULL,
  "deletedAt"         TIMESTAMPTZ,
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX school_events_school_id_idx ON "schoolEvents" ("schoolId");
CREATE INDEX school_events_starts_at_idx ON "schoolEvents" ("startsAt");
CREATE INDEX school_events_deleted_idx   ON "schoolEvents" ("deletedAt") WHERE "deletedAt" IS NULL;

COMMENT ON TABLE  "schoolEvents" IS 'Calendário de eventos escolares.';
COMMENT ON COLUMN "schoolEvents"."startsAt" IS 'Data/hora de início do evento.';
COMMENT ON COLUMN "schoolEvents"."endsAt" IS 'Data/hora de fim (opcional para eventos de dia inteiro).';
COMMENT ON COLUMN "schoolEvents"."deletedAt" IS 'Soft delete.';

-- ────────────────────────────────────────────────────────────
-- 5.22 eventTargets
-- ────────────────────────────────────────────────────────────

CREATE TABLE "eventTargets" (
  id             SERIAL PRIMARY KEY,
  "eventId"      INTEGER           NOT NULL REFERENCES "schoolEvents" (id) ON DELETE CASCADE,
  "targetType"   event_target_type NOT NULL,
  "targetRefId"  INTEGER           NOT NULL,
  "createdAt"    TIMESTAMPTZ       NOT NULL DEFAULT NOW(),

  CONSTRAINT event_targets_uq UNIQUE ("eventId", "targetType", "targetRefId")
);

CREATE INDEX event_targets_type_ref_idx ON "eventTargets" ("targetType", "targetRefId");

COMMENT ON TABLE  "eventTargets" IS 'Define o público-alvo de cada evento.';
COMMENT ON COLUMN "eventTargets"."targetRefId" IS 'Id do alvo conforme targetType (school/class/student/guardian).';

-- ────────────────────────────────────────────────────────────
-- 5.23 communications
-- ────────────────────────────────────────────────────────────

CREATE TABLE communications (
  id                  SERIAL PRIMARY KEY,
  "schoolId"          INTEGER             NOT NULL REFERENCES schools       (id) ON DELETE CASCADE,
  "authorUserId"      INTEGER                      REFERENCES users         (id) ON DELETE SET NULL,
  title               VARCHAR(255)        NOT NULL,
  body                TEXT                NOT NULL,
  "communicationType" communication_type  NOT NULL DEFAULT 'announcement',
  "relatedEventId"    INTEGER                      REFERENCES "schoolEvents" (id) ON DELETE SET NULL,
  "deletedAt"         TIMESTAMPTZ,
  "createdAt"         TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  "updatedAt"         TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX communications_school_id_idx  ON communications ("schoolId");
CREATE INDEX communications_type_idx       ON communications ("communicationType");
CREATE INDEX communications_deleted_idx    ON communications ("deletedAt") WHERE "deletedAt" IS NULL;

COMMENT ON TABLE  communications IS 'Mensagens oficiais da escola para a comunidade escolar.';
COMMENT ON COLUMN communications."deletedAt" IS 'Soft delete.';

-- ────────────────────────────────────────────────────────────
-- 5.24 communicationRecipients
-- ────────────────────────────────────────────────────────────

CREATE TABLE "communicationRecipients" (
  id                 SERIAL PRIMARY KEY,
  "communicationId"  INTEGER         NOT NULL REFERENCES communications (id) ON DELETE CASCADE,
  "recipientType"     recipient_type  NOT NULL,
  "recipientRefId"    INTEGER         NOT NULL,
  "readAt"            TIMESTAMPTZ,
  "createdAt"         TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  CONSTRAINT communication_recipients_uq UNIQUE ("communicationId", "recipientType", "recipientRefId")
);

CREATE INDEX communication_recipients_type_ref_idx ON "communicationRecipients" ("recipientType", "recipientRefId");

COMMENT ON TABLE  "communicationRecipients" IS 'Destinatários de cada comunicado com controle de leitura.';
COMMENT ON COLUMN "communicationRecipients"."readAt" IS 'Preenchido quando o destinatário abre o comunicado.';

-- ────────────────────────────────────────────────────────────
-- 5.25 notifications
-- ────────────────────────────────────────────────────────────

CREATE TABLE notifications (
  id                 SERIAL PRIMARY KEY,
  "userId"           INTEGER            NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  "notificationType" notification_type  NOT NULL DEFAULT 'general',
  title              VARCHAR(255)       NOT NULL,
  body               TEXT               NOT NULL,
  "actionUrl"        VARCHAR(500),
  "isRead"           SMALLINT           NOT NULL DEFAULT 0 CHECK ("isRead" IN (0, 1)),
  "readAt"           TIMESTAMPTZ,
  "deletedAt"        TIMESTAMPTZ,
  "createdAt"        TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

CREATE INDEX notifications_user_id_idx       ON notifications ("userId");
CREATE INDEX notifications_user_is_read_idx  ON notifications ("userId", "isRead");
CREATE INDEX notifications_created_at_idx    ON notifications ("createdAt");
CREATE INDEX notifications_deleted_idx       ON notifications ("deletedAt") WHERE "deletedAt" IS NULL;

COMMENT ON TABLE  notifications IS 'Alertas e notificações pessoais por usuário.';
COMMENT ON COLUMN notifications."actionUrl" IS 'URL de ação ao clicar na notificação.';
COMMENT ON COLUMN notifications."isRead" IS '0 = não lida, 1 = lida.';
COMMENT ON COLUMN notifications."deletedAt" IS 'Soft delete.';

-- ────────────────────────────────────────────────────────────
-- 5.26 attachments
-- ────────────────────────────────────────────────────────────

CREATE TABLE attachments (
  id          SERIAL PRIMARY KEY,
  "ownerType" attachment_owner_type NOT NULL,
  "ownerId"   INTEGER               NOT NULL,
  "fileUrl"   VARCHAR(1000)         NOT NULL,
  "fileName"  VARCHAR(255)          NOT NULL,
  "mimeType"  VARCHAR(100),
  "sizeBytes" INTEGER,
  "createdAt" TIMESTAMPTZ           NOT NULL DEFAULT NOW()
);

CREATE INDEX attachments_owner_idx ON attachments ("ownerType", "ownerId");

COMMENT ON TABLE  attachments IS 'Metadados de anexos (sem binário no banco — uso de URL).';
COMMENT ON COLUMN attachments."ownerType" IS 'Tipo da entidade dona: event, communication ou comment.';
COMMENT ON COLUMN attachments."ownerId" IS 'Id da entidade dona conforme ownerType.';
COMMENT ON COLUMN attachments."fileUrl" IS 'URL do arquivo no storage externo.';
