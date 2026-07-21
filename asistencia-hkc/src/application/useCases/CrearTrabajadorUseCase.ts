import { Trabajador } from "../../domain/entities/Trabajador";
import { NumeroEmpleado } from "../../domain/valueObjects/NumeroEmpleado";
import type { ITrabajadorRepository } from "../../domain/repositories/ITrabajadorRepository";
import { generateId } from "../../utils/uuid";

export interface CrearTrabajadorRequest {
  numeroEmpleado: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
}

export class CrearTrabajadorUseCase {
  constructor(private readonly trabajadorRepository: ITrabajadorRepository) {}

  async execute(request: CrearTrabajadorRequest): Promise<Trabajador> {
    const numeroEmpleado = new NumeroEmpleado(request.numeroEmpleado).value;

    if (!request.nombre.trim()) {
      throw new Error("El nombre es obligatorio");
    }
    if (!request.apellidoPaterno.trim()) {
      throw new Error("El apellido paterno es obligatorio");
    }

    const existente = await this.trabajadorRepository.buscarPorNumeroEmpleado(numeroEmpleado);
    if (existente) {
      throw new Error(`Ya existe un trabajador con el número de empleado ${numeroEmpleado}`);
    }

    const trabajador = new Trabajador(
      generateId(),
      numeroEmpleado,
      request.nombre.trim(),
      request.apellidoPaterno.trim(),
      request.apellidoMaterno.trim(),
      true,
    );

    await this.trabajadorRepository.crear(trabajador);

    return trabajador;
  }
}
