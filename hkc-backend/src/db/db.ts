import path from "node:path";
import fs from "node:fs";
import Database from "better-sqlite3";

/**
 * Conexión a SQLite (better-sqlite3, API síncrona). Un solo archivo,
 * configurable por `DB_PATH` (útil para separar datos de desarrollo/producción
 * en el Mac mini) — por defecto vive en `./data/hkc-backend.sqlite`, relativo
 * a donde se ejecute el proceso.
 */
let db: Database.Database | undefined;

export function getDatabase(): Database.Database {
  if (db) return db;

  const dbPath = process.env.DB_PATH ?? path.join(process.cwd(), "data", "hkc-backend.sqlite");
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  return db;
}
