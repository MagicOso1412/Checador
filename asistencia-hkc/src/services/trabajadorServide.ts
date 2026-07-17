/**
 * @deprecated Del patrón anterior a Clean Architecture. No se pudo eliminar
 * en este entorno. No está importado desde ningún otro lugar del proyecto
 * (verificado). Usar `src/store/trabajadorStore.ts` / `ObtenerTrabajadoresUseCase`.
 */
import { obtenerTrabajadores } from "../repositories/trabajadorRepository";

export async function listarTrabajadores() {
  return await obtenerTrabajadores();
}
