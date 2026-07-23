import type { Migration } from "./types";

/**
 * Dispositivos autorizados a sincronizar (teléfonos en Modo Campo/Kiosco).
 * `api_key` se genera manualmente por un admin al dar de alta un
 * dispositivo (no hay autoregistro) — ver `middleware/apiKeyAuth.ts` y
 * BACKEND_ARCHITECTURE.md, sección "Autenticación".
 */
export const migration002CreateDispositivos: Migration = {
  version: 2,
  name: "create_dispositivos",
  up(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS dispositivos (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        api_key TEXT NOT NULL UNIQUE,
        activo INTEGER NOT NULL DEFAULT 1,
        creado_en TEXT NOT NULL
      );
    `);
  },
};
