import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";

import { ensureExportsDirectory } from "../storage/fileService";

export interface ExportResult {
  /** Ruta del archivo en nativo, o un mensaje descriptivo en web (ahí no hay ruta de filesystem que mostrar). */
  guardadoEn: string;
}

/**
 * Guarda un CSV generado (`application/services/historialCsv.ts`) en el
 * dispositivo. Deliberadamente **no** usa `expo-sharing` para abrir un share
 * sheet nativo: ese paquete es un módulo nativo nuevo, y agregar uno sin
 * poder reconstruir el dev client en este entorno ya causó un crash antes
 * (ver la nota de AsyncStorage en ARCHITECTURE.md, "Kiosco vs. Campo:
 * conectividad y proyecto asignado"). En su lugar:
 *
 * - Nativo (Android/iOS): escribe el CSV en `documentDirectory/exports/`
 *   usando `expo-file-system/legacy` (ya es una dependencia funcionando, sin
 *   necesidad de ningún módulo nuevo) y devuelve la ruta para mostrarla al
 *   usuario.
 * - Web: dispara una descarga de navegador real (`Blob` + link temporal),
 *   sin filesystem de por medio — mismo criterio que
 *   `infrastructure/camera/cameraService.ts` para web.
 *
 * Compartir directamente (WhatsApp, correo, etc.) queda como mejora futura
 * cuando se pueda reconstruir el dev client con `expo-sharing` enlazado.
 */
export async function guardarCsv(csv: string, fileName: string): Promise<ExportResult> {
  if (Platform.OS === "web") {
    descargarEnNavegador(csv, fileName);
    return { guardadoEn: "Descarga iniciada en el navegador" };
  }

  const exportsDir = await ensureExportsDirectory();
  const destino = `${exportsDir}/${fileName}`;

  await FileSystem.writeAsStringAsync(destino, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  return { guardadoEn: destino };
}

function descargarEnNavegador(csv: string, fileName: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
