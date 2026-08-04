import ExcelJS from "exceljs";

/** Mismo azul primario que usa el resto de la app (cliente móvil y portal RH). */
const COLOR_PRIMARIO = "FF1565C0";
const ANCHO_MAXIMO_COLUMNA = 40;
const ANCHO_MINIMO_COLUMNA = 10;

/**
 * Generador de XLSX para las descargas del portal RH (mismo criterio que
 * `lib/csv.ts`: recibe encabezados + filas ya formateadas como texto, no
 * conoce el dominio de asistencias).
 *
 * **Por qué `exceljs` y no `xlsx` (SheetJS):** la primera versión de este
 * archivo usaba `xlsx` porque tenía una sola advisory de seguridad reportada
 * (contra 9 "high" de `exceljs` en esa primera prueba). Pero `xlsx`
 * (edición community) no soporta escribir estilos de celda — se probó
 * explícitamente (`ws['A1'].s = {...}` seguido de inspeccionar el XML
 * resultante) y el estilo se descarta en silencio al guardar, así que nunca
 * iba a poder verse "bonito" como pidió el usuario. Al reinstalar `exceljs`
 * limpio (sin arrastrar el `package-lock.json` viejo que fijaba versiones
 * desactualizadas de sus dependencias), `npm audit` bajó a solo 1
 * vulnerabilidad "moderate" (en `uuid`, usado internamente por `exceljs`
 * para nombres únicos — no en una ruta que reciba datos de nadie más, este
 * backend solo escribe archivos con datos propios, nunca lee un `.xlsx`
 * subido). Verificado manualmente: el archivo generado con negritas/color de
 * header sí serializa el estilo real en `styles.xml` (a diferencia de
 * `xlsx`), confirmado inspeccionando el `.xlsx` resultante como zip.
 */
export async function generarExcel(
  encabezados: string[],
  filas: string[][],
  nombreHoja = "Asistencias",
): Promise<Buffer> {
  const libro = new ExcelJS.Workbook();
  libro.creator = "HKC Attendance";
  libro.created = new Date();

  const hoja = libro.addWorksheet(nombreHoja, {
    views: [{ state: "frozen", ySplit: 1 }], // fija la fila de encabezados al hacer scroll
  });

  hoja.addRow(encabezados);
  for (const fila of filas) {
    hoja.addRow(fila);
  }

  const filaEncabezado = hoja.getRow(1);
  filaEncabezado.font = { bold: true, color: { argb: "FFFFFFFF" } };
  filaEncabezado.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_PRIMARIO } };
  filaEncabezado.alignment = { vertical: "middle" };

  hoja.columns.forEach((columna, indice) => {
    const encabezado = encabezados[indice] ?? "";
    const maxContenido = filas.reduce((max, fila) => Math.max(max, (fila[indice] ?? "").length), 0);
    columna.width = Math.min(
      ANCHO_MAXIMO_COLUMNA,
      Math.max(ANCHO_MINIMO_COLUMNA, encabezado.length, maxContenido) + 2,
    );
  });

  const buffer = await libro.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
