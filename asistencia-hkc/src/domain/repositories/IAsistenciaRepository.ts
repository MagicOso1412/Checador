import { Asistencia } from "../entities/Asistencia";

export interface IAsistenciaRepository {

    guardar(
        asistencia: Asistencia
    ): Promise<void>;

}