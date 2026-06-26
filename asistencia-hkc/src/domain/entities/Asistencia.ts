export class Asistencia {

    constructor(

        public id: string,

        public trabajadorId: string,

        public proyectoId: string,

        public tipoRegistro: string,

        public fechaHora: Date,

        public fotoUri: string,

        public latitud: number,

        public longitud: number,

        public sincronizado: boolean

    ) {}

}