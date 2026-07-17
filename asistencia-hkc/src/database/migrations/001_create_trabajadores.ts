import type { Migration } from "./types";

/** Tabla de trabajadores. Coincide con el esquema original de database/migrations.ts. */
export const migration001CreateTrabajadores: Migration = {
  version: 1,
  name: "create_trabajadores",
  async up(db) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS trabajadores (
        id TEXT PRIMARY KEY,
        numero_empleado TEXT,
        nombre TEXT,
        apellido_paterno TEXT,
        apellido_materno TEXT,
        activo INTEGER DEFAULT 1
      );
    `);
  },
};
