import type { Migration } from "./types";

/**
 * Tabla de asistencias (registros de entrada/salida/comida). `tipo_registro`
 * guarda el valor del enum `TipoRegistro` como texto; `sincronizado` guarda
 * el enum `EstadoSincronizacion` (0 = pendiente, 1 = sincronizado) — ambos
 * mapeos viven en `infrastructure/repositories/SQLiteAsistenciaRepository.ts`,
 * nunca en la UI. Índice por `trabajador_id` + `fecha_hora` pensando en el
 * historial local (consultas por trabajador, ordenadas por fecha).
 */
export const migration003CreateAsistencias: Migration = {
  version: 3,
  name: "create_asistencias",
  async up(db) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS asistencias (
        id TEXT PRIMARY KEY,
        trabajador_id TEXT NOT NULL REFERENCES trabajadores(id),
        proyecto_id TEXT NOT NULL REFERENCES proyectos(id),
        tipo_registro TEXT NOT NULL,
        fecha_hora TEXT NOT NULL,
        foto_uri TEXT NOT NULL,
        latitud REAL,
        longitud REAL,
        sincronizado INTEGER NOT NULL DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_asistencias_trabajador_fecha
        ON asistencias (trabajador_id, fecha_hora);

      CREATE INDEX IF NOT EXISTS idx_asistencias_proyecto_fecha
        ON asistencias (proyecto_id, fecha_hora);
    `);
  },
};
