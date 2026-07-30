import type { AsistenciaRow } from "../api/types";

/**
 * Resumen calculado en el navegador sobre el resultado ya filtrado por el
 * backend (`GET /api/asistencias?desde=&hasta=`, respetando su límite de
 * fila — ver `LIMITE_POR_DEFECTO`/`LIMITE_MAXIMO` en
 * `hkc-backend/src/db/asistenciasQueries.ts`). Mismo criterio que el
 * "Resumen" del historial en la app móvil
 * (`asistencia-hkc/src/app/historial/index.tsx`): una proyección de lectura
 * simple, calculada en memoria a partir de datos ya cargados, sin pedirle
 * nada nuevo al backend.
 *
 * Se calcula sobre el conjunto completo devuelto por el filtro de fecha
 * (`registros`), no sobre el subconjunto de la barra de búsqueda local
 * (`filtrados` en `DashboardPage.tsx`) — la búsqueda es solo para encontrar
 * una fila en la tabla, no para acotar qué significa "el resumen de este
 * rango de fechas".
 */
export interface ResumenAsistencias {
  total: number;
  trabajadoresUnicos: number;
  proyectosUnicos: number;
  porTipo: Record<AsistenciaRow["tipo_registro"], number>;
}

export function calcularResumen(registros: AsistenciaRow[]): ResumenAsistencias {
  const porTipo: ResumenAsistencias["porTipo"] = {
    ENTRADA: 0,
    SALIDA: 0,
    INICIO_COMIDA: 0,
    FIN_COMIDA: 0,
  };
  const trabajadores = new Set<string>();
  const proyectos = new Set<string>();

  for (const registro of registros) {
    porTipo[registro.tipo_registro] += 1;
    trabajadores.add(registro.trabajador_id);
    proyectos.add(registro.proyecto_id);
  }

  return {
    total: registros.length,
    trabajadoresUnicos: trabajadores.size,
    proyectosUnicos: proyectos.size,
    porTipo,
  };
}
