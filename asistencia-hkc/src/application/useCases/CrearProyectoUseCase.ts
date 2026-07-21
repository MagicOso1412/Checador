import { Proyecto } from "../../domain/entities/Proyecto";
import type { IProyectoRepository } from "../../domain/repositories/IProyectoRepository";
import { generateId } from "../../utils/uuid";

export interface CrearProyectoRequest {
  nombre: string;
}

/**
 * Proyecto no tiene un Value Object análogo a `NumeroEmpleado` — su única
 * regla de negocio es "nombre no vacío", así que se valida inline aquí,
 * igual que se validaba `nombre`/`apellidoPaterno` en `CrearTrabajadorUseCase`
 * antes de introducir Value Objects para esos campos.
 */
export class CrearProyectoUseCase {
  constructor(private readonly proyectoRepository: IProyectoRepository) {}

  async execute(request: CrearProyectoRequest): Promise<Proyecto> {
    const nombre = request.nombre.trim();

    if (!nombre) {
      throw new Error("El nombre del proyecto es obligatorio");
    }

    const existente = await this.proyectoRepository.buscarPorNombre(nombre);
    if (existente) {
      throw new Error(`Ya existe un proyecto con el nombre "${nombre}"`);
    }

    const proyecto = new Proyecto(generateId(), nombre, true);

    await this.proyectoRepository.crear(proyecto);

    return proyecto;
  }
}
