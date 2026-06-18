-- ============================================================
-- RED — Registro Escolar Digital
-- RPC Helpers para queries complexas
-- Compatível com esquema camelCase do banco cloud Supabase
-- ============================================================

-- ── get_teacher_classes ──────────────────────────────────────
-- Retorna turmas do professor com contagem de alunos ativos

CREATE OR REPLACE FUNCTION get_teacher_classes(p_user_id INTEGER)
RETURNS TABLE(
  id INTEGER,
  name VARCHAR,
  subject VARCHAR,
  students BIGINT
)
LANGUAGE sql STABLE
AS $$
  SELECT c.id, c.name, s.name AS subject, count(ce.id) AS students
  FROM "classTeachers" ct
  JOIN "classSubjects" cs ON cs.id = ct."classSubjectId"
  JOIN classes c ON c.id = cs."classId"
  JOIN subjects s ON s.id = cs."subjectId"
  LEFT JOIN "classEnrollments" ce ON ce."classId" = c.id AND ce.status = 'ativo'
  JOIN teachers t ON t.id = ct."teacherId"
  WHERE t."userId" = p_user_id
  GROUP BY c.id, c.name, s.name;
$$;

-- ── get_teacher_class_grades ─────────────────────────────────
-- Retorna notas da turma para um professor

CREATE OR REPLACE FUNCTION get_teacher_class_grades(
  p_user_id INTEGER,
  p_class_id INTEGER
)
RETURNS TABLE(
  assessmentId INTEGER,
  assessmentTitle VARCHAR,
  studentId INTEGER,
  studentName VARCHAR,
  grade NUMERIC,
  assessmentDate DATE
)
LANGUAGE sql STABLE
AS $$
  SELECT a.id AS "assessmentId", a.title AS "assessmentTitle",
         st.id AS "studentId", st.name AS "studentName",
         ascore.score AS grade, a."assessmentDate"
  FROM "assessmentScores" ascore
  JOIN assessments a ON a.id = ascore."assessmentId"
  JOIN "classSubjects" cs ON cs.id = a."classSubjectId"
  JOIN "classTeachers" ct ON ct."classSubjectId" = cs.id
  JOIN teachers t ON t.id = ct."teacherId"
  JOIN students st ON st.id = ascore."studentId"
  WHERE t."userId" = p_user_id
    AND cs."classId" = p_class_id;
$$;

-- ── get_student_attendance_stats ─────────────────────────────
-- Retorna totais de presença/falta e breakdown por disciplina

CREATE OR REPLACE FUNCTION get_student_attendance_stats(p_user_id INTEGER)
RETURNS JSONB
LANGUAGE sql STABLE
AS $$
  SELECT jsonb_build_object(
    'total', COALESCE(SUM(CASE WHEN ar.status IN ('present','absent','justified') THEN 1 ELSE 0 END), 0),
    'presents', COALESCE(SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END), 0),
    'absents', COALESCE(SUM(CASE WHEN ar.status = 'absent' THEN 1 ELSE 0 END), 0),
    'justified', COALESCE(SUM(CASE WHEN ar.status = 'justified' THEN 1 ELSE 0 END), 0),
    'pct', CASE WHEN COUNT(ar.id) > 0
      THEN ROUND(SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END)::numeric / COUNT(ar.id)::numeric * 100)
      ELSE 100 END,
    'bySubject', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'subjectId', sub.id,
        'subject', sub.name,
        'classes', sub.total_classes,
        'absences', sub.total_absences,
        'pct', CASE WHEN sub.total_classes > 0
          THEN ROUND((sub.total_classes - sub.total_absences)::numeric / sub.total_classes::numeric * 100)
          ELSE 100 END
      ))
      FROM (
        SELECT s.id, s.name,
               COUNT(ar2.id) AS total_classes,
               SUM(CASE WHEN ar2.status = 'absent' THEN 1 ELSE 0 END) AS total_absences
        FROM "attendanceRecords" ar2
        JOIN "classSessions" cs2 ON cs2.id = ar2."classSessionId"
        JOIN "classSubjects" csu2 ON csu2.id = cs2."classSubjectId"
        JOIN subjects s ON s.id = csu2."subjectId"
        JOIN students st2 ON st2.id = ar2."studentId"
        WHERE st2."userId" = p_user_id
        GROUP BY s.id, s.name
      ) sub),
      '[]'::jsonb
    )
  )
  FROM "attendanceRecords" ar
  JOIN students st ON st.id = ar."studentId"
  WHERE st."userId" = p_user_id;
