import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { ChevronRight, Plus, User } from "lucide-react-native";

import { ScreenHeader } from "@/components/attendance/screen-header";
import { StatusPill } from "@/components/attendance/ui-rows";
import { palette } from "@/constants/palette";
import { shadowSm } from "@/constants/shadows";
import { Trabajador } from "@/domain/entities/Trabajador";
import { useTrabajadoresAdminStore } from "@/store/trabajadoresAdminStore";

/** Administración de trabajadores (Sprint 3): lista con alta/baja/edición. */
export default function TrabajadoresListScreen() {
  const { trabajadores, cargando, error, cargarTrabajadores } = useTrabajadoresAdminStore();
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

  const handleOpen = (trabajador?: Trabajador) => {
    router.push(trabajador ? { pathname: "/trabajadores/form", params: { id: trabajador.id } } : "/trabajadores/form");
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title="Trabajadores"
        subtitle={cargando ? "Cargando…" : `${trabajadores.length} registrados`}
        onBack={() => router.back()}
        right={
          <Pressable
            onPress={() => handleOpen()}
            className="h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: palette.white10 }}
          >
            <Plus size={18} color={palette.white} />
          </Pressable>
        }
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
            {search ? "Sin resultados." : "Todavía no hay trabajadores registrados."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handleOpen(item)}
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
              <StatusPill
                label={item.activo ? "Activo" : "Inactivo"}
                bgClassName={item.activo ? "bg-green-100" : "bg-slate-100"}
                textClassName={item.activo ? "text-green-700" : "text-slate-500"}
              />
              <ChevronRight size={18} color={palette.mutedForeground} />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
