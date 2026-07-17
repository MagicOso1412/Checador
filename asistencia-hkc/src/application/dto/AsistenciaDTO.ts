import { TipoRegistro } from "../../domain/enums/TipoRegistro";

/**
 * Forma completa de un registro de asistencia (incluye `id`/`fechaHora`, que
 * genera el use case, no quien lo llama). Pensado para cuando exista la capa
 * de sincronización (Sprint 4): es el shape que viajaría hacia/desde la API.
 */
export interface AsistenciaDTO {

    id: string;

    trabajadorId: string;

    proyectoId: string;

    tipo: TipoRegistro;

    fechaHora: Date;

    fotoUri: string;

    latitud: number | null;

    longitud: number | null;

}