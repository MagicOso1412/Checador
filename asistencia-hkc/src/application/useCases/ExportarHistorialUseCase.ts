import { ObtenerHistorialUseCase } from "./ObtenerHistorialUseCase";
import { generarCsvHistorial } from "../services/historialCsv";

export interface ExportarHistorialResult {
  csv: string;
  fileName: string;
  totalRegistros: number;
}

/**
 * Compone `ObtenerHistorialUseCase` (misma fuente de datos que ve la
 * pantalla de historial, con el join en memoria trabajador/proyecto ya
 * resuelto) con `generarCsvHistorial` para armar el archivo exportable.
 * Un use case componiendo otro use case es válido aquí: ambos viven en
 * `application/`, y evita duplicar la lógica de join que ya tiene
 * `ObtenerHistorialUseCase`.
 */
export class ExportarHistorialUseCase {
  constructor(private readonly obtenerHistorialUseCase: ObtenerHistorialUseCase) {}

  async execute(proyectoId?: string): Promise<ExportarHistorialResult> {
    const registros = await this.obtenerHistorialUseCase.execute(proyectoId);
    const csv = generarCsvHistorial(registros);

    const fecha = new Date().toISOString().slice(0, 10);
    const fileName = `asistencias_${fecha}.csv`;

    return { csv, fileName, totalRegistros: registros.length };
  }
}
