import type { Migration } from "./types";

/**
 * Consentimiento biométrico por trabajador (Sprint 5: requisito legal antes
 * de capturar fotos de referencia con fines de reconocimiento facial — ver
 * `domain/entities/ConsentimientoBiometrico.ts`).
 *
 * `trabajador_id` es la PK (no un `id` autogenerado): la relación es 1 a 1,
 * un trabajador tiene a lo más un consentimiento vigente a la vez, así que la
 * FK ya es identificador suficiente — mismo criterio que evitar una columna
 * redundante.
 *
 * `version_texto` guarda bajo qué versión del texto legal aceptó (ver
 * `VERSION_TEXTO_CONSENTIMIENTO_BIOMETRICO`); si el texto cambia de fondo se
 * sube la versión en código y los consentimientos viejos dejan de cubrir la
 * versión actual (`cubreVersionActual` en la entidad), sin necesidad de tocar
 * esta tabla.
 *
 * `revocado_en` nullable: revocar no borra la fila (se conserva el rastro de
 * cuándo había aceptado antes), solo se marca la fecha de revocación.
 *
 * `ON DELETE CASCADE`: mismo criterio que `fotos_referencia_facial` (mig.
 * 008) — hoy no hay ningún flujo que borre un trabajador de verdad (solo baja
 * lógica), así que el CASCADE es una red de seguridad, no un caso real.
 */
export const migration009CreateConsentimientosBiometricos: Migration = {
  version: 9,
  name: "create_consentimientos_biometricos",
  async up(db) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS consentimientos_biometricos (
        trabajador_id TEXT PRIMARY KEY REFERENCES trabajadores(id) ON DELETE CASCADE,
        version_texto TEXT NOT NULL,
        aceptado_en TEXT NOT NULL,
        revocado_en TEXT
      );
    `);
  },
};
