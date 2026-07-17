import { TipoRegistro } from "../enums/TipoRegistro";

export class Asistencia {

    constructor(

        public id: string,

        public trabajadorId: string,

        public proyectoId: string,

        public tipoRegistro: TipoRegistro,

        public fechaHora: Date,

        public fotoUri: string,

        public latitud: number | null,

        public longitud: number | null,

        public sincronizado: boolean

    ) {}

}