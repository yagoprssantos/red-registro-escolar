import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, contacts, InsertContact, Contact, schools, InsertSchool, School, userSchools, InsertUserSchool, UserSchool } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createContact(contact: InsertContact): Promise<Contact | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create contact: database not available");
    return null;
  }

  try {
    const result = await db.insert(contacts).values(contact);
    const id = result[0]?.insertId;
    if (!id) return null;
    
    const created = await db.select().from(contacts).where(eq(contacts.id, id as number)).limit(1);
    return created.length > 0 ? created[0] : null;
  } catch (error) {
    console.error("[Database] Failed to create contact:", error);
    throw error;
  }
}

export async function getContacts(limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get contacts: database not available");
    return [];
  }

  try {
    return await db.select().from(contacts).limit(limit).offset(offset);
  } catch (error) {
    console.error("[Database] Failed to get contacts:", error);
    throw error;
  }
}

export async function createSchool(school: InsertSchool): Promise<School | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create school: database not available");
    return null;
  }

  try {
    const result = await db.insert(schools).values(school);
    const id = result[0]?.insertId;
    if (!id) return null;
    
    const created = await db.select().from(schools).where(eq(schools.id, id as number)).limit(1);
    return created.length > 0 ? created[0] : null;
  } catch (error) {
    console.error("[Database] Failed to create school:", error);
    throw error;
  }
}

export async function getSchoolByEmail(email: string): Promise<School | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get school: database not available");
    return undefined;
  }

  try {
    const result = await db.select().from(schools).where(eq(schools.email, email)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to get school by email:", error);
    throw error;
  }
}

export async function getUserSchools(userId: number): Promise<(UserSchool & { school: School })[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user schools: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(userSchools)
      .innerJoin(schools, eq(userSchools.schoolId, schools.id))
      .where(eq(userSchools.userId, userId));
    
    return result.map(row => ({
      ...row.userSchools,
      school: row.schools,
    }));
  } catch (error) {
    console.error("[Database] Failed to get user schools:", error);
    throw error;
  }
}

export async function createUserSchool(userSchool: InsertUserSchool): Promise<UserSchool | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create user school: database not available");
    return null;
  }

  try {
    const result = await db.insert(userSchools).values(userSchool);
    const id = result[0]?.insertId;
    if (!id) return null;
    
    const created = await db.select().from(userSchools).where(eq(userSchools.id, id as number)).limit(1);
    return created.length > 0 ? created[0] : null;
  } catch (error) {
    console.error("[Database] Failed to create user school:", error);
    throw error;
  }
}

export async function getSchoolContacts(schoolId: number): Promise<Contact[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get school contacts: database not available");
    return [];
  }

  try {
    return await db.select().from(contacts).where(eq(contacts.schoolId, schoolId)).limit(100);
  } catch (error) {
    console.error("[Database] Failed to get school contacts:", error);
    throw error;
  }
}

// TODO: add feature queries here as your schema grows.
