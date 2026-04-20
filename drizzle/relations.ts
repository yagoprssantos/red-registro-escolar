import { relations } from "drizzle-orm";
import {
  assessments,
  assessmentScores,
  attendanceRecords,
  classEnrollments,
  classes,
  classSessions,
  classSubjects,
  classTeachers,
  communicationRecipients,
  communications,
  contacts,
  eventTargets,
  guardians,
  notifications,
  schoolEvents,
  schools,
  schoolStaffProfiles,
  schoolYears,
  studentComments,
  studentGuardians,
  students,
  subjects,
  teachers,
  users,
  userSchools,
} from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  userSchools: many(userSchools),
  teachers: many(teachers),
  students: many(students),
  guardians: many(guardians),
  staffProfiles: many(schoolStaffProfiles),
  notifications: many(notifications),
  schoolEvents: many(schoolEvents),
  communications: many(communications),
}));

export const schoolsRelations = relations(schools, ({ many }) => ({
  userSchools: many(userSchools),
  schoolYears: many(schoolYears),
  staffProfiles: many(schoolStaffProfiles),
  teachers: many(teachers),
  students: many(students),
  guardians: many(guardians),
  subjects: many(subjects),
  classes: many(classes),
  contacts: many(contacts),
  studentComments: many(studentComments),
  schoolEvents: many(schoolEvents),
  communications: many(communications),
}));

export const schoolYearsRelations = relations(schoolYears, ({ one, many }) => ({
  school: one(schools, {
    fields: [schoolYears.schoolId],
    references: [schools.id],
  }),
  classes: many(classes),
}));

export const userSchoolsRelations = relations(userSchools, ({ one }) => ({
  user: one(users, { fields: [userSchools.userId], references: [users.id] }),
  school: one(schools, {
    fields: [userSchools.schoolId],
    references: [schools.id],
  }),
}));

export const schoolStaffProfilesRelations = relations(
  schoolStaffProfiles,
  ({ one }) => ({
    user: one(users, {
      fields: [schoolStaffProfiles.userId],
      references: [users.id],
    }),
    school: one(schools, {
      fields: [schoolStaffProfiles.schoolId],
      references: [schools.id],
    }),
  })
);

export const teachersRelations = relations(teachers, ({ one, many }) => ({
  user: one(users, { fields: [teachers.userId], references: [users.id] }),
  school: one(schools, {
    fields: [teachers.schoolId],
    references: [schools.id],
  }),
  classTeachers: many(classTeachers),
  classSessions: many(classSessions),
  attendanceRecords: many(attendanceRecords),
  assessments: many(assessments),
  studentComments: many(studentComments),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  user: one(users, { fields: [students.userId], references: [users.id] }),
  school: one(schools, {
    fields: [students.schoolId],
    references: [schools.id],
  }),
  classEnrollments: many(classEnrollments),
  studentGuardians: many(studentGuardians),
  attendanceRecords: many(attendanceRecords),
  assessmentScores: many(assessmentScores),
  studentComments: many(studentComments),
}));

export const guardiansRelations = relations(guardians, ({ one, many }) => ({
  user: one(users, { fields: [guardians.userId], references: [users.id] }),
  school: one(schools, {
    fields: [guardians.schoolId],
    references: [schools.id],
  }),
  studentGuardians: many(studentGuardians),
}));

export const studentGuardiansRelations = relations(
  studentGuardians,
  ({ one }) => ({
    student: one(students, {
      fields: [studentGuardians.studentId],
      references: [students.id],
    }),
    guardian: one(guardians, {
      fields: [studentGuardians.guardianId],
      references: [guardians.id],
    }),
  })
);

export const contactsRelations = relations(contacts, ({ one }) => ({
  school: one(schools, {
    fields: [contacts.schoolId],
    references: [schools.id],
  }),
}));

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  school: one(schools, {
    fields: [subjects.schoolId],
    references: [schools.id],
  }),
  classSubjects: many(classSubjects),
}));

export const classesRelations = relations(classes, ({ one, many }) => ({
  school: one(schools, {
    fields: [classes.schoolId],
    references: [schools.id],
  }),
  schoolYear: one(schoolYears, {
    fields: [classes.schoolYearId],
    references: [schoolYears.id],
  }),
  classSubjects: many(classSubjects),
  classEnrollments: many(classEnrollments),
}));

