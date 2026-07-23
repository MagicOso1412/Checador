import type { Migration } from "./types";

/**
 * Usuarios del portal RH (personas, no dispositivos — auth separada de
 * `dispositivos`/`apiKeyAuth`, ver BACKEND_ARCHITECTURE.md). `password_hash`
 * vía bcrypt (bcryptjs, sin dependencia nativa — ver nota de
 * `lib/password.ts`). Igual que `dispositivos`, no hay autoregistro: un
 * admin da de alta usuarios con el script `crearUsuarioRh.ts`.
 */
export const migration003CreateUsuariosRh: Migration = {
  version: 3,
  name: "create_usuarios_rh",
  up(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS usuarios_rh (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        nombre TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        activo INTEGER NOT NULL DEFAULT 1,
        creado_en TEXT NOT NULL
      );
    `);
  },
};
