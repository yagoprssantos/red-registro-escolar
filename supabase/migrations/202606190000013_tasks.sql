-- tasks: trabalhos e atividades atribuídos pelo professor
CREATE TABLE IF NOT EXISTS tasks (
  id            BIGSERIAL PRIMARY KEY,
  "classSubjectId" BIGINT NOT NULL REFERENCES "classSubjects"(id) ON DELETE CASCADE,
  "teacherId"   BIGINT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  "taskType"    TEXT NOT NULL CHECK ("taskType" IN ('trabalho', 'atividade')),
  "dueDate"     DATE NOT NULL,
  "maxScore"    NUMERIC(5,2) NOT NULL DEFAULT 10,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- taskSubmissions: respostas dos alunos às tasks
CREATE TABLE IF NOT EXISTS "taskSubmissions" (
  id            BIGSERIAL PRIMARY KEY,
  "taskId"      BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  "studentId"   BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  answer        TEXT,
  "fileUrl"     TEXT,
  score         NUMERIC(5,2),
  feedback      TEXT,
  "submittedAt" TIMESTAMPTZ,
  "gradedAt"    TIMESTAMPTZ,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("taskId", "studentId")
);

CREATE INDEX IF NOT EXISTS idx_tasks_class_subject ON tasks("classSubjectId");
CREATE INDEX IF NOT EXISTS idx_task_submissions_task ON "taskSubmissions"("taskId");
CREATE INDEX IF NOT EXISTS idx_task_submissions_student ON "taskSubmissions"("studentId");
