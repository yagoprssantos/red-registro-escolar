-- ============================================================
-- RED — Registro Escolar Digital
-- Arquivo 10: Row Level Security (RLS) para Supabase
-- ============================================================
-- ATENÇÃO: Este arquivo configura RLS para acesso direto via
-- Supabase client. Se o acesso ao banco for feito APENAS via
-- backend tRPC (service_role), as policies abaixo são opcionais
-- mas recomendadas como camada adicional de segurança.
-- ============================================================

-- ── Habilitar RLS em todas as tabelas ───────────────────────

ALTER TABLE users                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "schoolYears"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "userSchools"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "schoolStaffProfiles"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE students                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardians                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE "studentGuardians"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "classSubjects"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "classTeachers"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "classEnrollments"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "classSessions"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "attendanceRecords"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments               ENABLE ROW LEVEL SECURITY;
ALTER TABLE "assessmentScores"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "studentComments"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "schoolEvents"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "eventTargets"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "communicationRecipients" ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications             ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments               ENABLE ROW LEVEL SECURITY;
ALTER TABLE "absenceJustifications"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "schoolPlatforms"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "scheduleSlots"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "auditLogs"               ENABLE ROW LEVEL SECURITY;

-- ── Função auxiliar: retorna user_id interno do JWT ─────────
-- O backend insere o 'id' interno como claim 'app_user_id'
-- no JWT customizado ao criar a sessão. Ajuste conforme seu
-- setup de Auth (Clerk, Supabase Auth, etc.).

CREATE OR REPLACE FUNCTION current_app_user_id()
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_user_id', TRUE), '')::INTEGER;
$$;

-- ── Função auxiliar: verifica se usuário é admin global ─────

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = current_app_user_id()
      AND role = 'admin'
  );
$$;

-- ── Função auxiliar: retorna school_ids do usuário ──────────

CREATE OR REPLACE FUNCTION my_school_ids()
RETURNS INTEGER[]
LANGUAGE sql
STABLE
AS $$
  SELECT ARRAY(
    SELECT "schoolId" FROM "userSchools"
    WHERE "userId" = current_app_user_id()
  );
$$;

-- ────────────────────────────────────────────────────────────
-- POLICIES — service_role sempre bypassa RLS
-- As policies abaixo cobrem acesso anon/authenticated
-- ────────────────────────────────────────────────────────────

-- users: cada usuário vê apenas a si mesmo; admin vê todos
CREATE POLICY users_select ON users
  FOR SELECT USING (
    id = current_app_user_id()
    OR is_admin()
  );

-- schools: usuário vê escolas às quais está vinculado
CREATE POLICY schools_select ON schools
  FOR SELECT USING (
    id = ANY(my_school_ids())
    OR is_admin()
  );

-- schoolYears: vinculado à escola
CREATE POLICY school_years_select ON "schoolYears"
  FOR SELECT USING (
    "schoolId" = ANY(my_school_ids())
    OR is_admin()
  );

-- userSchools: usuário vê seus próprios vínculos; gestão vê da sua escola
CREATE POLICY user_schools_select ON "userSchools"
  FOR SELECT USING (
    "userId" = current_app_user_id()
    OR "schoolId" = ANY(my_school_ids())
    OR is_admin()
  );

-- schoolStaffProfiles
CREATE POLICY school_staff_profiles_select ON "schoolStaffProfiles"
  FOR SELECT USING (
    "userId" = current_app_user_id()
    OR "schoolId" = ANY(my_school_ids())
    OR is_admin()
  );

-- teachers: ver professores da mesma escola
CREATE POLICY teachers_select ON teachers
  FOR SELECT USING (
    "schoolId" = ANY(my_school_ids())
    OR "userId" = current_app_user_id()
    OR is_admin()
  );

-- students: aluno vê só a si; gestão/professor da escola vê todos da escola
CREATE POLICY students_select ON students
  FOR SELECT USING (
    "userId" = current_app_user_id()
    OR "schoolId" = ANY(my_school_ids())
    OR is_admin()
  );

-- guardians
CREATE POLICY guardians_select ON guardians
  FOR SELECT USING (
    "userId" = current_app_user_id()
    OR "schoolId" = ANY(my_school_ids())
    OR is_admin()
  );

