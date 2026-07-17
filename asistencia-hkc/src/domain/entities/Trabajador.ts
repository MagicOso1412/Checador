export class Trabajador {

    constructor(

        public id: string,

        public numeroEmpleado: string,

        public nombre: string,

        public apellidoPaterno: string,

        public apellidoMaterno: string,

        public activo: boolean

    ) {}

    get nombreCompleto() {

        return `${this.nombre} ${this.apellidoPaterno} ${this.apellidoMaterno}`;

    }

}