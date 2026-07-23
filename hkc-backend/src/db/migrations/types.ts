import type Database from "better-sqlite3";

/**
 * Una migración versionada de esquema. `version` debe ser único y creciente;
 * el runner las aplica en orden y registra cuáles ya se ejecutaron en la
 * tabla `schema_migrations`, para que cada una corra exactamente una vez.
 * Mismo patrón que `asistencia-hkc/src/database/migrations/` — se mantuvo
 * consistente entre cliente y backend a propósito.
 */
export interface Migration {
  version: number;
  name: string;
  up: (db: Database.Database) => void;
}
