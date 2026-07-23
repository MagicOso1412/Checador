/**
 * @deprecated Movido a `application/gateways/ISyncGateway.ts` — un gateway
 * de sincronización opera sobre `AsistenciaSyncPayload` (un DTO
 * denormalizado de `application/`, con nombre de trabajador/proyecto), no
 * sobre la entidad de dominio pura `Asistencia`, así que pertenece a esa
 * capa. Este archivo no se pudo borrar en este entorno (no hay operación de
 * borrado disponible); queda como shim de compatibilidad. No lo importes en
 * código nuevo.
 */
export type { ISyncGateway } from "../../application/gateways/ISyncGateway";
