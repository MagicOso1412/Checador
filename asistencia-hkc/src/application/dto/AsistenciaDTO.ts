/**
 * @deprecated Reemplazado por `AsistenciaSyncPayload.ts` (mismo directorio):
 * el payload real de sincronización va denormalizado (con nombre de
 * trabajador/proyecto, no solo el id) — ver ese archivo para el porqué. Este
 * archivo no se pudo borrar en este entorno (no hay operación de borrado
 * disponible); queda como shim de compatibilidad. No lo importes en código
 * nuevo.
 */
export type { AsistenciaSyncPayload as AsistenciaDTO } from "./AsistenciaSyncPayload";
