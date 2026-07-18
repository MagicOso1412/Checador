import { Asistencia } from "../entities/Asistencia";

export interface IAsistenciaRepository {

    guardar(
        asistencia: Asistencia
    ): Promise<void>;

    /**
     * Asistencias más recientes primero. Si se pasa `proyectoId`, filtra solo
     * ese proyecto. Devuelve la entidad de dominio pura (sin nombres de
     * trabajador/proyecto) — combinarla con esos datos es responsabilidad de
     * un use case de aplicación (ver `ObtenerHistorialUseCase`), no del
     * repositorio: así este mantiene una sola razón para cambiar (persistencia
     * de `Asistencia`) y no depende de un DTO de otra capa.
     */
    obtenerPorProyecto(
        proyectoId?: string,
        limite?: number,
    ): Promise<Asistencia[]>;

}
