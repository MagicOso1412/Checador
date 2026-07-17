import { Asistencia } from "../../domain/entities/Asistencia";
import { TipoRegistro } from "../../domain/enums/TipoRegistro";
import type { IAsistenciaRepository } from "../../domain/repositories/IAsistenciaRepository";
import { generateId } from "../../utils/uuid";

export interface RegistrarAsistenciaRequest {

    trabajadorId: string;

    proyectoId: string;

    tipo: TipoRegistro;

    fotoUri: string;

    latitud: number | null;

    longitud: number | null;

}

export class RegistrarAsistenciaUseCase {

    constructor(private readonly asistenciaRepository: IAsistenciaRepository) {}

    async execute(
        request: RegistrarAsistenciaRequest
    ): Promise<Asistencia> {

        const asistencia = new Asistencia(
            generateId(),
            request.trabajadorId,
            request.proyectoId,
            request.tipo,
            new Date(),
            request.fotoUri,
            request.latitud,
            request.longitud,
            false,
        );

        await this.asistenciaRepository.guardar(asistencia);

        return asistencia;
    }

}
