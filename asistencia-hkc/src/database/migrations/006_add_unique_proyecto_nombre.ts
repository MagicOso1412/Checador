import type { Migration } from "./types";

/**
 * Índice único sobre `nombre` de proyectos, mismo patrón que la migración
 * 005 para `trabajadores.numero_empleado`: defensa a nivel de base de datos
 * además de la validación en `CrearProyectoUseCase`/`ActualizarProyectoUseCase`.
 */
export const migration006AddUniqueProyectoNombre: Migration = {
  version: 6,
  name: "add_unique_proyecto_nombre",
  async up(db) {
    await db.execAsync(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_proyectos_nombre_unique
        ON proyectos (nombre);
    `);
  },
};