export const classSubjectsRelations = relations(
  classSubjects,
  ({ one, many }) => ({
    class: one(classes, {
      fields: [classSubjects.classId],
      references: [classes.id],
    }),
    subject: one(subjects, {
      fields: [classSubjects.subjectId],
      references: [subjects.id],
    }),
    classTeachers: many(classTeachers),
    classSessions: many(classSessions),
    assessments: many(assessments),
    studentComments: many(studentComments),
  })
);

export const classTeachersRelations = relations(classTeachers, ({ one }) => ({
  classSubject: one(classSubjects, {
    fields: [classTeachers.classSubjectId],
    references: [classSubjects.id],
  }),
  teacher: one(teachers, {
    fields: [classTeachers.teacherId],
    references: [teachers.id],
  }),
}));

export const classEnrollmentsRelations = relations(
  classEnrollments,
  ({ one }) => ({
    class: one(classes, {
      fields: [classEnrollments.classId],
      references: [classes.id],
    }),
    student: one(students, {
      fields: [classEnrollments.studentId],
      references: [students.id],
    }),
  })
);

export const classSessionsRelations = relations(
  classSessions,
  ({ one, many }) => ({
    classSubject: one(classSubjects, {
      fields: [classSessions.classSubjectId],
      references: [classSubjects.id],
    }),
    teacher: one(teachers, {
      fields: [classSessions.teacherId],
      references: [teachers.id],
    }),
    attendanceRecords: many(attendanceRecords),
  })
);

export const attendanceRecordsRelations = relations(
  attendanceRecords,
  ({ one }) => ({
    classSession: one(classSessions, {
      fields: [attendanceRecords.classSessionId],
      references: [classSessions.id],
    }),
    student: one(students, {
      fields: [attendanceRecords.studentId],
      references: [students.id],
    }),
    recordedByTeacher: one(teachers, {
      fields: [attendanceRecords.recordedByTeacherId],
      references: [teachers.id],
    }),
  })
);

export const assessmentsRelations = relations(assessments, ({ one, many }) => ({
  classSubject: one(classSubjects, {
    fields: [assessments.classSubjectId],
    references: [classSubjects.id],
  }),
  teacher: one(teachers, {
    fields: [assessments.teacherId],
    references: [teachers.id],
  }),
  scores: many(assessmentScores),
}));

export const assessmentScoresRelations = relations(
  assessmentScores,
  ({ one }) => ({
    assessment: one(assessments, {
      fields: [assessmentScores.assessmentId],
      references: [assessments.id],
    }),
    student: one(students, {
      fields: [assessmentScores.studentId],
      references: [students.id],
    }),
  })
);

export const studentCommentsRelations = relations(
  studentComments,
  ({ one }) => ({
    school: one(schools, {
      fields: [studentComments.schoolId],
      references: [schools.id],
    }),
    student: one(students, {
      fields: [studentComments.studentId],
      references: [students.id],
    }),
    teacher: one(teachers, {
      fields: [studentComments.teacherId],
      references: [teachers.id],
    }),
    classSubject: one(classSubjects, {
      fields: [studentComments.classSubjectId],
      references: [classSubjects.id],
    }),
  })
);

export const schoolEventsRelations = relations(
  schoolEvents,
  ({ one, many }) => ({
    school: one(schools, {
      fields: [schoolEvents.schoolId],
      references: [schools.id],
    }),
    createdBy: one(users, {
      fields: [schoolEvents.createdByUserId],
      references: [users.id],
    }),
    eventTargets: many(eventTargets),
    communications: many(communications),
  })
);

export const eventTargetsRelations = relations(eventTargets, ({ one }) => ({
  event: one(schoolEvents, {
    fields: [eventTargets.eventId],
    references: [schoolEvents.id],
  }),
}));

export const communicationsRelations = relations(
  communications,
  ({ one, many }) => ({
    school: one(schools, {
      fields: [communications.schoolId],
      references: [schools.id],
    }),
    author: one(users, {
      fields: [communications.authorUserId],
      references: [users.id],
    }),
    relatedEvent: one(schoolEvents, {
      fields: [communications.relatedEventId],
      references: [schoolEvents.id],
    }),
    recipients: many(communicationRecipients),
  })
);

export const communicationRecipientsRelations = relations(
  communicationRecipients,
  ({ one }) => ({
    communication: one(communications, {
      fields: [communicationRecipients.communicationId],
      references: [communications.id],
    }),
  })
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));
