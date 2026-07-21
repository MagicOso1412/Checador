import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, Text, TextInput, View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Download } from "lucide-react-native";

import { ScreenHeader } from "@/components/attendance/screen-header";
import { StatusPill } from "@/components/attendance/ui-rows";
import { palette } from "@/constants/palette";
import { STATUS_LABELS, STATUS_STYLES } from "@/lib/mock-data";
import { useHistorialStore } from "@/store/historialStore";
import { useProyectoStore } from "@/store/proyectoStore";
import { mapTipoRegistroToLabel } from "@/utils/tipoRegistro";

export default function HistoryScreen() {
  const proyectoSeleccionado = useProyectoStore((state) => state.proyectoSeleccionado);
  const { registros, cargando, error, cargarHistorial, exportando, exportarCsv } = useHistorialStore();
  const [search, setSearch] = useState("");

  useEffect(() => {
    cargarHistorial(proyectoSeleccionado?.id);
  }, [cargarHistorial, proyectoSeleccionado?.id]);

  const filtered = useMemo(
    () =>
      registros.filter((r) => r.trabajadorNombre.toLowerCase().includes(search.toLowerCase())),
    [registros, search],
  );

  const resumen = useMemo(() => {
    const sincronizados = registros.filter((r) => r.sincronizado).length;
    const porTipo = new Map<string, number>();
    for (const r of registros) {
      const label = mapTipoRegistroToLabel(r.tipoRegistro);
      porTipo.set(label, (porTipo.get(label) ?? 0) + 1);
    }
    return {
      total: registros.length,
      sincronizados,
      pendientes: registros.length - sincronizados,
      porTipo: Array.from(porTipo.entries()),
    };
  }, [registros]);

  const handleExportar = async () => {
    try {
      const { guardadoEn, totalRegistros } = await exportarCsv(proyectoSeleccionado?.id);
      Alert.alert(
        "Exportación lista",
        `${totalRegistros} registro(s) exportados.\n${guardadoEn}`,
      );
    } catch (err) {
      Alert.alert(
        "No se pudo exportar",
        err instanceof Error ? err.message : "Error desconocido al exportar el historial",
      );
    }
  };

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
        right={
          <Pressable
            onPress={handleExportar}
            disabled={exportando || registros.length === 0}
            className="h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: palette.white10, opacity: exportando || registros.length === 0 ? 0.5 : 1 }}
          >
            {exportando ? (
              <ActivityIndicator size="small" color={palette.white} />
            ) : (
              <Download size={18} color={palette.white} />
            )}
          </Pressable>
        }
      />

      {registros.length > 0 ? (
        <View className="gap-2 border-b border-border bg-background px-4 py-3">
          <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Resumen
          </Text>
          <View className="flex-row flex-wrap gap-2">
            <ResumenChip label="Total" valor={resumen.total} />
            <ResumenChip label="Sincronizados" valor={resumen.sincronizados} />
            <ResumenChip label="Pendientes" valor={resumen.pendientes} />
            {resumen.porTipo.map(([label, valor]) => (
              <ResumenChip key={label} label={label} valor={valor} />
            ))}
          </View>
        </View>
      ) : null}

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

function ResumenChip({ label, valor }: { label: string; valor: number }) {
  return (
    <View className="rounded-full border border-border bg-card px-3 py-1.5">
      <Text className="text-xs font-medium text-foreground">
        {label}: <Text className="font-semibold text-primary">{valor}</Text>
      </Text>
    </View>
  );
}
