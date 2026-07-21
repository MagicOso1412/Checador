import { Proyecto } from "../../domain/entities/Proyecto";
import type { IProyectoRepository } from "../../domain/repositories/IProyectoRepository";

export interface ActualizarProyectoRequest {
  id: string;
  nombre: string;
  activo: boolean;
}

export class ActualizarProyectoUseCase {
  constructor(private readonly proyectoRepository: IProyectoRepository) {}

  async execute(request: ActualizarProyectoRequest): Promise<Proyecto> {
    const existente = await this.proyectoRepository.buscarPorId(request.id);
    if (!existente) {
      throw new Error("El proyecto que intentas editar ya no existe");
    }

    const nombre = request.nombre.trim();
    if (!nombre) {
      throw new Error("El nombre del proyecto es obligatorio");
    }

    const conMismoNombre = await this.proyectoRepository.buscarPorNombre(nombre);
    if (conMismoNombre && conMismoNombre.id !== request.id) {
      throw new Error(`Ya existe otro proyecto con el nombre "${nombre}"`);
    }

    const proyecto = new Proyecto(request.id, nombre, request.activo);

    await this.proyectoRepository.actualizar(proyecto);

    return proyecto;
  }
}
