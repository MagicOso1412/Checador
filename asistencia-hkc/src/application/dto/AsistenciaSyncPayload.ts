import { TipoRegistro } from "../../domain/enums/TipoRegistro";

/**
 * Forma de una asistencia tal como viaja hacia el backend de sincronización.
 * A diferencia de la entidad de dominio `Asistencia` (que solo guarda
 * `trabajadorId`/`proyectoId`), este payload va **denormalizado** — incluye
 * el nombre del trabajador/proyecto en el momento del envío.
 *
 * Es una decisión deliberada, no un descuido: así el backend (Sprint 4, Mac
 * mini) no necesita su propia copia sincronizada del catálogo de
 * trabajadores/proyectos solo para poder mostrarle algo legible a RH — le
 * basta con guardar lo que llega. También es más correcto para una
 * bitácora de asistencia: si un trabajador se renombra o se da de baja
 * después, el registro histórico conserva el nombre real de ese momento, en
 * vez de quedar attached a un id que ya no resuelve a nada útil.
 *
 * Sincronizar el catálogo de trabajadores/proyectos en sí (para que RH lo
 * administre desde el portal web en vez de cada dispositivo por separado)
 * es una decisión más grande, pendiente de conversación — ver
 * BACKEND_ARCHITECTURE.md.
 */
export interface AsistenciaSyncPayload {
  id: string;
  trabajadorId: string;
  trabajadorNombre: string;
  numeroEmpleado: string;
  proyectoId: string;
  proyectoNombre: string;
  tipoRegistro: TipoRegistro;
  fechaHora: Date;
  fotoUri: string;
  latitud: number | null;
  longitud: number | null;
}
