import "@/global.css";

import { ActivityIndicator, Text, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { palette } from "@/constants/palette";
import { AttendanceProvider } from "@/context/attendance-context";
import { useDatabaseReady } from "@/hooks/use-database-ready";

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
