import { getDatabase } from "./db";
import { migrations } from "./migrations/index";

/**
 * Corredor de migraciones versionadas — mismo diseño que
 * `asistencia-hkc/src/database/migrationRunner.ts`: tabla `schema_migrations`
 * con lo ya aplicado, corre solo lo pendiente, cada migración en su propia
 * transacción.
 */
export function runMigrations(): void {
  const db = getDatabase();

  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  const applied = db
    .prepare<[], { version: number }>("SELECT version FROM schema_migrations ORDER BY version ASC")
    .all();
  const appliedVersions = new Set(applied.map((row) => row.version));

  const pending = migrations
    .filter((migration) => !appliedVersions.has(migration.version))
    .sort((a, b) => a.version - b.version);

  for (const migration of pending) {
    const runInTransaction = db.transaction(() => {
      migration.up(db);
      db.prepare("INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)").run(
        migration.version,
        migration.name,
        new Date().toISOString(),
      );
    });
    runInTransaction();
    console.log(`[migrations] aplicada v${migration.version} (${migration.name})`);
  }

  if (pending.length === 0) {
    console.log("[migrations] esquema al día, nada que aplicar");
  }
}
