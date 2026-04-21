import { config as loadDotenv } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../../../drizzle/schema";
import { clearFakeData, fakeSeedMeta } from "./fakeData";

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
      "DATABASE_URL nao configurada. Defina a variavel de ambiente antes de limpar os dados fake."
    );
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sao obrigatorias para limpar contas fake no Supabase Auth."
    );
  }

  const client = postgres(databaseUrl, { ssl: "require" });
  const db = drizzle(client, { schema });

  try {
    const result = await clearFakeData(db, {
      supabase: {
        url: supabaseUrl,
        serviceRoleKey: supabaseServiceRoleKey,
      },
    });

    console.log("[db:clear:fake] Limpeza concluida com sucesso.");
    console.log(
      `[db:clear:fake] Escolas removidas: ${result.removedSchools}; usuarios removidos: ${result.removedUsers}; contas Supabase Auth removidas: ${result.removedSupabaseAuthUsers}`
    );
    console.log(
      `[db:clear:fake] Marcadores usados: dominio=${fakeSeedMeta.domain}, openIdPrefix=${fakeSeedMeta.openIdPrefix}, schoolNamePrefix=${fakeSeedMeta.schoolNamePrefix}, supabaseMarker=${fakeSeedMeta.supabaseMarker}`
    );
  } finally {
    await client.end({ timeout: 5 });
  }
}

main().catch(error => {
  console.error("[db:clear:fake] Falha ao limpar dados fake:", error);
  process.exitCode = 1;
});
