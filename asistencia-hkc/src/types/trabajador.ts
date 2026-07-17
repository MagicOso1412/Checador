/**
 * @deprecated Tipo plano usado solo por el repositorio legado
 * (`src/repositories/trabajadorRepository.ts`, también deprecado). El tipo de
 * dominio real es la clase `src/domain/entities/Trabajador.ts`.
 */
export interface Trabajador {
    id: string;
    numeroEmpleado: string;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    activo: number;
}