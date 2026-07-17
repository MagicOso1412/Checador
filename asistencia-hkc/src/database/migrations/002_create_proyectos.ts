import type { Migration } from "./types";

/** Tabla de proyectos (obras/plantas donde se registra asistencia). */
export const migration002CreateProyectos: Migration = {
  version: 2,
  name: "create_proyectos",
  async up(db) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS proyectos (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        activo INTEGER DEFAULT 1
      );
    `);
  },
};
