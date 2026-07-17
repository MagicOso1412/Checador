import { Trabajador } from "../entities/Trabajador";

export interface ITrabajadorRepository {
  obtenerTodos(): Promise<Trabajador[]>;
  obtenerActivos(): Promise<Trabajador[]>;
  buscarPorNumeroEmpleado(numeroEmpleado: string): Promise<Trabajador | null>;
}
