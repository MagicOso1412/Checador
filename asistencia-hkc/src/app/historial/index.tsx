import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";

import { ScreenHeader } from "@/components/attendance/screen-header";
import { StatusPill } from "@/components/attendance/ui-rows";
import { palette } from "@/constants/palette";
import { STATUS_LABELS, STATUS_STYLES } from "@/lib/mock-data";
import { useHistorialStore } from "@/store/historialStore";
import { useProyectoStore } from "@/store/proyectoStore";
import { mapTipoRegistroToLabel } from "@/utils/tipoRegistro";

export default function HistoryScreen() {
  const proyectoSeleccionado = useProyectoStore((state) => state.proyectoSeleccionado);
  const { registros, cargando, error, cargarHistorial } = useHistorialStore();
  const [search, setSearch] = useState("");

  useEffect(() => {
    cargarHistorial(proyectoSeleccionado?.id);
  }, [cargarHistorial, proyectoSeleccionado?.id]);

  const filtered = useMemo(
    () =>
      registros.filter((r) => r.trabajadorNombre.toLowerCase().includes(search.toLowerCase())),
    [registros, search],
  );

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title="Historial Local"
        subtitle={
          proyectoSeleccionado
            ? `${registros.length} registros · ${proyectoSeleccionado.nombre}`
            : `${registros.length} registros`
        }
        onBack={() => router.back()}
        className="bg-primary pb-4"
      />

      <View className="border-b border-border px-4 py-3">
        <TextInput
          className="rounded-xl border border-border bg-input-background px-4 py-2.5 text-sm text-foreground"
          placeholder="Buscar por nombre…"
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
            onPress={() => cargarHistorial(proyectoSeleccionado?.id)}
            className="rounded-xl bg-primary px-5 py-2.5"
          >
            <Text className="text-sm font-semibold text-primary-foreground">Reintentar</Text>
          </Pressable>
        </View>
      ) : filtered.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-sm text-muted-foreground">
            Todavía no hay registros de asistencia.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          renderItem={({ item }) => {
            const statusKey = item.sincronizado ? "synced" : "pending";
            const style = STATUS_STYLES[statusKey];
            return (
              <View className="flex-row items-center gap-3 rounded-xl border border-border bg-card p-3">
                <View className="h-11 w-11 overflow-hidden rounded-xl bg-muted">
                  <Image
                    source={{ uri: item.fotoUri }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-foreground" numberOfLines={1}>
                    {item.trabajadorNombre}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {item.numeroEmpleado} ·{" "}
                    {item.fechaHora.toLocaleTimeString("es-MX", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    · {mapTipoRegistroToLabel(item.tipoRegistro)}
                  </Text>
                </View>
                <StatusPill
                  label={STATUS_LABELS[statusKey]}
                  bgClassName={style.bg}
                  textClassName={style.text}
                />
              </View>
            );
          }}
        />
      )}
    </View>
  );
}
