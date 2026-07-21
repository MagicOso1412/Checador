import * as Device from "expo-device";
import Constants from "expo-constants";

/**
 * Adaptador de datos del dispositivo/build, para pantallas de
 * administración/diagnóstico (`admin.tsx`, `configuracion/index.tsx`).
 * Reemplaza los valores de ejemplo que antes estaban ahí escritos a mano
 * ("Dispositivo-07", "v1.0.0"): `expo-device` y `expo-constants` ya son
 * dependencias del proyecto, así que no hace falta agregar nada nuevo.
 *
 * Todas las funciones son best-effort: en web o si la plataforma no expone
 * el dato, devuelven un valor de respaldo en vez de lanzar — mismo criterio
 * que `locationService`/`cameraService` para no bloquear una pantalla de
 * configuración por un dato secundario.
 */
export function obtenerNombreDispositivo(): string {
  return Device.deviceName ?? Device.modelName ?? "Dispositivo sin nombre";
}

export function obtenerVersionApp(): string {
  return Constants.expoConfig?.version ?? "—";
}
