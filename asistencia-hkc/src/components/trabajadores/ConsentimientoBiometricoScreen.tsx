import { Pressable, ScrollView, Text, View } from "react-native";
import { ShieldCheck } from "lucide-react-native";

import { ScreenHeader } from "@/components/attendance/screen-header";
import { TEXTO_CONSENTIMIENTO_BIOMETRICO } from "@/constants/consentimientoBiometrico";
import { palette } from "@/constants/palette";
import { pressedStyle, shadowMd, shadowSm } from "@/constants/shadows";

/**
 * Pantalla de consentimiento biométrico — se muestra antes de abrir la
 * cámara en `trabajadores/fotos.tsx` cuando el trabajador no tiene un
 * consentimiento vigente para la versión actual del texto (ver
 * `domain/entities/ConsentimientoBiometrico.ts`). No es una ruta separada a
 * propósito: vive como un estado más dentro de `fotos.tsx` (mismo patrón que
 * `mostrandoCamara`), para no agregar otra entrada al historial de
 * navegación — la nota de `ARCHITECTURE.MD` sobre `push`/`replace` en el
 * wizard de asistencia aplica el mismo espíritu aquí: entre menos pantallas
 * intermedias, menos riesgo de dejar el back button en un estado raro.
 */
export function ConsentimientoBiometricoScreen({
  nombreTrabajador,
  guardando,
  onAceptar,
  onCancelar,
}: {
  nombreTrabajador?: string;
  guardando: boolean;
  onAceptar: () => void;
  onCancelar: () => void;
}) {
  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Consentimiento biométrico" subtitle={nombreTrabajador} onBack={onCancelar} />

      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 24, gap: 16 }}>
        <View className="flex-row items-center gap-2 rounded-2xl border border-border bg-card p-4" style={shadowSm}>
          <ShieldCheck size={20} color={palette.primary} />
          <Text className="flex-1 text-xs text-muted-foreground">
            Este paso es obligatorio antes de guardar fotos del rostro de un trabajador.
          </Text>
        </View>

        <View className="rounded-2xl border border-border bg-card p-4" style={shadowSm}>
          <Text className="text-sm leading-6 text-foreground">{TEXTO_CONSENTIMIENTO_BIOMETRICO}</Text>
        </View>
      </ScrollView>

      <View className="gap-2.5 border-t border-border bg-background px-4 pb-6 pt-3">
        <Pressable
          onPress={onAceptar}
          disabled={guardando}
          className="items-center rounded-2xl bg-primary py-4"
          style={({ pressed }) => [shadowMd, guardando && { opacity: 0.6 }, pressed && pressedStyle]}
        >
          <Text className="font-semibold text-primary-foreground">
            {guardando ? "Guardando…" : "Acepto — continuar"}
          </Text>
        </Pressable>
        <Pressable
          onPress={onCancelar}
          disabled={guardando}
          className="items-center rounded-2xl py-3.5"
          style={({ pressed }) => [guardando && { opacity: 0.6 }, pressed && pressedStyle]}
        >
          <Text className="text-sm font-semibold text-muted-foreground">No acepto por ahora</Text>
        </Pressable>
      </View>
    </View>
  );
}
