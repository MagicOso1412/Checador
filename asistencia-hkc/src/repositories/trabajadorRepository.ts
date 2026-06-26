import { getDatabase } from "../database/db";
import { Trabajador } from "../types/trabajador";

export async function obtenerTrabajadores(): Promise<Trabajador[]> {

    const db = await getDatabase();

    const trabajadores =
        await db.getAllAsync<Trabajador>(
            `
            SELECT
                id,
                numero_empleado as numeroEmpleado,
                nombre,
                apellido_paterno as apellidoPaterno,
                apellido_materno as apellidoMaterno,
                activo
            FROM trabajadores
            `
        );

    return trabajadores;
}