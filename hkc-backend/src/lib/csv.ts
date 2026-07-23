/**
 * Generador de CSV mínimo (RFC 4180), sin dependencias — mismo criterio que
 * `asistencia-hkc/src/application/services/historialCsv.ts` del lado del
 * cliente (no se comparte código entre los dos proyectos todavía, ver la
 * nota de tipos compartidos en BACKEND_ARCHITECTURE.md).
 */
function escaparCelda(valor: string): string {
  if (/[",\n]/.test(valor)) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

export function generarCsv(encabezados: string[], filas: string[][]): string {
  const todas = [encabezados, ...filas];
  return todas.map((fila) => fila.map(escaparCelda).join(",")).join("\n");
}