-- studentGuardians: aluno/responsável envolvido; escola
CREATE POLICY student_guardians_select ON "studentGuardians"
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM students   s WHERE s.id = "studentId"  AND (s."userId" = current_app_user_id() OR s."schoolId" = ANY(my_school_ids())))
    OR EXISTS (SELECT 1 FROM guardians g WHERE g.id = "guardianId" AND  g."userId" = current_app_user_id())
    OR is_admin()
  );

-- contacts: apenas escola dona e admin
CREATE POLICY contacts_select ON contacts
  FOR SELECT USING (
    "schoolId" = ANY(my_school_ids())
    OR is_admin()
  );

-- subjects: escola dona
CREATE POLICY subjects_select ON subjects
  FOR SELECT USING (
    "schoolId" = ANY(my_school_ids())
    OR is_admin()
  );

-- classes: escola dona
CREATE POLICY classes_select ON classes
  FOR SELECT USING (
    "schoolId" = ANY(my_school_ids())
    OR is_admin()
  );

-- classSubjects: via escola da turma
CREATE POLICY class_subjects_select ON "classSubjects"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = "classId"
        AND c."schoolId" = ANY(my_school_ids())
    )
    OR is_admin()
  );

-- classTeachers
CREATE POLICY class_teachers_select ON "classTeachers"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teachers t
      WHERE t.id = "teacherId"
        AND (t."schoolId" = ANY(my_school_ids()) OR t."userId" = current_app_user_id())
    )
    OR is_admin()
  );

-- classEnrollments: aluno vê sua matrícula; escola/professor da escola vê todas
CREATE POLICY class_enrollments_select ON "classEnrollments"
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM students s WHERE s.id = "studentId" AND s."userId" = current_app_user_id())
    OR EXISTS (SELECT 1 FROM classes c WHERE c.id = "classId" AND c."schoolId" = ANY(my_school_ids()))
    OR is_admin()
  );

-- classSessions: escola ou professor responsável
CREATE POLICY class_sessions_select ON "classSessions"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "classSubjects" cs
      JOIN classes c ON c.id = cs."classId"
      WHERE cs.id = "classSubjectId"
        AND c."schoolId" = ANY(my_school_ids())
    )
    OR "teacherId" IN (SELECT id FROM teachers WHERE "userId" = current_app_user_id())
    OR is_admin()
  );

-- attendanceRecords: aluno vê as suas; professor e escola veem as da escola
CREATE POLICY attendance_records_select ON "attendanceRecords"
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM students s WHERE s.id = "studentId" AND s."userId" = current_app_user_id())
    OR EXISTS (
      SELECT 1 FROM "classSessions" cs
      JOIN "classSubjects" csub ON csub.id = cs."classSubjectId"
      JOIN classes c ON c.id = csub."classId"
      WHERE cs.id = "classSessionId" AND c."schoolId" = ANY(my_school_ids())
    )
    OR is_admin()
  );

-- assessments: escola ou professor
CREATE POLICY assessments_select ON assessments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "classSubjects" cs
      JOIN classes c ON c.id = cs."classId"
      WHERE cs.id = "classSubjectId" AND c."schoolId" = ANY(my_school_ids())
    )
    OR "teacherId" IN (SELECT id FROM teachers WHERE "userId" = current_app_user_id())
    OR is_admin()
  );

-- assessmentScores: aluno vê seus próprios; escola/professor da escola
CREATE POLICY assessment_scores_select ON "assessmentScores"
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM students s WHERE s.id = "studentId" AND s."userId" = current_app_user_id())
    OR EXISTS (
      SELECT 1 FROM assessments a
      JOIN "classSubjects" cs ON cs.id = a."classSubjectId"
      JOIN classes c ON c.id = cs."classId"
      WHERE a.id = "assessmentId" AND c."schoolId" = ANY(my_school_ids())
    )
    OR is_admin()
  );

-- studentComments: visibilidade controlada
CREATE POLICY student_comments_select ON "studentComments"
  FOR SELECT USING (
    -- Escola vê todos os comentários
    "schoolId" = ANY(my_school_ids())
    -- Aluno vê apenas visibility = 'student' ou 'all'
    OR (
      EXISTS (SELECT 1 FROM students s WHERE s.id = "studentId" AND s."userId" = current_app_user_id())
      AND visibility IN ('student', 'all')
    )
    -- Responsável vê visibility = 'guardian' ou 'all'
    OR (
      EXISTS (
        SELECT 1 FROM "studentGuardians" sg
        JOIN guardians g ON g.id = sg."guardianId"
        WHERE sg."studentId" = "studentComments"."studentId"
          AND g."userId" = current_app_user_id()
      )
      AND visibility IN ('guardian', 'all')
    )
    OR is_admin()
  );

