CREATE TABLE "assessmentScores" (
	"id" serial PRIMARY KEY NOT NULL,
	"assessmentId" integer NOT NULL,
	"studentId" integer NOT NULL,
	"score" numeric(5, 2) NOT NULL,
	"feedback" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"classSubjectId" integer NOT NULL,
	"teacherId" integer,
	"title" varchar(255) NOT NULL,
	"description" text,
	"maxScore" numeric(5, 2) DEFAULT '10.00' NOT NULL,
	"weight" numeric(5, 2) DEFAULT '1.00' NOT NULL,
	"assessmentDate" date NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" serial PRIMARY KEY NOT NULL,
	"ownerType" varchar(64) NOT NULL,
	"ownerId" integer NOT NULL,
	"fileUrl" varchar(2048) NOT NULL,
	"fileName" varchar(255) NOT NULL,
	"mimeType" varchar(128),
	"sizeBytes" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendanceRecords" (
	"id" serial PRIMARY KEY NOT NULL,
	"classSessionId" integer NOT NULL,
	"studentId" integer NOT NULL,
	"status" varchar(64) DEFAULT 'present' NOT NULL,
	"reason" text,
	"recordedByTeacherId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "classEnrollments" (
	"id" serial PRIMARY KEY NOT NULL,
	"classId" integer NOT NULL,
	"studentId" integer NOT NULL,
	"enrollmentDate" date NOT NULL,
	"status" varchar(64) DEFAULT 'ativo' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "classSessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"classSubjectId" integer NOT NULL,
	"teacherId" integer,
	"lessonDate" date NOT NULL,
	"lessonNumber" integer DEFAULT 1 NOT NULL,
	"topic" varchar(255),
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "classSubjects" (
	"id" serial PRIMARY KEY NOT NULL,
	"classId" integer NOT NULL,
	"subjectId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "classTeachers" (
	"id" serial PRIMARY KEY NOT NULL,
	"classSubjectId" integer NOT NULL,
	"teacherId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "classes" (
	"id" serial PRIMARY KEY NOT NULL,
	"schoolId" integer NOT NULL,
	"schoolYearId" integer NOT NULL,
	"name" varchar(80) NOT NULL,
	"gradeLabel" varchar(50) NOT NULL,
	"shift" varchar(64) DEFAULT 'morning' NOT NULL,
	"status" varchar(64) DEFAULT 'ativo' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "communicationRecipients" (
	"id" serial PRIMARY KEY NOT NULL,
	"communicationId" integer NOT NULL,
	"recipientType" varchar(64) NOT NULL,
	"recipientRefId" integer NOT NULL,
	"readAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "communications" (
	"id" serial PRIMARY KEY NOT NULL,
	"schoolId" integer NOT NULL,
	"authorUserId" integer,
	"title" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"communicationType" varchar(64) DEFAULT 'announcement' NOT NULL,
	"relatedEventId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"schoolId" integer,
	"name" varchar(255) NOT NULL,
	"email" varchar(320) NOT NULL,
	"school" varchar(255) NOT NULL,
	"role" varchar(100) NOT NULL,
	"students" varchar(50),
	"message" text,
	"status" varchar(64) DEFAULT 'novo' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "eventTargets" (
	"id" serial PRIMARY KEY NOT NULL,
	"eventId" integer NOT NULL,
	"targetType" varchar(64) NOT NULL,
	"targetRefId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guardians" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer,
	"schoolId" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(320) NOT NULL,
	"phone" varchar(20),
	"relationship" varchar(50),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"notificationType" varchar(64) DEFAULT 'general' NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"actionUrl" varchar(2048),
	"isRead" integer DEFAULT 0 NOT NULL,
	"readAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schoolEvents" (
	"id" serial PRIMARY KEY NOT NULL,
	"schoolId" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"eventType" varchar(64) DEFAULT 'evento_escolar' NOT NULL,
	"startsAt" timestamp NOT NULL,
	"endsAt" timestamp,
	"createdByUserId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schoolStaffProfiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"schoolId" integer NOT NULL,
	"role" varchar(64) NOT NULL,
	"positionTitle" varchar(120),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schoolYears" (
	"id" serial PRIMARY KEY NOT NULL,
	"schoolId" integer NOT NULL,
	"name" varchar(30) NOT NULL,
	"startDate" date NOT NULL,
	"endDate" date NOT NULL,
	"isCurrent" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schools" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(320) NOT NULL,
	"phone" varchar(20),
	"address" text,
	"city" varchar(100),
	"state" varchar(2),
	"zipCode" varchar(10),
	"studentCount" integer,
	"status" varchar(64) DEFAULT 'trial' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "schools_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "studentComments" (
	"id" serial PRIMARY KEY NOT NULL,
	"schoolId" integer NOT NULL,
	"studentId" integer NOT NULL,
	"teacherId" integer,
	"classSubjectId" integer,
	"category" varchar(64) DEFAULT 'comentario' NOT NULL,
	"visibility" varchar(64) DEFAULT 'all' NOT NULL,
	"content" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studentGuardians" (
	"id" serial PRIMARY KEY NOT NULL,
	"studentId" integer NOT NULL,
	"guardianId" integer NOT NULL,
	"relationship" varchar(50),
	"isPrimary" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer,
	"schoolId" integer NOT NULL,
	"enrollmentNumber" varchar(64),
	"name" varchar(255) NOT NULL,
	"email" varchar(320),
	"phone" varchar(20),
	"dateOfBirth" date,
	"grade" varchar(50),
	"status" varchar(64) DEFAULT 'ativo' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" serial PRIMARY KEY NOT NULL,
	"schoolId" integer NOT NULL,
	"name" varchar(120) NOT NULL,
	"code" varchar(30),
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teachers" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"schoolId" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(320) NOT NULL,
	"phone" varchar(20),
	"subject" varchar(100),
	"active" integer DEFAULT 1 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "userSchools" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"schoolId" integer NOT NULL,
	"role" varchar(64) DEFAULT 'coordinator' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" varchar(64) DEFAULT 'user' NOT NULL,
	"defaultProfile" varchar(64),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
ALTER TABLE "assessmentScores" ADD CONSTRAINT "assessmentScores_assessmentId_assessments_id_fk" FOREIGN KEY ("assessmentId") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessmentScores" ADD CONSTRAINT "assessmentScores_studentId_students_id_fk" FOREIGN KEY ("studentId") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_classSubjectId_classSubjects_id_fk" FOREIGN KEY ("classSubjectId") REFERENCES "public"."classSubjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_teacherId_teachers_id_fk" FOREIGN KEY ("teacherId") REFERENCES "public"."teachers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendanceRecords" ADD CONSTRAINT "attendanceRecords_classSessionId_classSessions_id_fk" FOREIGN KEY ("classSessionId") REFERENCES "public"."classSessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendanceRecords" ADD CONSTRAINT "attendanceRecords_studentId_students_id_fk" FOREIGN KEY ("studentId") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendanceRecords" ADD CONSTRAINT "attendanceRecords_recordedByTeacherId_teachers_id_fk" FOREIGN KEY ("recordedByTeacherId") REFERENCES "public"."teachers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classEnrollments" ADD CONSTRAINT "classEnrollments_classId_classes_id_fk" FOREIGN KEY ("classId") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classEnrollments" ADD CONSTRAINT "classEnrollments_studentId_students_id_fk" FOREIGN KEY ("studentId") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classSessions" ADD CONSTRAINT "classSessions_classSubjectId_classSubjects_id_fk" FOREIGN KEY ("classSubjectId") REFERENCES "public"."classSubjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classSessions" ADD CONSTRAINT "classSessions_teacherId_teachers_id_fk" FOREIGN KEY ("teacherId") REFERENCES "public"."teachers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classSubjects" ADD CONSTRAINT "classSubjects_classId_classes_id_fk" FOREIGN KEY ("classId") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classSubjects" ADD CONSTRAINT "classSubjects_subjectId_subjects_id_fk" FOREIGN KEY ("subjectId") REFERENCES "public"."subjects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classTeachers" ADD CONSTRAINT "classTeachers_classSubjectId_classSubjects_id_fk" FOREIGN KEY ("classSubjectId") REFERENCES "public"."classSubjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classTeachers" ADD CONSTRAINT "classTeachers_teacherId_teachers_id_fk" FOREIGN KEY ("teacherId") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_schoolId_schools_id_fk" FOREIGN KEY ("schoolId") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_schoolYearId_schoolYears_id_fk" FOREIGN KEY ("schoolYearId") REFERENCES "public"."schoolYears"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communicationRecipients" ADD CONSTRAINT "communicationRecipients_communicationId_communications_id_fk" FOREIGN KEY ("communicationId") REFERENCES "public"."communications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communications" ADD CONSTRAINT "communications_schoolId_schools_id_fk" FOREIGN KEY ("schoolId") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communications" ADD CONSTRAINT "communications_authorUserId_users_id_fk" FOREIGN KEY ("authorUserId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communications" ADD CONSTRAINT "communications_relatedEventId_schoolEvents_id_fk" FOREIGN KEY ("relatedEventId") REFERENCES "public"."schoolEvents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_schoolId_schools_id_fk" FOREIGN KEY ("schoolId") REFERENCES "public"."schools"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eventTargets" ADD CONSTRAINT "eventTargets_eventId_schoolEvents_id_fk" FOREIGN KEY ("eventId") REFERENCES "public"."schoolEvents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardians" ADD CONSTRAINT "guardians_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardians" ADD CONSTRAINT "guardians_schoolId_schools_id_fk" FOREIGN KEY ("schoolId") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schoolEvents" ADD CONSTRAINT "schoolEvents_schoolId_schools_id_fk" FOREIGN KEY ("schoolId") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schoolEvents" ADD CONSTRAINT "schoolEvents_createdByUserId_users_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schoolStaffProfiles" ADD CONSTRAINT "schoolStaffProfiles_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schoolStaffProfiles" ADD CONSTRAINT "schoolStaffProfiles_schoolId_schools_id_fk" FOREIGN KEY ("schoolId") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schoolYears" ADD CONSTRAINT "schoolYears_schoolId_schools_id_fk" FOREIGN KEY ("schoolId") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studentComments" ADD CONSTRAINT "studentComments_schoolId_schools_id_fk" FOREIGN KEY ("schoolId") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studentComments" ADD CONSTRAINT "studentComments_studentId_students_id_fk" FOREIGN KEY ("studentId") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studentComments" ADD CONSTRAINT "studentComments_teacherId_teachers_id_fk" FOREIGN KEY ("teacherId") REFERENCES "public"."teachers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studentComments" ADD CONSTRAINT "studentComments_classSubjectId_classSubjects_id_fk" FOREIGN KEY ("classSubjectId") REFERENCES "public"."classSubjects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studentGuardians" ADD CONSTRAINT "studentGuardians_studentId_students_id_fk" FOREIGN KEY ("studentId") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studentGuardians" ADD CONSTRAINT "studentGuardians_guardianId_guardians_id_fk" FOREIGN KEY ("guardianId") REFERENCES "public"."guardians"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_schoolId_schools_id_fk" FOREIGN KEY ("schoolId") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_schoolId_schools_id_fk" FOREIGN KEY ("schoolId") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_schoolId_schools_id_fk" FOREIGN KEY ("schoolId") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userSchools" ADD CONSTRAINT "userSchools_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userSchools" ADD CONSTRAINT "userSchools_schoolId_schools_id_fk" FOREIGN KEY ("schoolId") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "assessmentScores_assessment_student_uq" ON "assessmentScores" USING btree ("assessmentId","studentId");--> statement-breakpoint
CREATE INDEX "assessmentScores_student_idx" ON "assessmentScores" USING btree ("studentId");--> statement-breakpoint
CREATE INDEX "assessments_classSubject_idx" ON "assessments" USING btree ("classSubjectId");--> statement-breakpoint
CREATE INDEX "assessments_date_idx" ON "assessments" USING btree ("assessmentDate");--> statement-breakpoint
CREATE INDEX "attachments_owner_idx" ON "attachments" USING btree ("ownerType","ownerId");--> statement-breakpoint
CREATE UNIQUE INDEX "attendanceRecords_session_student_uq" ON "attendanceRecords" USING btree ("classSessionId","studentId");--> statement-breakpoint
CREATE INDEX "attendanceRecords_student_idx" ON "attendanceRecords" USING btree ("studentId");--> statement-breakpoint
CREATE INDEX "attendanceRecords_status_idx" ON "attendanceRecords" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "classEnrollments_class_student_uq" ON "classEnrollments" USING btree ("classId","studentId");--> statement-breakpoint
CREATE INDEX "classEnrollments_student_idx" ON "classEnrollments" USING btree ("studentId");--> statement-breakpoint
CREATE UNIQUE INDEX "classSessions_slot_uq" ON "classSessions" USING btree ("classSubjectId","lessonDate","lessonNumber");--> statement-breakpoint
CREATE INDEX "classSessions_date_idx" ON "classSessions" USING btree ("lessonDate");--> statement-breakpoint
CREATE UNIQUE INDEX "classSubjects_class_subject_uq" ON "classSubjects" USING btree ("classId","subjectId");--> statement-breakpoint
CREATE INDEX "classSubjects_class_idx" ON "classSubjects" USING btree ("classId");--> statement-breakpoint
CREATE INDEX "classSubjects_subject_idx" ON "classSubjects" USING btree ("subjectId");--> statement-breakpoint
CREATE UNIQUE INDEX "classTeachers_classSubject_teacher_uq" ON "classTeachers" USING btree ("classSubjectId","teacherId");--> statement-breakpoint
CREATE INDEX "classTeachers_teacher_idx" ON "classTeachers" USING btree ("teacherId");--> statement-breakpoint
CREATE UNIQUE INDEX "classes_year_name_uq" ON "classes" USING btree ("schoolYearId","name");--> statement-breakpoint
CREATE INDEX "classes_school_idx" ON "classes" USING btree ("schoolId");--> statement-breakpoint
CREATE INDEX "classes_year_idx" ON "classes" USING btree ("schoolYearId");--> statement-breakpoint
CREATE UNIQUE INDEX "communicationRecipients_unique_uq" ON "communicationRecipients" USING btree ("communicationId","recipientType","recipientRefId");--> statement-breakpoint
CREATE INDEX "communicationRecipients_target_idx" ON "communicationRecipients" USING btree ("recipientType","recipientRefId");--> statement-breakpoint
CREATE INDEX "communications_school_idx" ON "communications" USING btree ("schoolId");--> statement-breakpoint
CREATE INDEX "communications_type_idx" ON "communications" USING btree ("communicationType");--> statement-breakpoint
CREATE INDEX "contacts_school_idx" ON "contacts" USING btree ("schoolId");--> statement-breakpoint
CREATE UNIQUE INDEX "eventTargets_unique_target_uq" ON "eventTargets" USING btree ("eventId","targetType","targetRefId");--> statement-breakpoint
CREATE INDEX "eventTargets_target_idx" ON "eventTargets" USING btree ("targetType","targetRefId");--> statement-breakpoint
CREATE UNIQUE INDEX "guardians_user_school_uq" ON "guardians" USING btree ("userId","schoolId");--> statement-breakpoint
CREATE INDEX "guardians_school_idx" ON "guardians" USING btree ("schoolId");--> statement-breakpoint
CREATE INDEX "guardians_email_idx" ON "guardians" USING btree ("email");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "notifications_read_idx" ON "notifications" USING btree ("userId","isRead");--> statement-breakpoint
CREATE INDEX "notifications_createdAt_idx" ON "notifications" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "schoolEvents_school_idx" ON "schoolEvents" USING btree ("schoolId");--> statement-breakpoint
CREATE INDEX "schoolEvents_startsAt_idx" ON "schoolEvents" USING btree ("startsAt");--> statement-breakpoint
CREATE UNIQUE INDEX "schoolStaffProfiles_user_school_role_uq" ON "schoolStaffProfiles" USING btree ("userId","schoolId","role");--> statement-breakpoint
CREATE INDEX "schoolStaffProfiles_school_idx" ON "schoolStaffProfiles" USING btree ("schoolId");--> statement-breakpoint
CREATE UNIQUE INDEX "schoolYears_school_name_uq" ON "schoolYears" USING btree ("schoolId","name");--> statement-breakpoint
CREATE INDEX "schoolYears_school_idx" ON "schoolYears" USING btree ("schoolId");--> statement-breakpoint
CREATE INDEX "schoolYears_current_idx" ON "schoolYears" USING btree ("schoolId","isCurrent");--> statement-breakpoint
CREATE INDEX "studentComments_school_idx" ON "studentComments" USING btree ("schoolId");--> statement-breakpoint
CREATE INDEX "studentComments_student_idx" ON "studentComments" USING btree ("studentId");--> statement-breakpoint
CREATE INDEX "studentComments_category_idx" ON "studentComments" USING btree ("category");--> statement-breakpoint
CREATE INDEX "studentComments_createdAt_idx" ON "studentComments" USING btree ("createdAt");--> statement-breakpoint
CREATE UNIQUE INDEX "studentGuardians_student_guardian_uq" ON "studentGuardians" USING btree ("studentId","guardianId");--> statement-breakpoint
CREATE INDEX "studentGuardians_student_idx" ON "studentGuardians" USING btree ("studentId");--> statement-breakpoint
CREATE INDEX "studentGuardians_guardian_idx" ON "studentGuardians" USING btree ("guardianId");--> statement-breakpoint
CREATE UNIQUE INDEX "students_user_school_uq" ON "students" USING btree ("userId","schoolId");--> statement-breakpoint
CREATE UNIQUE INDEX "students_school_enrollment_uq" ON "students" USING btree ("schoolId","enrollmentNumber");--> statement-breakpoint
CREATE INDEX "students_school_idx" ON "students" USING btree ("schoolId");--> statement-breakpoint
CREATE INDEX "students_status_idx" ON "students" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "subjects_school_name_uq" ON "subjects" USING btree ("schoolId","name");--> statement-breakpoint
CREATE UNIQUE INDEX "subjects_school_code_uq" ON "subjects" USING btree ("schoolId","code");--> statement-breakpoint
CREATE INDEX "subjects_school_idx" ON "subjects" USING btree ("schoolId");--> statement-breakpoint
CREATE UNIQUE INDEX "teachers_user_school_uq" ON "teachers" USING btree ("userId","schoolId");--> statement-breakpoint
CREATE INDEX "teachers_school_idx" ON "teachers" USING btree ("schoolId");--> statement-breakpoint
CREATE INDEX "teachers_email_idx" ON "teachers" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "userSchools_user_school_uq" ON "userSchools" USING btree ("userId","schoolId");--> statement-breakpoint
CREATE INDEX "userSchools_user_idx" ON "userSchools" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "userSchools_school_idx" ON "userSchools" USING btree ("schoolId");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");