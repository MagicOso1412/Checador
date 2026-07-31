import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Camera, Plus, Trash2 } from "lucide-react-native";

import CameraCapture from "@/components/CameraCapture";
import { ScreenHeader } from "@/components/attendance/screen-header";
import { palette } from "@/constants/palette";
import { shadowSm } from "@/constants/shadows";
import type { FotoReferenciaFacial } from "@/domain/entities/FotoReferenciaFacial";
import type { SavedPhoto } from "@/infrastructure/camera/cameraService";
import { MAXIMO_FOTOS_POR_TRABAJADOR, useFotosReferenciaStore } from "@/store/fotosReferenciaStore";
import { useTrabajadoresAdminStore } from "@/store/trabajadoresAdminStore";

/**
 * Captura y gestión de fotos de referencia de un trabajador (Sprint 5,
 * Fase 1). Solo guarda fotos hoy — no genera embeddings ni reconoce nada
 * (ver `application/ports/IReconocimientoFacialService.ts` para el porqué
 * eso es una fase aparte). Entra desde `trabajadores/index.tsx`.
 */
export default function FotosReferenciaScreen() {
  const { id: trabajadorId } = useLocalSearchParams<{ id: string }>();
  const { fotos, cargando, guardando, error, cargarFotos, capturarFoto, eliminarFoto } =
    useFotosReferenciaStore();
  const { obtenerPorId } = useTrabajadoresAdminStore();

  const [nombreTrabajador, setNombreTrabajador] = useState("");
  const [mostrandoCamara, setMostrandoCamara] = useState(false);

  useEffect(() => {
    if (!trabajadorId) return;
    cargarFotos(trabajadorId);
    obtenerPorId(trabajadorId).then((t) => setNombreTrabajador(t?.nombreCompleto ?? ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trabajadorId]);

  const handleCaptured = async (photo: SavedPhoto) => {
    setMostrandoCamara(false);
    try {
      await capturarFoto(trabajadorId, photo.uri);
    } catch (err) {
      Alert.alert("No se pudo guardar", err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const handleEliminar = (foto: FotoReferenciaFacial) => {
    Alert.alert("Eliminar foto", "¿Eliminar esta foto de referencia?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: () => eliminarFoto(foto) },
    ]);
  };

  if (mostrandoCamara) {
    return (
      <View className="flex-1 bg-[#06080f]">
        <CameraCapture onCaptured={handleCaptured} />
      </View>
    );
  }

  const alcanzoLimite = fotos.length >= MAXIMO_FOTOS_POR_TRABAJADOR;

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title="Fotos de referencia"
        subtitle={nombreTrabajador || undefined}
        onBack={() => router.back()}
        right={
          <Pressable
            onPress={() => setMostrandoCamara(true)}
            disabled={alcanzoLimite || guardando}
            className="h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: palette.white10, opacity: alcanzoLimite || guardando ? 0.4 : 1 }}
          >
            <Plus size={18} color={palette.white} />
          </Pressable>
        }
      />

      <Text className="px-4 pt-3 text-xs text-muted-foreground">
        {fotos.length} de {MAXIMO_FOTOS_POR_TRABAJADOR} fotos · varias muestras ayudan a que el
        reconocimiento futuro sea más confiable (distintos ángulos, luz, con/sin lentes).
      </Text>

      {cargando ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-sm text-destructive">{error}</Text>
        </View>
      ) : fotos.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <Camera size={32} color={palette.mutedForeground} />
          <Text className="text-center text-sm text-muted-foreground">
            Todavía no hay fotos de referencia. Toca "+" para capturar la primera.
          </Text>
        </View>
      ) : (
        <FlatList
          data={fotos}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          columnWrapperStyle={{ gap: 12 }}
          renderItem={({ item }) => (
            <View className="flex-1 overflow-hidden rounded-2xl border border-border bg-card" style={shadowSm}>
              <Image source={{ uri: item.fotoUri }} style={{ width: "100%", aspectRatio: 1 }} />
              <Pressable
                onPress={() => handleEliminar(item)}
                className="flex-row items-center justify-center gap-1.5 py-2.5"
                style={({ pressed }) => pressed && { opacity: 0.7 }}
              >
                <Trash2 size={14} color={palette.destructive} />
                <Text className="text-xs font-semibold text-destructive">Eliminar</Text>
              </Pressable>
            </View>
          )}
        />
      )}
    </View>
  );
}
