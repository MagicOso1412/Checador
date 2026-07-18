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
