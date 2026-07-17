import type { SQLiteDatabase } from "expo-sqlite";

/**
 * Una migración versionada de esquema. `version` debe ser único y creciente;
 * el runner las aplica en orden y registra cuáles ya se ejecutaron en la tabla
 * `schema_migrations`, para que cada una corra exactamente una vez por instalación.
 */
export interface Migration {
  version: number;
  name: string;
  up: (db: SQLiteDatabase) => Promise<void>;
}
