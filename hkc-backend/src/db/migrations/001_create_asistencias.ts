import type { Migration } from "./types";

/**
 * Tabla de asistencias recibidas desde los dispositivos. Denormalizada a
 * propósito (`trabajador_nombre`, `proyecto_nombre` junto a los ids): el
 * backend no sincroniza el catálogo de trabajadores/proyectos todavía, y
 * este payload ya llega resuelto desde el cliente — ver la nota en
 * `AsistenciaSyncPayload` (cliente y backend) y en BACKEND_ARCHITECTURE.md.
 *
 * `id` es el id que generó el dispositivo (mismo id que en su SQLite local),
 * usado como PK para que el endpoint de sincronización sea idempotente: un
 * reintento con el mismo `id` no duplica el registro.
 *
 * `dispositivo_id` referencia qué dispositivo envió el registro (auditoría);
 * se agrega como FK una vez que existe la tabla `dispositivos` (migración 002).
 */
export const migration001CreateAsistencias: Migration = {
  version: 1,
  name: "create_asistencias",
  up(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS asistencias (
        id TEXT PRIMARY KEY,
        trabajador_id TEXT NOT NULL,
        trabajador_nombre TEXT NOT NULL,
        numero_empleado TEXT NOT NULL,
        proyecto_id TEXT NOT NULL,
        proyecto_nombre TEXT NOT NULL,
        tipo_registro TEXT NOT NULL,
        fecha_hora TEXT NOT NULL,
        foto_uri TEXT NOT NULL,
        latitud REAL,
        longitud REAL,
        dispositivo_id TEXT,
        recibido_en TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_asistencias_proyecto_fecha
        ON asistencias (proyecto_id, fecha_hora);

      CREATE INDEX IF NOT EXISTS idx_asistencias_trabajador_fecha
        ON asistencias (trabajador_id, fecha_hora);
    `);
  },
};
