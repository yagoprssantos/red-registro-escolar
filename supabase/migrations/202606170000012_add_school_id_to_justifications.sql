-- Add schoolId to absenceJustifications for efficient school-level queries
ALTER TABLE "absenceJustifications"
  ADD COLUMN IF NOT EXISTS "schoolId" INTEGER REFERENCES schools (id) ON DELETE CASCADE;

-- Backfill existing rows via attendance → session → classSubject → class chain
UPDATE "absenceJustifications" aj
SET "schoolId" = c."schoolId"
FROM "attendanceRecords" ar
JOIN "classSessions"  cs    ON cs.id    = ar."classSessionId"
JOIN "classSubjects"  csubj ON csubj.id = cs."classSubjectId"
JOIN classes          c     ON c.id     = csubj."classId"
WHERE aj."attendanceRecordId" = ar.id
  AND aj."schoolId" IS NULL;

CREATE INDEX IF NOT EXISTS absence_justifications_school_id_idx
  ON "absenceJustifications" ("schoolId");
