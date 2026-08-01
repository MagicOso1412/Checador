import "@/global.css";

import { ActivityIndicator, LogBox, Text, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { palette } from "@/constants/palette";
import { AttendanceProvider } from "@/context/attendance-context";
import { useDatabaseReady } from "@/hooks/use-database-ready";

/**
 * Bug reportado por el usuario: en Modo Kiosco, en la pantalla "Confirmar
 * Identidad" (`asistencia/confirmar.tsx`), al tocar "regresar" con GPS
 * desactivado en el dispositivo, la app parecía "morir" (había que cerrarla
 * y volver a abrirla). Causa real: `locationService.ts` está diseñado para
 * NUNCA lanzar cuando el GPS no está disponible (permiso negado, servicios
 * apagados, sin señal) — es un caso esperado y ya manejado (devuelve `null`,
 * el registro sigue sin bloquearse), documentado así desde el principio. Pero
 * el `console.warn` que deja para depuración dispara el overlay de LogBox de
 * React Native en builds de desarrollo/Expo Go, y en un dispositivo Kiosco
 * donde el GPS simplemente nunca está disponible, ese overlay aparece en
 * TODAS las veces que se llega a esta pantalla — interceptando toques y, en
 * hardware limitado (una tablet de Kiosco de gama baja), dejando la UI
 * bloqueada. La solución no es dejar de registrar el warning (sigue siendo
 * útil verlo en la terminal de Metro) sino decirle a LogBox que no dibuje el
 * overlay para estos mensajes puntuales que ya sabemos que son esperados y
 * están manejados — mismo criterio para el warning análogo de
 * `cameraService.ts` (permiso de cámara/archivo inválido), que podría causar
 * el mismo problema en otras pantallas.
 */
LogBox.ignoreLogs([
  "[locationService] no se pudo obtener ubicación",
  "[locationService] no se pudo verificar el permiso de ubicación",
  "[cameraService] no se pudo verificar el permiso de cámara",
  "[cameraService] no se pudo verificar el archivo de foto",
]);

export default function RootLayout() {
  const { ready, error } = useDatabaseReady();

  return (
    <SafeAreaProvider>
      <AttendanceProvider>
        <StatusBar style="light" />
        {ready ? (
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "fade",
            }}
          />
        ) : (
          <DatabaseBootScreen error={error} />
        )}
      </AttendanceProvider>
    </SafeAreaProvider>
  );
}

/**
 * Se muestra mientras corren las migraciones/seeds de SQLite. Evita a propósito
 * cualquier className de NativeWind con los prefijos shadow-, opacity-, animate-
 * o el atajo de opacidad color/NN: ese patrón puede disparar el bug
 * "Couldn't find a navigation context" de NativeWind + Expo Router (ver notas
 * en src/constants/palette.ts).
 */
function DatabaseBootScreen({ error }: { error: string | null }) {
  return (
    <View className="flex-1 items-center justify-center bg-primary px-8">
      {error ? (
        <>
          <Text className="text-center text-base font-semibold text-white">
            No se pudo preparar la base de datos
          </Text>
          <Text className="mt-2 text-center text-sm" style={{ color: palette.white70 }}>
            {error}
          </Text>
        </>
      ) : (
        <>
          <ActivityIndicator size="large" color={palette.white} />
          <Text className="mt-4 text-center text-sm" style={{ color: palette.white70 }}>
            Preparando base de datos…
          </Text>
        </>
      )}
    </View>
  );
}
