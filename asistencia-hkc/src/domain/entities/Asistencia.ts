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

        public sincronizado: boolean,

        /** Cuántas veces se intentó enviar este registro a un backend de sincronización (Sprint 4). */
        public intentosSincronizacion: number = 0,

        /** Mensaje del último intento fallido, o `null` si nunca falló (o si ya se sincronizó). */
        public ultimoErrorSincronizacion: string | null = null

    ) {}

}