import type { Migration } from "./types";

/**
 * Fotos de referencia por trabajador (Sprint 5: reconocimiento facial).
 * Varias fotos por trabajador (`obtenerPorTrabajador` ordena por
 * `creado_en`) para que, cuando exista un motor de reconocimiento real
 * (ver `application/ports/IReconocimientoFacialService.ts`), haya varias
 * muestras por persona con las que generar/comparar embeddings — una sola
 * foto de referencia es frágil ante cambios de luz, ángulo, lentes, etc.
 *
 * `ON DELETE CASCADE`: si un trabajador se da de baja (baja lógica,
 * `activo = false` — nunca se borra la fila) sus fotos de referencia no se
 * tocan; el `CASCADE` solo aplicaría si alguna vez se hiciera un `DELETE`
 * real de un trabajador, lo cual hoy no ocurre en ningún flujo de la app.
 *
 * A diferencia de `trabajadores`/`proyectos`, aquí sí se permite `DELETE`
 * real de una fila individual (`eliminar()` en el repositorio): una foto de
 * referencia no tiene el mismo peso histórico que una asistencia — es
 * material de entrenamiento reemplazable, no un registro de auditoría.
 */
export const migration008CreateFotosReferenciaFacial: Migration = {
  version: 8,
  name: "create_fotos_referencia_facial",
  async up(db) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS fotos_referencia_facial (
        id TEXT PRIMARY KEY,
        trabajador_id TEXT NOT NULL REFERENCES trabajadores(id) ON DELETE CASCADE,
        foto_uri TEXT NOT NULL,
        creado_en TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_fotos_referencia_trabajador
        ON fotos_referencia_facial (trabajador_id);
    `);
  },
};