$$;

-- ── get_student_class_info ───────────────────────────────────
-- Retorna turma atual do aluno

CREATE OR REPLACE FUNCTION get_student_class_info(p_user_id INTEGER)
RETURNS TABLE(
  classId INTEGER,
  className VARCHAR,
  classCode VARCHAR,
  schoolYear VARCHAR,
  shift VARCHAR,
  course VARCHAR
)
LANGUAGE sql STABLE
AS $$
  SELECT c.id AS "classId", c.name AS "className",
         COALESCE(c.name, '') AS "classCode",
         COALESCE(sy.name, '') AS "schoolYear",
         c.shift, c.course
  FROM students st
  JOIN "classEnrollments" ce ON ce."studentId" = st.id AND ce.status = 'ativo'
  JOIN classes c ON c.id = ce."classId"
  LEFT JOIN "schoolYears" sy ON sy.id = c."schoolYearId"
  WHERE st."userId" = p_user_id
  LIMIT 1;
$$;

-- ── get_student_grades ───────────────────────────────────────
-- Retorna notas do aluno por disciplina e data

CREATE OR REPLACE FUNCTION get_student_grades(p_user_id INTEGER)
RETURNS TABLE(
  subject VARCHAR,
  grade NUMERIC,
  date DATE
)
LANGUAGE sql STABLE
AS $$
  SELECT s.name AS subject, ascore.score AS grade, a."assessmentDate" AS date
  FROM "assessmentScores" ascore
  JOIN assessments a ON a.id = ascore."assessmentId"
  JOIN "classSubjects" cs ON cs.id = a."classSubjectId"
  JOIN subjects s ON s.id = cs."subjectId"
  JOIN students st ON st.id = ascore."studentId"
  WHERE st."userId" = p_user_id
  ORDER BY a."assessmentDate" DESC;
$$;

-- ── get_student_communications ───────────────────────────────
-- Retorna comunicados do aluno (diretos + escola)

CREATE OR REPLACE FUNCTION get_student_communications(p_user_id INTEGER)
RETURNS TABLE(
  id INTEGER,
  title VARCHAR,
  body TEXT,
  type VARCHAR,
  "createdAt" TIMESTAMPTZ
)
LANGUAGE sql STABLE
AS $$
  SELECT DISTINCT co.id, co.title, co.body, co."communicationType" AS type, co."createdAt"
  FROM students st
  LEFT JOIN "communicationRecipients" cr
    ON cr."recipientType" = 'student' AND cr."recipientRefId" = st.id
  JOIN communications co ON co.id = cr."communicationId"
  WHERE st."userId" = p_user_id

  UNION

  SELECT DISTINCT co2.id, co2.title, co2.body, co2."communicationType" AS type, co2."createdAt"
  FROM students st2
  JOIN communications co2 ON co2."schoolId" = st2."schoolId"
  WHERE st2."userId" = p_user_id

  ORDER BY "createdAt" DESC;
$$;

-- ── get_guardian_students ────────────────────────────────────
-- Retorna alunos do responsável com média de notas

CREATE OR REPLACE FUNCTION get_guardian_students(p_user_id INTEGER)
RETURNS TABLE(
  id INTEGER,
  name VARCHAR,
  grade VARCHAR,
  averageGrade NUMERIC
)
LANGUAGE sql STABLE
AS $$
  SELECT st.id, st.name, st.grade,
    ROUND(COALESCE(AVG(ascore.score), 0), 2) AS "averageGrade"
  FROM guardians g
  JOIN "studentGuardians" sg ON sg."guardianId" = g.id
  JOIN students st ON st.id = sg."studentId"
  LEFT JOIN "assessmentScores" ascore ON ascore."studentId" = st.id
  WHERE g."userId" = p_user_id
  GROUP BY st.id, st.name, st.grade;
$$;

-- ── get_guardian_student_performance ─────────────────────────
-- Retorna desempenho detalhado de um aluno para o responsável

