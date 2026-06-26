import { TipoRegistro } from "../../domain/enums/TipoRegistro";

export interface RegistrarAsistenciaRequest {

    trabajadorId: string;

    proyectoId: string;

    tipo: TipoRegistro;

}

export class RegistrarAsistenciaUseCase {

    async execute(
        request: RegistrarAsistenciaRequest
    ) {

        console.log("=== Registrar Asistencia ===");

        console.log(request);

    }

}