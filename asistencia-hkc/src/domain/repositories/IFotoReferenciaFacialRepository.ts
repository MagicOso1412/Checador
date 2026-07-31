import { FotoReferenciaFacial } from "../entities/FotoReferenciaFacial";

const MAXIMO_FOTOS_POR_TRABAJADOR = 5;

export { MAXIMO_FOTOS_POR_TRABAJADOR };

export interface IFotoReferenciaFacialRepository {
  /** Ordenadas por `creadoEn` ascendente (la más vieja primero). */
  obtenerPorTrabajador(trabajadorId: string): Promise<FotoReferenciaFacial[]>;
  contarPorTrabajador(trabajadorId: string): Promise<number>;

  agregar(foto: FotoReferenciaFacial): Promise<void>;

  /**
   * DELETE real (no baja lógica) — ver la nota en la migración 008: una foto
   * de referencia es material reemplazable, no un registro de auditoría, así
   * que no aplica el mismo criterio que `ITrabajadorRepository.eliminar()`.
   */
  eliminar(id: string): Promise<void>;
}
