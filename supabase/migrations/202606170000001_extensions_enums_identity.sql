-- ============================================================
-- RED — Registro Escolar Digital
-- Arquivo 01: Extensões, Enums e Tabelas de Identidade
-- Compatível com PostgreSQL / Supabase
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- EXTENSÕES
-- ────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ────────────────────────────────────────────────────────────
-- ENUMS
-- ────────────────────────────────────────────────────────────

-- Papéis globais do usuário na plataforma
CREATE TYPE user_role AS ENUM (
  'user',
  'admin',
  'teacher',
  'student',
  'guardian',
  'school_staff'
);

-- Perfil padrão de abertura da experiência
CREATE TYPE user_default_profile AS ENUM (
  'school',
  'teacher',
  'student',
  'guardian'
);

-- Situação da escola
CREATE TYPE school_status AS ENUM (
  'ativo',
  'inativo',
  'trial'
);

-- Papel operacional do usuário em uma escola
CREATE TYPE user_school_role AS ENUM (
  'admin',
  'director',
  'coordinator',
  'teacher',
  'guardian',
  'student',
  'secretary'
);

-- Papel da equipe escolar
CREATE TYPE staff_role AS ENUM (
  'admin',
  'director',
  'coordinator',
  'secretary'
);

-- Status do aluno
CREATE TYPE student_status AS ENUM (
  'ativo',
  'inativo',
  'transferido'
);

-- Status de contato comercial/operacional
CREATE TYPE contact_status AS ENUM (
  'novo',
  'respondido',
  'descartado'
);

-- Turno da turma
CREATE TYPE class_shift AS ENUM (
  'morning',
  'afternoon',
  'evening',
  'full_day'
);

-- Situação da turma
CREATE TYPE class_status AS ENUM (
  'ativo',
  'inativo',
  'encerrada'
);

-- Status de matrícula do aluno
CREATE TYPE enrollment_status AS ENUM (
  'ativo',
  'transferido',
  'concluido'
);

-- Status de presença/falta
CREATE TYPE attendance_status AS ENUM (
  'present',
  'absent',
  'justified'
);

-- Categoria de comentário pedagógico
CREATE TYPE comment_category AS ENUM (
  'elogio',
  'melhoria',
  'ocorrencia',
  'comentario'
);

-- Visibilidade de comentário pedagógico
CREATE TYPE comment_visibility AS ENUM (
  'student',
  'guardian',
  'school',
  'all'
);

-- Tipo de evento escolar
CREATE TYPE event_type AS ENUM (
  'prova',
  'feriado',
  'saida_antecipada',
  'evento_escolar',
  'reuniao'
);

-- Público-alvo de evento
CREATE TYPE event_target_type AS ENUM (
  'school',
  'class',
  'student',
  'guardian'
);

-- Tipo de comunicado
CREATE TYPE communication_type AS ENUM (
  'announcement',
  'reminder',
  'alert'
);

-- Destinatário de comunicado
CREATE TYPE recipient_type AS ENUM (
  'student',
  'guardian',
  'teacher',
  'staff'
);

-- Tipo de notificação
CREATE TYPE notification_type AS ENUM (
  'absence_alert',
  'grade_published',
  'comment_received',
  'communication',
  'event_reminder',
  'justification_pending',
  'justification_result',
  'general'
);

-- Tipo de dono de anexo
CREATE TYPE attachment_owner_type AS ENUM (
  'event',
  'communication',
  'comment'
);

-- Status de justificativa de falta
CREATE TYPE justification_status AS ENUM (
  'pending',
  'approved',
  'rejected'
);

-- ────────────────────────────────────────────────────────────
-- 5.1 users
-- ────────────────────────────────────────────────────────────

CREATE TABLE users (
  id              SERIAL PRIMARY KEY,
  "openId"        VARCHAR(255)          NOT NULL,
  name            VARCHAR(255),
  email           VARCHAR(255),
  "loginMethod"   VARCHAR(100),
  role            user_role             NOT NULL DEFAULT 'user',
  "defaultProfile" user_default_profile,
  "createdAt"     TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  "lastSignedIn"  TIMESTAMPTZ           NOT NULL DEFAULT NOW(),

  CONSTRAINT users_open_id_uq UNIQUE ("openId")
);

CREATE INDEX users_email_idx    ON users (email);
CREATE INDEX users_role_idx     ON users (role);

COMMENT ON TABLE  users IS 'Identidade base de todos os usuários da plataforma RED.';
COMMENT ON COLUMN users."openId" IS 'Identificador externo de autenticação (ex.: Clerk userId).';
COMMENT ON COLUMN users.role IS 'Papel global do usuário na plataforma.';
COMMENT ON COLUMN users."defaultProfile" IS 'Perfil padrão exibido ao abrir o dashboard.';
