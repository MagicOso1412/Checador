import { getDatabase } from "./db";

export interface AsistenciaRow {
  id: string;
  trabajador_id: string;
  trabajador_nombre: string;
  numero_empleado: string;
  proyecto_id: string;
  proyecto_nombre: string;
  tipo_registro: string;
  fecha_hora: string;
  foto_uri: string;
  latitud: number | null;
  longitud: number | null;
  dispositivo_id: string | null;
  recibido_en: string;
}

export interface FiltrosAsistencias {
  proyectoId?: string;
  trabajadorId?: string;
  desde?: string; // ISO date, inclusive
  hasta?: string; // ISO date, inclusive
  limite?: number;
}

export const LIMITE_MAXIMO = 5000;
export const LIMITE_POR_DEFECTO = 500;

export interface ResultadoBusquedaAsistencias {
  registros: AsistenciaRow[];
  /**
   * `true` si la cantidad de resultados llegó exactamente al límite
   * aplicado — señal de que probablemente hay más filas sin mostrar (no es
   * un conteo exacto de "cuántas más hay", solo un aviso honesto de
   * "esto puede estar incompleto, acota el rango de fechas"). Antes el
   * endpoint devolvía `total: registros.length`, que en realidad era solo
   * "cuántas se devolvieron" — fácil de confundir con "cuántas hay en
   * total" cuando el límite recorta el resultado real.
   */
  limitado: boolean;
}

/**
 * Lectura filtrable de asistencias, pensada para el portal RH (lista y
 * exportación CSV/Excel comparten esta misma consulta). Arma el `WHERE`
 * dinámicamente según qué filtros vengan — todos son opcionales.
 */
export function buscarAsistencias(filtros: FiltrosAsistencias): ResultadoBusquedaAsistencias {
  const condiciones: string[] = [];
  const params: (string | number)[] = [];

  if (filtros.proyectoId) {
    condiciones.push("proyecto_id = ?");
    params.push(filtros.proyectoId);
  }
  if (filtros.trabajadorId) {
    condiciones.push("trabajador_id = ?");
    params.push(filtros.trabajadorId);
  }
  if (filtros.desde) {
    condiciones.push("fecha_hora >= ?");
    params.push(filtros.desde);
  }
  if (filtros.hasta) {
    condiciones.push("fecha_hora <= ?");
    params.push(filtros.hasta);
  }

  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";
  const limite = Math.min(filtros.limite ?? LIMITE_POR_DEFECTO, LIMITE_MAXIMO);

  const registros = getDatabase()
    .prepare<(string | number)[], AsistenciaRow>(
      `SELECT * FROM asistencias ${where} ORDER BY fecha_hora DESC LIMIT ?`,
    )
    .all(...params, limite);

  return { registros, limitado: registros.length === limite };
}
