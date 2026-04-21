import { config as loadDotenv } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../../../drizzle/schema";
import { fakeSeedMeta, seedFakeData } from "./fakeData";

loadDotenv();
if (!process.env.DATABASE_URL?.trim()) {
  loadDotenv({ path: ".env.supabase" });
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL nao configurada. Defina a variavel de ambiente antes de executar o seed fake."
    );
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sao obrigatorias para criar contas fake no Supabase Auth."
    );
  }

  const categoryPasswords = {
    school: process.env.SEED_PASSWORD_SCHOOL?.trim() || "Escola@123456",
    teacher: process.env.SEED_PASSWORD_TEACHER?.trim() || "Professor@123456",
    student: process.env.SEED_PASSWORD_STUDENT?.trim() || "Aluno@123456",
    guardian:
      process.env.SEED_PASSWORD_GUARDIAN?.trim() || "Responsavel@123456",
  } as const;

  const client = postgres(databaseUrl, { ssl: "require" });
  const db = drizzle(client, { schema });

  try {
    const result = await seedFakeData(db, {
      supabase: {
        url: supabaseUrl,
        serviceRoleKey: supabaseServiceRoleKey,
      },
      categoryPasswords,
    });

    console.log("[db:seed:fake] Seed concluido com sucesso.");
    console.log(
      `[db:seed:fake] Totais -> escolas=${result.totals.schools}, professores=${result.totals.teachers}, alunos=${result.totals.students}, responsaveis=${result.totals.guardians}`
    );
    console.log(
      `[db:seed:fake] Escolas IDs: ${result.schoolIds.join(", ")}; contas removidas no reset do Auth: ${result.removedSupabaseAuthUsersOnReset}`
    );
    console.log(
      `[db:seed:fake] Usuarios fake (${result.userEmails.length}): ${result.userEmails.join(", ")}`
    );
    console.log(
      `[db:seed:fake] Alunos fake (${result.studentNames.length}): ${result.studentNames.join(", ")}`
    );
    console.log(
      `[db:seed:fake] Marcadores de limpeza: dominio=${fakeSeedMeta.domain}, openIdPrefix=${fakeSeedMeta.openIdPrefix}`
    );

    const orderedCategories = [
      "school",
      "teacher",
      "student",
      "guardian",
    ] as const;
    for (const category of orderedCategories) {
      const label = fakeSeedMeta.categories[category];
      const rows = result.credentialsByCategory[category];
      console.log(`[db:seed:fake][credenciais][${label}] total=${rows.length}`);

      for (const row of rows) {
        console.log(
          `  - nome=${row.name} | email=${row.email} | senha=${row.password} | escola=${row.school}`
        );
      }
    }
  } finally {
    await client.end({ timeout: 5 });
  }
}

main().catch(error => {
  console.error("[db:seed:fake] Falha ao semear dados fake:", error);
  process.exitCode = 1;
});
