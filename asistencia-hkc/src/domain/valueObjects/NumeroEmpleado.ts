export class NumeroEmpleado {

    constructor(
        public readonly value: string
    ) {

        if (!value.trim()) {

            throw new Error(
                "Número de empleado inválido"
            );

        }

    }

}