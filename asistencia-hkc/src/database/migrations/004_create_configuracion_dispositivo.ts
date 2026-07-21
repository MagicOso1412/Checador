import type { Migration } from "./types";

/**
 * Configuración clave/valor local del dispositivo (no sincroniza con el
 * servidor). Primer uso: recordar qué proyecto tiene asignado un dispositivo
 * en Modo Kiosco entre reinicios de la app, sin depender de un módulo nativo
 * aparte (AsyncStorage) — ya tenemos SQLite funcionando, así que se reutiliza
 * en vez de agregar otra vía de almacenamiento.
 */
export const migration004CreateConfiguracionDispositivo: Migration = {
  version: 4,
  name: "create_configuracion_dispositivo",
  async up(db) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS configuracion_dispositivo (
        clave TEXT PRIMARY KEY,
        valor TEXT NOT NULL
      );
    `);
  },
};
