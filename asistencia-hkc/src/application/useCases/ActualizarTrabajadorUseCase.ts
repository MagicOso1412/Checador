import { Trabajador } from "../../domain/entities/Trabajador";
import { NumeroEmpleado } from "../../domain/valueObjects/NumeroEmpleado";
import type { ITrabajadorRepository } from "../../domain/repositories/ITrabajadorRepository";

export interface ActualizarTrabajadorRequest {
  id: string;
  numeroEmpleado: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  activo: boolean;
}

export class ActualizarTrabajadorUseCase {
  constructor(private readonly trabajadorRepository: ITrabajadorRepository) {}

  async execute(request: ActualizarTrabajadorRequest): Promise<Trabajador> {
    const existente = await this.trabajadorRepository.buscarPorId(request.id);
    if (!existente) {
      throw new Error("El trabajador que intentas editar ya no existe");
    }

    const numeroEmpleado = new NumeroEmpleado(request.numeroEmpleado).value;

    if (!request.nombre.trim()) {
      throw new Error("El nombre es obligatorio");
    }
    if (!request.apellidoPaterno.trim()) {
      throw new Error("El apellido paterno es obligatorio");
    }

    const conMismoNumero = await this.trabajadorRepository.buscarPorNumeroEmpleado(numeroEmpleado);
    if (conMismoNumero && conMismoNumero.id !== request.id) {
      throw new Error(`Ya existe otro trabajador con el número de empleado ${numeroEmpleado}`);
    }

    const trabajador = new Trabajador(
      request.id,
      numeroEmpleado,
      request.nombre.trim(),
      request.apellidoPaterno.trim(),
      request.apellidoMaterno.trim(),
      request.activo,
    );

    await this.trabajadorRepository.actualizar(trabajador);

    return trabajador;
  }
}
