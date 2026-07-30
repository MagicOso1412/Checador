import * as XLSX from "xlsx";

/**
 * Generador de XLSX para las descargas del portal RH (mismo criterio que
 * `lib/csv.ts`: recibe encabezados + filas ya formateadas como texto, no
 * conoce el dominio de asistencias).
 *
 * Se eligió `xlsx` (SheetJS, sin dependencias) sobre alternativas como
 * `exceljs` porque `exceljs` arrastra un árbol de dependencias profundo
 * (`archiver` → `glob`/`minimatch`/`brace-expansion` desactualizados) con 9
 * vulnerabilidades "high" reportadas por `npm audit`. `xlsx` solo reporta 1
 * ("Prototype Pollution" / ReDoS, GHSA-4r6h-8v6p-xvw6 y GHSA-5pgg-2g8v-p4x9),
 * sin parche disponible en el registro de npm porque SheetJS dejó de
 * publicar ahí — pero ambas vulnerabilidades están en el parser de archivos
 * (`XLSX.read`/`XLSX.readFile`), que este backend nunca llama: aquí solo se
 * *escribe* un workbook a partir de datos propios (`XLSX.write`), nunca se
 * lee un archivo subido por nadie. Mismo razonamiento ya documentado para el
 * advisory de `react-router-dom` en `hkc-rh-portal/PORTAL_ARCHITECTURE.md`.
 */
export function generarExcel(encabezados: string[], filas: string[][], nombreHoja = "Asistencias"): Buffer {
  const hoja = XLSX.utils.aoa_to_sheet([encabezados, ...filas]);
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, nombreHoja);
  return XLSX.write(libro, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
