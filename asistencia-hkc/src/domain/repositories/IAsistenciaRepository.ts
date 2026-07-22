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

    /**
     * Registros con `sincronizado = false`, sin importar si ya tuvieron
     * intentos fallidos previos — siguen siendo "pendientes" hasta que se
     * confirme el envío. Orden ascendente por fecha (el más antiguo primero),
     * pensado para una cola de sincronización.
     */
    obtenerPendientesDeSincronizar(limite?: number): Promise<Asistencia[]>;

    /** Marca un registro como sincronizado y limpia su último error (si tenía uno). */
    marcarComoSincronizado(id: string): Promise<void>;

    /** Incrementa el contador de intentos y guarda el mensaje del último error, sin cambiar `sincronizado`. */
    registrarIntentoFallido(id: string, mensaje: string): Promise<void>;

}
