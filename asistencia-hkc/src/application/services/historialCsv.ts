import type { HistorialAsistenciaDTO } from "../dto/HistorialAsistenciaDTO";
import { mapTipoRegistroToLabel } from "../../utils/tipoRegistro";

const ENCABEZADOS = [
  "Trabajador",
  "Número de empleado",
  "Proyecto",
  "Tipo de registro",
  "Fecha",
  "Hora",
  "Sincronizado",
];

/** Escapa un valor para una celda CSV (RFC 4180): comillas dobles si contiene coma, comilla o salto de línea. */
function escaparCelda(valor: string): string {
  if (/[",\n]/.test(valor)) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

function filaCsv(valores: string[]): string {
  return valores.map(escaparCelda).join(",");
}

/**
 * Transforma el historial (DTO de solo lectura, ya con nombres resueltos) a
 * texto CSV. Vive en `application/` porque opera sobre un DTO de esta capa,
 * no sobre la entidad de dominio `Asistencia` ni sobre nada específico de
 * SQLite/filesystem — la parte "dónde se guarda el archivo" es
 * responsabilidad de `infrastructure/export/exportService.ts`.
 */
export function generarCsvHistorial(registros: HistorialAsistenciaDTO[]): string {
  const filas = registros.map((r) =>
    filaCsv([
      r.trabajadorNombre,
      r.numeroEmpleado,
      r.proyectoNombre,
      mapTipoRegistroToLabel(r.tipoRegistro),
      r.fechaHora.toLocaleDateString("es-MX"),
      r.fechaHora.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }),
      r.sincronizado ? "Sí" : "No",
    ]),
  );

  return [filaCsv(ENCABEZADOS), ...filas].join("\n");
}
