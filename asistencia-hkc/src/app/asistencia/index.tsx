import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { ChevronRight, User } from "lucide-react-native";

import { ScreenHeader } from "@/components/attendance/screen-header";
import { palette } from "@/constants/palette";
import { shadowSm } from "@/constants/shadows";
import { Trabajador } from "@/domain/entities/Trabajador";
import { useProyectoStore } from "@/store/proyectoStore";
import { useRegistroAsistenciaStore } from "@/store/registroAsistenciaStore";
import { useTrabajadorStore } from "@/store/trabajadorStore";

/**
 * Paso 1 del registro de asistencia: identificación del trabajador. Todavía
 * es selección manual de una lista (ver `store/trabajadorStore.ts`) — cuando
 * llegue el reconocimiento facial (Sprint 5) esta pantalla se reemplaza por
 * detección automática, pero el resto del flujo (capturar → confirmar →
 * éxito) no debería tener que cambiar.
 */
export default function SeleccionarTrabajadorScreen() {
  const proyectoSeleccionado = useProyectoStore((state) => state.proyectoSeleccionado);
  const { trabajadores, cargando, error, cargarTrabajadores } = useTrabajadorStore();
  const seleccionarTrabajador = useRegistroAsistenciaStore((state) => state.seleccionarTrabajador);
  const [search, setSearch] = useState("");

  useEffect(() => {
    cargarTrabajadores();
  }, [cargarTrabajadores]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return trabajadores.filter(
      (t) => t.nombreCompleto.toLowerCase().includes(term) || t.numeroEmpleado.includes(term),
    );
  }, [trabajadores, search]);

  const handleSelect = (trabajador: Trabajador) => {
    seleccionarTrabajador(trabajador);
    router.push("/asistencia/capturar");
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title="Identificar Trabajador"
        subtitle={proyectoSeleccionado?.nombre ?? "Selección manual"}
        onBack={() => router.back()}
      />

      <View className="border-b border-border bg-background px-4 py-3">
        <TextInput
          className="rounded-xl border border-border bg-input-background px-4 py-2.5 text-sm text-foreground"
          placeholder="Buscar por nombre o número de empleado…"
          placeholderTextColor={palette.mutedForeground}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {cargando ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <Text className="text-center text-sm text-destructive">{error}</Text>
          <Pressable
            onPress={() => cargarTrabajadores()}
            className="rounded-xl bg-primary px-5 py-2.5"
          >
            <Text className="text-sm font-semibold text-primary-foreground">Reintentar</Text>
          </Pressable>
        </View>
      ) : filtered.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-sm text-muted-foreground">
            No hay trabajadores disponibles.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handleSelect(item)}
              className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4"
              style={({ pressed }) => [shadowSm, pressed && { opacity: 0.9 }]}
            >
              <View
                className="h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: palette.primary10 }}
              >
                <User size={18} color={palette.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold leading-tight text-foreground">
                  {item.nombreCompleto}
                </Text>
                <Text className="mt-0.5 text-xs text-muted-foreground">
                  Núm. empleado: {item.numeroEmpleado}
                </Text>
              </View>
              <ChevronRight size={18} color={palette.mutedForeground} />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
