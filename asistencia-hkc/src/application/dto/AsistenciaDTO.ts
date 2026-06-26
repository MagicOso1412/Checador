import { TipoRegistro } from "../../domain/enums/TipoRegistro";

export interface AsistenciaDTO {

    id: string;

    trabajadorId: string;

    proyectoId: string;

    tipo: TipoRegistro;

    fechaHora: Date;

    fotoUri: string;

    latitud: number;

    longitud: number;

}