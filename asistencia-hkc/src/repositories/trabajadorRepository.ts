/**
 * @deprecated Este archivo es del patrón anterior a Clean Architecture (acceso
 * directo a SQLite fuera de la capa de infraestructura, sin interfaz de
 * dominio). No se pudo eliminar en este entorno (no permite borrar archivos).
 * No está importado desde ningún otro lugar del proyecto (verificado).
 *
 * Usar en su lugar:
 * - `src/domain/repositories/ITrabajadorRepository.ts`
 * - `src/infrastructure/repositories/SQLiteTrabajadorRepository.ts`
 * - `src/application/useCases/ObtenerTrabajadoresUseCase.ts`
 * - `src/store/trabajadorStore.ts` (para consumir desde la UI)
 */
import { getDatabase } from "../database/db";
import { Trabajador } from "../types/trabajador";

export async function obtenerTrabajadores(): Promise<Trabajador[]> {
  const db = await getDatabase();

  const trabajadores = await db.getAllAsync<Trabajador>(
    `
            SELECT
                id,
                numero_empleado as numeroEmpleado,
                nombre,
                apellido_paterno as apellidoPaterno,
                apellido_materno as apellidoMaterno,
                activo
            FROM trabajadores
            `,
  );

  return trabajadores;
}
