import { useEffect } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { ArrowLeft, User, Wifi } from "lucide-react-native";

import { palette } from "@/constants/palette";
import { useClock } from "@/hooks/use-clock";
import { useProyectoStore } from "@/store/proyectoStore";

const CORNERS = [
  "left-0 top-0 rounded-tl-2xl border-l-2 border-t-2",
  "right-0 top-0 rounded-tr-2xl border-r-2 border-t-2",
  "bottom-0 left-0 rounded-bl-2xl border-b-2 border-l-2",
  "bottom-0 right-0 rounded-br-2xl border-b-2 border-r-2",
];

/**
 * Pantalla de espera del Modo Kiosco: dispositivo fijo, se asume conectado a
 * internet todo el tiempo (a diferencia de Campo, que es offline-tolerant).
 * El proyecto es una propiedad del dispositivo, no algo que se elija en cada
 * registro (ver proyectoStore.ts: se persiste en `configuracion_dispositivo`,
 * SQLite). Si el dispositivo todavía no tiene uno asignado (primer uso), se
 * manda una sola vez a elegirlo; de ahí en adelante esta pantalla ya no
 * vuelve a preguntarlo.
 *
 * `proyectoSeleccionado` arranca en `null` en memoria incluso si ya hay uno
 * persistido — la restauración ocurre dentro de `cargarProyectos()` (es
 * async, lee SQLite). Por eso esta pantalla llama `cargarProyectos()` ella
 * misma al montar y espera a que termine (`cargando`) antes de decidir si
 * redirigir a elegir proyecto; si el guard mirara solo `proyectoSeleccionado`
 * sin esperar la carga, redirigiría de más en cada reinicio de la app.
 */
export default function KioskMainScreen() {
  const now = useClock();
  const { proyectoSeleccionado, cargando, cargarProyectos } = useProyectoStore();

  useEffect(() => {
    cargarProyectos();
  }, [cargarProyectos]);

  useEffect(() => {
    if (!cargando && !proyectoSeleccionado) {
      router.replace({ pathname: "/proyecto/seleccionar", params: { next: "kiosco" } });
    }
  }, [cargando, proyectoSeleccionado]);

  if (cargando || !proyectoSeleccionado) {
    return (
      <View className="flex-1 items-center justify-center bg-[#0a0f1a]">
        <ActivityIndicator color={palette.white50} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0a0f1a]">
      <View className="flex-row items-center justify-between px-4 pb-3 pt-14">
        <Pressable onPress={() => router.back()}>
          <ArrowLeft size={20} color={palette.white50} />
        </Pressable>
        <View className="items-center">
          <Text className="text-4xl font-bold tracking-tight text-white">
            {now.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
          </Text>
          <Text className="mt-0.5 text-xs capitalize" style={{ color: palette.white50 }}>
            {now.toLocaleDateString("es-MX", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </Text>
        </View>
        <Wifi size={12} color="#4ade80" />
      </View>

      <View className="mb-3 px-4">
        <Text
          className="text-center text-xs uppercase tracking-widest"
          style={{ color: palette.white60 }}
        >
          {proyectoSeleccionado.nombre}
        </Text>
      </View>

      <View className="mx-4 mb-4 flex-1 items-center justify-center overflow-hidden rounded-2xl bg-[#111827]">
        <View className="relative h-64 w-52">
          {CORNERS.map((corner, i) => (
            <View
              key={i}
              className={`absolute h-8 w-8 ${corner}`}
              style={{ borderColor: palette.white60 }}
            />
          ))}
          <View className="absolute inset-0 items-center justify-center">
            <User size={80} color="rgba(255,255,255,0.1)" />
          </View>
        </View>
      </View>

      <View className="gap-3 px-4 pb-8">
        <Text className="text-center text-sm" style={{ color: palette.white70 }}>
          Colócate frente a la cámara para registrar tu asistencia
        </Text>
        <Pressable
          onPress={() => router.push("/asistencia/capturar")}
          className="items-center rounded-2xl py-4"
          style={({ pressed }) => [
            { backgroundColor: palette.primary },
            pressed && { opacity: 0.9 },
          ]}
        >
          <Text className="text-base font-semibold text-white">Iniciar reconocimiento</Text>
        </Pressable>
      </View>
    </View>
  );
}
