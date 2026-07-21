import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Trash2 } from "lucide-react-native";

import { ScreenHeader } from "@/components/attendance/screen-header";
import { palette } from "@/constants/palette";
import { shadowMd, shadowSm } from "@/constants/shadows";
import { useProyectosAdminStore } from "@/store/proyectosAdminStore";

/** Alta y edición de proyectos en un solo formulario (modo según si viene `id` en la ruta). */
export default function ProyectoFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const esEdicion = Boolean(id);

  const { obtenerPorId, crearProyecto, actualizarProyecto, eliminarProyecto, guardando } =
    useProyectosAdminStore();

  const [cargandoInicial, setCargandoInicial] = useState(esEdicion);
  const [nombre, setNombre] = useState("");
  const [activo, setActivo] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const proyecto = await obtenerPorId(id);
      if (proyecto) {
        setNombre(proyecto.nombre);
        setActivo(proyecto.activo);
      } else {
        setError("No se encontró el proyecto");
      }
      setCargandoInicial(false);
    })();
  }, [id, obtenerPorId]);

  const handleGuardar = async () => {
    setError(null);
    try {
      if (esEdicion && id) {
        await actualizarProyecto({ id, nombre, activo });
      } else {
        await crearProyecto({ nombre });
      }
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el proyecto");
    }
  };

  const handleEliminar = () => {
    if (!id) return;
    Alert.alert(
      "Dar de baja proyecto",
      "El proyecto dejará de estar disponible para nuevos registros de asistencia, pero su historial se conserva. ¿Continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Dar de baja",
          style: "destructive",
          onPress: async () => {
            try {
              await eliminarProyecto(id);
              router.back();
            } catch (err) {
              setError(err instanceof Error ? err.message : "No se pudo dar de baja al proyecto");
            }
          },
        },
      ],
    );
  };

  if (cargandoInicial) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title={esEdicion ? "Editar Proyecto" : "Nuevo Proyecto"}
        onBack={() => router.back()}
      />

      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 24, gap: 16 }}>
        <View className="gap-3 rounded-2xl border border-border bg-card p-4" style={shadowSm}>
          <Field label="Nombre del proyecto" value={nombre} onChangeText={setNombre} />
        </View>

        {esEdicion ? (
          <Pressable
            onPress={() => setActivo((v) => !v)}
            className={`flex-row items-center justify-between rounded-2xl border-2 p-4 ${
              activo ? "border-green-200 bg-green-50" : "border-border bg-muted"
            }`}
          >
            <Text className="text-sm font-medium text-foreground">
              {activo ? "Proyecto activo" : "Proyecto inactivo"}
            </Text>
            <Text className={`text-sm font-semibold ${activo ? "text-green-700" : "text-muted-foreground"}`}>
              {activo ? "Desactivar" : "Reactivar"}
            </Text>
          </Pressable>
        ) : null}

        {error ? <Text className="text-center text-sm text-destructive">{error}</Text> : null}

        <Pressable
          onPress={handleGuardar}
          disabled={guardando}
          className="items-center rounded-2xl bg-primary py-4"
          style={({ pressed }) => [shadowMd, guardando && { opacity: 0.6 }, pressed && { opacity: 0.9 }]}
        >
          <Text className="font-semibold text-primary-foreground">
            {guardando ? "Guardando…" : "Guardar"}
          </Text>
        </Pressable>

        {esEdicion ? (
          <Pressable
            onPress={handleEliminar}
            disabled={guardando}
            className="flex-row items-center justify-center gap-2 rounded-2xl py-3.5"
            style={({ pressed }) => [
              { borderWidth: 1, borderColor: palette.destructive40 },
              pressed && { opacity: 0.9 },
            ]}
          >
            <Trash2 size={16} color={palette.destructive} />
            <Text className="text-sm font-semibold text-destructive">Dar de baja</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
}) {
  return (
    <View className="gap-1.5">
      <Text className="text-xs font-medium text-muted-foreground">{label}</Text>
      <TextInput
        className="rounded-lg border border-border bg-input-background px-3 py-2.5 text-sm text-foreground"
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={palette.mutedForeground}
      />
    </View>
  );
}
