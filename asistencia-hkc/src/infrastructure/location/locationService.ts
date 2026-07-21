import * as Location from "expo-location";

export interface Coordenadas {
  latitud: number;
  longitud: number;
}

/**
 * Adaptador de geolocalización. La app es offline-first y el registro de
 * asistencia no debe bloquearse por falta de GPS (permiso denegado, GPS
 * apagado, sin señal, etc.) — por eso esta función nunca lanza: si algo
 * falla, devuelve `null` y quien llama decide cómo mostrarlo ("GPS no
 * disponible") sin impedir el registro. `Asistencia.latitud`/`longitud` son
 * `number | null` precisamente por esto.
 */
/**
 * Consulta si el permiso de ubicación ya está concedido, sin pedirlo (a
 * diferencia de `obtenerUbicacionActual()`, que sí lo solicita). Pensado
 * para pantallas de estado/diagnóstico (`admin.tsx`) que solo necesitan
 * mostrar si el GPS está disponible, no leer una posición.
 */
export async function verificarPermisoUbicacion(): Promise<boolean> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === Location.PermissionStatus.GRANTED;
  } catch (error) {
    console.warn("[locationService] no se pudo verificar el permiso de ubicación", error);
    return false;
  }
}

export async function obtenerUbicacionActual(): Promise<Coordenadas | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== Location.PermissionStatus.GRANTED) {
      return null;
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitud: position.coords.latitude,
      longitud: position.coords.longitude,
    };
  } catch (error) {
    console.warn("[locationService] no se pudo obtener ubicación", error);
    return null;
  }
}
