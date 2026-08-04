import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Camera, Plus, ShieldOff, Trash2 } from "lucide-react-native";

import CameraCapture from "@/components/CameraCapture";
import { ConsentimientoBiometricoScreen } from "@/components/trabajadores/ConsentimientoBiometricoScreen";
import { ScreenHeader } from "@/components/attendance/screen-header";
import { palette } from "@/constants/palette";
import { shadowSm } from "@/constants/shadows";
import type { FotoReferenciaFacial } from "@/domain/entities/FotoReferenciaFacial";
import { esArchivoDeFotoValido, type SavedPhoto } from "@/infrastructure/camera/cameraService";
import { useConsentimientoBiometricoStore } from "@/store/consentimientoBiometricoStore";
import { MAXIMO_FOTOS_POR_TRABAJADOR, useFotosReferenciaStore } from "@/store/fotosReferenciaStore";
import { useTrabajadoresAdminStore } from "@/store/trabajadoresAdminStore";

/**
 * Guía de pose por número de foto (0-indexado por cuántas ya existen). Pura
 * UI — no valida nada, solo sugiere variedad de ángulo/luz/accesorios, que es
 * justo lo que un futuro motor de reconocimiento necesita para ser
 * confiable (ver la nota de "varias muestras" en la migración 008).
 */
const GUIAS_POSE = [
  "De frente, mirando directo a la cámara",
  "Gira un poco el rostro hacia la izquierda",
  "Gira un poco el rostro hacia la derecha",
  "Busca buena luz, sin sombras fuertes en la cara",
  "Con lentes o gorra, si los usas normalmente en obra",
];

function GuiaEncuadre({ indice, total }: { indice: number; total: number }) {
  return (
    <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
      <View
        className="rounded-full border-2 border-dashed"
        style={{ width: 190, height: 240, borderColor: palette.white50 }}
      />
      <View className="absolute bottom-8 left-6 right-6 items-center rounded-xl bg-black/50 px-3 py-2">
        <Text className="text-center text-xs font-semibold text-white">
          Foto {indice + 1} de {total}
        </Text>
        <Text className="mt-0.5 text-center text-xs" style={{ color: palette.white70 }}>
          {GUIAS_POSE[indice] ?? "Encuadra tu rostro dentro del óvalo"}
        </Text>
      </View>
    </View>
  );
}

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
  const {
    consentimiento,
    guardando: guardandoConsentimiento,
    cargarConsentimiento,
    otorgarConsentimiento,
    revocarConsentimiento,
  } = useConsentimientoBiometricoStore();
  const { obtenerPorId } = useTrabajadoresAdminStore();

  const [nombreTrabajador, setNombreTrabajador] = useState("");
  const [mostrandoCamara, setMostrandoCamara] = useState(false);
  const [mostrandoConsentimiento, setMostrandoConsentimiento] = useState(false);

  useEffect(() => {
    if (!trabajadorId) return;
    cargarFotos(trabajadorId);
    cargarConsentimiento(trabajadorId);
    obtenerPorId(trabajadorId).then((t) => setNombreTrabajador(t?.nombreCompleto ?? ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trabajadorId]);

  // Gate obligatorio: sin consentimiento vigente para la versión actual del
  // texto (ver `ConsentimientoBiometrico.cubreVersionActual`), no se abre la
  // cámara — se muestra el paso de consentimiento primero.
  const handleAbrirCaptura = () => {
    if (!consentimiento?.cubreVersionActual) {
      setMostrandoConsentimiento(true);
    } else {
      setMostrandoCamara(true);
    }
  };

  const handleConsentimientoAceptado = async () => {
    try {
      await otorgarConsentimiento(trabajadorId);
      setMostrandoConsentimiento(false);
      setMostrandoCamara(true);
    } catch (err) {
      Alert.alert("No se pudo guardar", err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const handleRevocarConsentimiento = () => {
    Alert.alert(
      "Revocar consentimiento",
      "Se eliminarán también todas las fotos de referencia guardadas de este trabajador. ¿Continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Revocar y borrar fotos",
          style: "destructive",
          onPress: async () => {
            try {
              await revocarConsentimiento(trabajadorId);
              await cargarFotos(trabajadorId);
            } catch (err) {
              Alert.alert("No se pudo revocar", err instanceof Error ? err.message : "Error desconocido");
            }
          },
        },
      ],
    );
  };

  const handleCaptured = async (photo: SavedPhoto) => {
    const valida = await esArchivoDeFotoValido(photo.uri);
    if (!valida) {
      Alert.alert(
        "Foto no válida",
        "La cámara no guardó la foto correctamente. Vuelve a intentarlo.",
        [{ text: "Reintentar", onPress: () => setMostrandoCamara(true) }],
      );
      setMostrandoCamara(false);
      return;
    }

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

  if (mostrandoConsentimiento) {
    return (
      <ConsentimientoBiometricoScreen
        nombreTrabajador={nombreTrabajador}
        guardando={guardandoConsentimiento}
        onAceptar={handleConsentimientoAceptado}
        onCancelar={() => setMostrandoConsentimiento(false)}
      />
    );
  }

  if (mostrandoCamara) {
    return (
      <View className="flex-1 bg-[#06080f]">
        <CameraCapture
          onCaptured={handleCaptured}
          overlay={<GuiaEncuadre indice={fotos.length} total={MAXIMO_FOTOS_POR_TRABAJADOR} />}
        />
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
            onPress={handleAbrirCaptura}
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

      {consentimiento?.cubreVersionActual ? (
        <Pressable
          onPress={handleRevocarConsentimiento}
          className="mx-4 mt-2 flex-row items-center gap-1.5"
        >
          <ShieldOff size={13} color={palette.mutedForeground} />
          <Text className="text-xs text-muted-foreground" style={{ textDecorationLine: "underline" }}>
            Revocar consentimiento biométrico
          </Text>
        </Pressable>
      ) : null}

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