-- schoolEvents: escola dona + alunos/responsáveis via eventTargets
CREATE POLICY school_events_select ON "schoolEvents"
  FOR SELECT USING (
    "schoolId" = ANY(my_school_ids())
    OR is_admin()
  );

-- eventTargets: mesma regra do evento pai
CREATE POLICY event_targets_select ON "eventTargets"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "schoolEvents" se
      WHERE se.id = "eventId" AND se."schoolId" = ANY(my_school_ids())
    )
    OR is_admin()
  );

-- communications: escola dona
CREATE POLICY communications_select ON communications
  FOR SELECT USING (
    "schoolId" = ANY(my_school_ids())
    OR is_admin()
  );

-- communicationRecipients: destinatário direto ou escola
CREATE POLICY communication_recipients_select ON "communicationRecipients"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM communications co
      WHERE co.id = "communicationId" AND co."schoolId" = ANY(my_school_ids())
    )
    OR ("recipientType" = 'student'  AND EXISTS (SELECT 1 FROM students  s WHERE s.id = "recipientRefId" AND s."userId" = current_app_user_id()))
    OR ("recipientType" = 'guardian' AND EXISTS (SELECT 1 FROM guardians g WHERE g.id = "recipientRefId" AND g."userId" = current_app_user_id()))
    OR ("recipientType" = 'teacher'  AND EXISTS (SELECT 1 FROM teachers  t WHERE t.id = "recipientRefId" AND t."userId" = current_app_user_id()))
    OR is_admin()
  );

-- notifications: cada usuário vê apenas as suas
CREATE POLICY notifications_select ON notifications
  FOR SELECT USING (
    "userId" = current_app_user_id()
    OR is_admin()
  );

-- attachments: via entidade dona + escola
CREATE POLICY attachments_select ON attachments
  FOR SELECT USING (
    ("ownerType" = 'event'          AND EXISTS (SELECT 1 FROM "schoolEvents" e WHERE e.id = "ownerId" AND e."schoolId" = ANY(my_school_ids())))
    OR ("ownerType" = 'communication' AND EXISTS (SELECT 1 FROM communications c WHERE c.id = "ownerId" AND c."schoolId" = ANY(my_school_ids())))
    OR ("ownerType" = 'comment'       AND EXISTS (SELECT 1 FROM "studentComments" sc WHERE sc.id = "ownerId" AND sc."schoolId" = ANY(my_school_ids())))
    OR is_admin()
  );

-- absenceJustifications: responsável dono + escola
CREATE POLICY absence_justifications_select ON "absenceJustifications"
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM guardians g WHERE g.id = "guardianId" AND g."userId" = current_app_user_id())
    OR EXISTS (
      SELECT 1 FROM "attendanceRecords" ar
      JOIN "classSessions" cs ON cs.id = ar."classSessionId"
      JOIN "classSubjects" csub ON csub.id = cs."classSubjectId"
      JOIN classes c ON c.id = csub."classId"
      WHERE ar.id = "attendanceRecordId" AND c."schoolId" = ANY(my_school_ids())
    )
    OR is_admin()
  );

-- schoolPlatforms: escola dona + alunos/responsáveis da escola
CREATE POLICY school_platforms_select ON "schoolPlatforms"
  FOR SELECT USING (
    "schoolId" = ANY(my_school_ids())
    OR is_admin()
  );

-- scheduleSlots: escola dona + alunos/responsáveis da escola
CREATE POLICY schedule_slots_select ON "scheduleSlots"
  FOR SELECT USING (
    "schoolId" = ANY(my_school_ids())
    OR is_admin()
  );

-- auditLogs: apenas gestão e admin
CREATE POLICY audit_logs_select ON "auditLogs"
  FOR SELECT USING (
    "schoolId" = ANY(my_school_ids())
    OR is_admin()
  );

-- ── Nota: INSERT/UPDATE/DELETE via service_role ─────────────
-- O backend (tRPC) opera com service_role que bypassa RLS.
-- Para permitir writes via cliente (ex.: Supabase Realtime),
-- adicione policies FOR INSERT/UPDATE/DELETE conforme necessário.
