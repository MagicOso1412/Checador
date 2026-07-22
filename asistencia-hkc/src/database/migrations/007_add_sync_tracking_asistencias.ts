import type { Migration } from "./types";

/**
 * Columnas de seguimiento de sincronización sobre `asistencias`, para la
 * cola de sincronización (Sprint 4): cuántas veces se intentó sincronizar un
 * registro y cuál fue el último error, además de `sincronizado` (que ya
 * existía desde la migración 003). `ALTER TABLE ... ADD COLUMN` es seguro
 * sobre datos existentes: SQLite rellena la columna nueva con el `DEFAULT`
 * en todas las filas que ya había.
 */
export const migration007AddSyncTrackingAsistencias: Migration = {
  version: 7,
  name: "add_sync_tracking_asistencias",
  async up(db) {
    await db.execAsync(`
      ALTER TABLE asistencias ADD COLUMN intentos_sincronizacion INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE asistencias ADD COLUMN ultimo_error_sincronizacion TEXT;
    `);
  },
};
