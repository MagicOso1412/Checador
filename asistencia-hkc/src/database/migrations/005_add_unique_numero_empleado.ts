import type { Migration } from "./types";

/**
 * Índice único sobre `numero_empleado`: defensa a nivel de base de datos,
 * además de la validación que ya hacen los use cases de creación/edición
 * (`CrearTrabajadorUseCase`/`ActualizarTrabajadorUseCase`). La migración 001
 * original no lo tenía (no se puede modificar una migración ya publicada),
 * así que se agrega aquí como migración nueva. Seguro de aplicar sobre datos
 * existentes: los seeds de desarrollo ya usan números de empleado únicos.
 */
export const migration005AddUniqueNumeroEmpleado: Migration = {
  version: 5,
  name: "add_unique_numero_empleado",
  async up(db) {
    await db.execAsync(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_trabajadores_numero_empleado_unique
        ON trabajadores (numero_empleado);
    `);
  },
};
