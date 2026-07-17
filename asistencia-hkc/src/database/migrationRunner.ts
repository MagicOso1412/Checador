import { getDatabase } from "./db";
// Import explícito a "./migrations/index" (y no "./migrations") a propósito:
// también existe un archivo legado "src/database/migrations.ts" (deprecado, ver
// ese archivo) y con el specifier corto "./migrations" Node/TypeScript resolvería
// ese archivo en vez de esta carpeta. La ruta explícita evita la ambigüedad.
import { migrations } from "./migrations/index";

/**
 * Corredor de migraciones versionadas.
 *
 * Mantiene una tabla `schema_migrations` con la versión de cada migración ya
 * aplicada. En cada arranque revisa `migrations` (database/migrations/index.ts)
 * y ejecuta únicamente las que falten, en orden, dentro de una transacción por
 * migración. Así cada migración corre exactamente una vez por instalación,
 * sin importar cuántas veces se abra la app.
 */
export async function runMigrations(): Promise<void> {
  const db = await getDatabase();

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  const applied = await db.getAllAsync<{ version: number }>(
    "SELECT version FROM schema_migrations ORDER BY version ASC",
  );
  const appliedVersions = new Set(applied.map((row) => row.version));

  const pending = migrations
    .filter((migration) => !appliedVersions.has(migration.version))
    .sort((a, b) => a.version - b.version);

  for (const migration of pending) {
    await db.withTransactionAsync(async () => {
      await migration.up(db);
      await db.runAsync(
        "INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)",
        [migration.version, migration.name, new Date().toISOString()],
      );
    });
    console.log(`[migrations] aplicada v${migration.version} (${migration.name})`);
  }

  if (pending.length === 0) {
    console.log("[migrations] esquema al día, nada que aplicar");
  }
}
