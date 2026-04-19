import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** OAuth identifier (openId) returned from the callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Contatos recebidos através do formulário de demonstração
 */
export const contacts = mysqlTable("contacts", {
  id: int("id").autoincrement().primaryKey(),
  schoolId: int("schoolId"),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  school: varchar("school", { length: 255 }).notNull(),
  role: varchar("role", { length: 100 }).notNull(),
  students: varchar("students", { length: 50 }),
  message: text("message"),
  status: mysqlEnum("status", ["novo", "respondido", "descartado"])
    .default("novo")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;

/**
 * Escolas cadastradas na plataforma
 */
export const schools = mysqlTable("schools", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  zipCode: varchar("zipCode", { length: 10 }),
  studentCount: int("studentCount"),
  status: mysqlEnum("status", ["ativo", "inativo", "trial"])
    .default("trial")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type School = typeof schools.$inferSelect;
export type InsertSchool = typeof schools.$inferInsert;

/**
 * Associação entre usuários e escolas (um usuário pode gerenciar múltiplas escolas)
 */
export const userSchools = mysqlTable("userSchools", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  schoolId: int("schoolId").notNull(),
  role: mysqlEnum("role", ["admin", "director", "coordinator", "teacher"])
    .default("coordinator")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserSchool = typeof userSchools.$inferSelect;
export type InsertUserSchool = typeof userSchools.$inferInsert;

/**
 * Professores da plataforma
 */
export const teachers = mysqlTable("teachers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  schoolId: int("schoolId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  subject: varchar("subject", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Teacher = typeof teachers.$inferSelect;
export type InsertTeacher = typeof teachers.$inferInsert;

/**
 * Alunos da plataforma
 */
export const students = mysqlTable("students", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  schoolId: int("schoolId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  dateOfBirth: varchar("dateOfBirth", { length: 10 }),
  grade: varchar("grade", { length: 50 }),
  status: mysqlEnum("status", ["ativo", "inativo", "transferido"])
    .default("ativo")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Student = typeof students.$inferSelect;
export type InsertStudent = typeof students.$inferInsert;

/**
 * Responsáveis (pais/guardiões) dos alunos
 */
export const guardians = mysqlTable("guardians", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  schoolId: int("schoolId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  relationship: varchar("relationship", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Guardian = typeof guardians.$inferSelect;
export type InsertGuardian = typeof guardians.$inferInsert;

/**
 * Associação entre alunos e responsáveis
 */
export const studentGuardians = mysqlTable("studentGuardians", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  guardianId: int("guardianId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StudentGuardian = typeof studentGuardians.$inferSelect;
export type InsertStudentGuardian = typeof studentGuardians.$inferInsert;
