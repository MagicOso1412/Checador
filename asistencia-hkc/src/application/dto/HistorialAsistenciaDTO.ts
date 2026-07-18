import { TipoRegistro } from "../../domain/enums/TipoRegistro";

/**
 * Proyección de solo lectura para el historial local: una fila de
 * `asistencias` ya combinada con el nombre del trabajador y del proyecto
 * (evita N+1 lookups en la UI). Es un modelo de lectura (CQRS-lite), no la
 * entidad de dominio `Asistencia` — por eso vive en `application/dto/` y no
 * en `domain/entities/`. El `guardar()` del repositorio sigue trabajando
 * únicamente con la entidad `Asistencia`.
 */
export interface HistorialAsistenciaDTO {
  id: string;
  trabajadorNombre: string;
  numeroEmpleado: string;
  proyectoNombre: string;
  tipoRegistro: TipoRegistro;
  fechaHora: Date;
  fotoUri: string;
  sincronizado: boolean;
}
