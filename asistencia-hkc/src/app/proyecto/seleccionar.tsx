import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Building2, ChevronRight } from "lucide-react-native";

import { ScreenHeader } from "@/components/attendance/screen-header";
import { palette } from "@/constants/palette";
import { shadowSm } from "@/constants/shadows";
import { Proyecto } from "@/domain/entities/Proyecto";
import { useProyectoStore } from "@/store/proyectoStore";

/**
 * Selección de proyecto. Los proyectos vienen de SQLite (a través de
 * ObtenerProyectosUseCase / proyectoStore), no de datos mock. Al seleccionar
 * uno, queda guardado en el store (y persistido — ver proyectoStore.ts).
 *
 * Se reutiliza para dos casos con destino distinto (parámetro `next`):
 * - Modo Campo (default, sin `next`): siempre se muestra explícitamente al
 *   entrar y navega a `/asistencia` (identificar trabajador).
 * - Modo Kiosco (`next=kiosco`): solo se muestra la primera vez que el
 *   dispositivo no tiene proyecto asignado (ver guard en `kiosco/index.tsx`);
 *   navega de regreso a `/kiosco`, que ya no volverá a pedirlo mientras el
 *   proyecto persistido siga siendo válido.
 */
export default function ProjectSelectScreen() {
  const { next } = useLocalSearchParams<{ next?: string }>();
  const destino = next === "kiosco" ? "/kiosco" : "/asistencia";
  const { proyectos, cargando, error, cargarProyectos, seleccionarProyecto } =
    useProyectoStore();
  const [search, setSearch] = useState("");

  useEffect(() => {
    cargarProyectos();
  }, [cargarProyectos]);

  const filtered = useMemo(
    () => proyectos.filter((p) => p.nombre.toLowerCase().includes(search.toLowerCase())),
    [proyectos, search],
  );

  const handleSelect = (proyecto: Proyecto) => {
    seleccionarProyecto(proyecto);
    router.replace(destino);
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title="Seleccionar Proyecto"
        subtitle={
          cargando ? "Cargando…" : `${proyectos.length} proyecto${proyectos.length === 1 ? "" : "s"} disponible${proyectos.length === 1 ? "" : "s"}`
        }
        onBack={() => router.back()}
        className="bg-primary pb-4"
      />

      <View className="border-b border-border bg-background px-4 py-3">
        <TextInput
          className="rounded-xl border border-border bg-input-background px-4 py-2.5 text-sm text-foreground"
          placeholder="Buscar proyecto…"
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
            onPress={() => cargarProyectos()}
            className="rounded-xl bg-primary px-5 py-2.5"
          >
            <Text className="text-sm font-semibold text-primary-foreground">Reintentar</Text>
          </Pressable>
        </View>
      ) : filtered.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-sm text-muted-foreground">
            No hay proyectos disponibles todavía.
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
                className="h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: palette.primary10 }}
              >
                <Building2 size={18} color={palette.primary} />
              </View>
              <Text className="flex-1 text-sm font-semibold leading-tight text-foreground">
                {item.nombre}
              </Text>
              <ChevronRight size={18} color={palette.mutedForeground} />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
