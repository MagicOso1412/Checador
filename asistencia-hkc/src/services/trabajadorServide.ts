import { obtenerTrabajadores } from "../repositories/trabajadorRepository";

export async function listarTrabajadores() {
    return await obtenerTrabajadores();
}