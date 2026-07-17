import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Camera, ChevronRight, History, Layers, RefreshCw, Wifi } from "lucide-react-native";

import { StatBlock } from "@/components/attendance/ui-rows";
import { palette } from "@/constants/palette";
import { shadowLg } from "@/constants/shadows";
import { useProyectoStore } from "@/store/proyectoStore";

export default function CampoMainScreen() {
  const proyectoSeleccionado = useProyectoStore((state) => state.proyectoSeleccionado);

  // Este hub asume un proyecto activo. Si se llega aquí sin uno (por ejemplo,
  // abriendo la app directo en esta ruta), se manda a elegir proyecto primero.
  useEffect(() => {
    if (!proyectoSeleccionado) {
      router.replace("/proyecto/seleccionar");
    }
  }, [proyectoSeleccionado]);

  if (!proyectoSeleccionado) {
    return <View className="flex-1 bg-background" />;
  }

  return (
    <View className="flex-1 bg-background">
      <View className="bg-primary px-4 pb-6 pt-14">
        <Pressable
          onPress={() => router.replace("/mode-select")}
          className="mb-3 flex-row items-center gap-1"
        >
          <Text className="text-sm" style={{ color: palette.white70 }}>
            ← Inicio
          </Text>
        </Pressable>
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="mb-1 text-xs uppercase tracking-wider" style={{ color: palette.white70 }}>
              Proyecto activo
            </Text>
            <Text className="text-xl font-bold leading-tight text-white">
              {proyectoSeleccionado.nombre}
            </Text>
          </View>
          <View
            className="mt-1 flex-row items-center gap-1 rounded-full px-2 py-1"
            style={{ backgroundColor: palette.green90030 }}
          >
            <Wifi size={11} color="#86efac" />
            <Text className="text-xs text-green-300">En línea</Text>
          </View>
        </View>
      </View>

      <View className="flex-1 gap-4 p-4">
        <Pressable
          onPress={() => router.push("/asistencia")}
          className="flex-row items-center justify-center gap-3 rounded-2xl bg-primary py-6"
          style={({ pressed }) => [shadowLg, pressed && { opacity: 0.9 }]}
        >
          <Camera size={24} color={palette.white} />
          <Text className="text-lg font-bold text-white">Registrar Asistencia</Text>
        </Pressable>

        <View className="flex-row gap-3">
          <Pressable
            onPress={() => router.push("/proyecto/seleccionar")}
            className="flex-1 items-center gap-2 rounded-xl border border-border bg-card py-4"
            style={({ pressed }) => pressed && { opacity: 0.9 }}
          >
            <Layers size={22} color={palette.primary} />
            <Text className="text-sm font-medium text-foreground">Cambiar Proyecto</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/sync")}
            className="flex-1 items-center gap-2 rounded-xl border border-border bg-card py-4"
            style={({ pressed }) => pressed && { opacity: 0.9 }}
          >
            <RefreshCw size={22} color={palette.primary} />
            <Text className="text-sm font-medium text-foreground">Sincronizar</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => router.push("/historial")}
          className="flex-row items-center justify-between rounded-xl border border-border bg-card px-5 py-4"
          style={({ pressed }) => pressed && { opacity: 0.9 }}
        >
          <View className="flex-row items-center gap-3">
            <History size={20} color="#6366f1" />
            <Text className="text-sm font-medium text-foreground">Historial local</Text>
          </View>
          <ChevronRight size={18} color={palette.mutedForeground} />
        </Pressable>

        <View className="mt-auto flex-row justify-around gap-2 rounded-xl bg-muted p-3">
          <StatBlock label="Entradas hoy" value="—" />
          <StatBlock label="Pendientes" value="—" />
          <StatBlock label="Sync" value="—" small />
        </View>
      </View>
    </View>
  );
}