CREATE OR REPLACE FUNCTION get_guardian_student_performance(
  p_user_id INTEGER,
  p_student_id INTEGER
)
RETURNS JSONB
LANGUAGE sql STABLE
AS $$
  SELECT jsonb_build_object(
    'studentId', p_student_id,
    'grades', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'subject', s.name,
            'grade', ascore.score,
            'date', a."assessmentDate"
          )
          ORDER BY a."assessmentDate" DESC
        )
        FROM "assessmentScores" ascore
        JOIN assessments a ON a.id = ascore."assessmentId"
        JOIN "classSubjects" cs ON cs.id = a."classSubjectId"
        JOIN subjects s ON s.id = cs."subjectId"
        WHERE ascore."studentId" = p_student_id
      ),
      '[]'::jsonb
    ),
    'absences', COALESCE(
      (
        SELECT count(*)
        FROM "attendanceRecords" ar
        WHERE ar."studentId" = p_student_id
          AND ar.status = 'absent'
      ),
      0
    ),
    'alerts', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'text',
            CASE
              WHEN t.name IS NOT NULL
                THEN sc.category || ': ' || sc.content || ' (' || t.name || ')'
              ELSE sc.category || ': ' || sc.content
            END,
            'createdAt', sc."createdAt"
          )
          ORDER BY sc."createdAt" DESC
        )
        FROM "studentComments" sc
        LEFT JOIN teachers t ON t.id = sc."teacherId"
        WHERE sc."studentId" = p_student_id
          AND sc.category IN ('ocorrencia', 'melhoria')
      ),
      '[]'::jsonb
    )
  )
  FROM guardians g
  JOIN "studentGuardians" sg ON sg."guardianId" = g.id
  WHERE g."userId" = p_user_id
    AND sg."studentId" = p_student_id
  LIMIT 1;
$$;

-- ── get_comments_by_teacher ──────────────────────────────────
-- Retorna comentários feitos por um professor

CREATE OR REPLACE FUNCTION get_comments_by_teacher(p_teacher_id INTEGER)
RETURNS TABLE(
  id INTEGER,
  category VARCHAR,
  content TEXT,
  "createdAt" TIMESTAMPTZ,
  author VARCHAR,
  "studentName" VARCHAR
)
LANGUAGE sql STABLE
AS $$
  SELECT sc.id, sc.category, sc.content, sc."createdAt",
         t.name AS author, st.name AS "studentName"
  FROM "studentComments" sc
  LEFT JOIN teachers t ON t.id = sc."teacherId"
  LEFT JOIN students st ON st.id = sc."studentId"
  WHERE sc."teacherId" = p_teacher_id
  ORDER BY sc."createdAt" DESC;
$$;

-- ── get_student_upcoming_events ──────────────────────────────
-- Retorna próximos eventos do aluno

CREATE OR REPLACE FUNCTION get_student_upcoming_events(p_user_id INTEGER)
RETURNS TABLE(
  id INTEGER,
  title VARCHAR,
  "eventType" VARCHAR,
  "eventDate" VARCHAR,
  description TEXT
)
LANGUAGE sql STABLE
AS $$
  SELECT se.id, se.title, se."eventType",
         TO_CHAR(se."startsAt"::date, 'YYYY-MM-DD') AS "eventDate",
         se.description
  FROM students st
  JOIN "schoolEvents" se ON se."schoolId" = st."schoolId"
  WHERE st."userId" = p_user_id
    AND se."startsAt"::date >= CURRENT_DATE
  ORDER BY se."startsAt"
  LIMIT 10;
$$;

-- ── get_student_next_exam ────────────────────────────────────
-- Retorna a próxima prova do aluno

CREATE OR REPLACE FUNCTION get_student_next_exam(p_user_id INTEGER)
RETURNS TABLE(
  subject VARCHAR,
  date DATE
)
LANGUAGE sql STABLE
AS $$
  SELECT s.name AS subject, a."assessmentDate" AS date
  FROM students st
  JOIN "classEnrollments" ce ON ce."studentId" = st.id AND ce.status = 'ativo'
  JOIN "classSubjects" cs ON cs."classId" = ce."classId"
  JOIN assessments a ON a."classSubjectId" = cs.id
  JOIN subjects s ON s.id = cs."subjectId"
  WHERE st."userId" = p_user_id
    AND a."assessmentDate" >= CURRENT_DATE
  ORDER BY a."assessmentDate"
  LIMIT 1;
$$;
