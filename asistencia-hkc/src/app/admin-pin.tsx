import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Lock } from "lucide-react-native";

import { ScreenHeader } from "@/components/attendance/screen-header";
import { palette } from "@/constants/palette";
import { shadowMd, shadowSm } from "@/constants/shadows";
import { useAdminPinStore } from "@/store/adminPinStore";

const LONGITUD_MINIMA = 4;

/**
 * Puerta de entrada a `/admin`. Tres modos, según el estado del dispositivo
 * y el parámetro `modo` de la ruta:
 *
 * - Sin PIN configurado todavía → pide crear uno (nuevo + confirmar).
 * - Con PIN configurado, entrada normal (`mode-select.tsx` navega aquí en
 *   vez de a `/admin` directo) → pide el PIN existente.
 * - `?modo=cambiar` (desde un botón dentro de `admin.tsx`) → pide el PIN
 *   actual y uno nuevo, para cambiarlo sin tener que borrar datos del
 *   dispositivo.
 */
export default function AdminPinScreen() {
  const { modo } = useLocalSearchParams<{ modo?: string }>();
  const { cargando, tienePin, verificarEstado, configurar, verificar, cambiar } = useAdminPinStore();

  const [pin, setPin] = useState("");
  const [pinConfirmar, setPinConfirmar] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    verificarEstado();
  }, [verificarEstado]);

  if (cargando || tienePin === null) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    );
  }

  const modoCambiar = modo === "cambiar";
  const modoConfigurar = !modoCambiar && tienePin === false;

  const handleConfigurar = async () => {
    if (pin.length < LONGITUD_MINIMA) {
      setError(`El PIN debe tener al menos ${LONGITUD_MINIMA} dígitos`);
      return;
    }
    if (pin !== pinConfirmar) {
      setError("Los PIN no coinciden");
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      await configurar(pin);
      router.replace("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el PIN");
    } finally {
      setEnviando(false);
    }
  };

  const handleVerificar = async () => {
    setEnviando(true);
    setError(null);
    try {
      const esValido = await verificar(pin);
      if (esValido) {
        router.replace("/admin");
      } else {
        setError("PIN incorrecto");
        setPin("");
      }
    } finally {
      setEnviando(false);
    }
  };

  const handleCambiar = async () => {
    if (pinConfirmar.length < LONGITUD_MINIMA) {
      setError(`El PIN nuevo debe tener al menos ${LONGITUD_MINIMA} dígitos`);
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      const ok = await cambiar(pin, pinConfirmar);
      if (ok) {
        router.back();
      } else {
        setError("El PIN actual no es correcto");
        setPin("");
      }
    } finally {
      setEnviando(false);
    }
  };

  const titulo = modoCambiar ? "Cambiar PIN de administrador" : modoConfigurar ? "Configurar PIN" : "PIN de administrador";

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={titulo} onBack={() => router.back()} />

      <View className="flex-1 items-center justify-center gap-4 px-6">
        <View
          className="h-14 w-14 items-center justify-center rounded-full"
          style={{ backgroundColor: palette.primary10 }}
        >
          <Lock size={24} color={palette.primary} />
        </View>

        <View className="w-full max-w-xs gap-3 rounded-2xl border border-border bg-card p-5" style={shadowSm}>
          {modoConfigurar || modoCambiar ? (
            <Text className="text-center text-sm text-muted-foreground">
              Este PIN protege la configuración de este dispositivo (proyecto asignado,
              trabajadores, ajustes) — no está relacionado con el portal de RH.
            </Text>
          ) : null}

          {modoCambiar ? (
            <>
              <Campo label="PIN actual" value={pin} onChangeText={setPin} />
              <Campo label="PIN nuevo" value={pinConfirmar} onChangeText={setPinConfirmar} />
            </>
          ) : modoConfigurar ? (
            <>
              <Campo label="Nuevo PIN" value={pin} onChangeText={setPin} />
              <Campo label="Confirmar PIN" value={pinConfirmar} onChangeText={setPinConfirmar} />
            </>
          ) : (
            <Campo label="PIN" value={pin} onChangeText={setPin} autoFocus />
          )}

          {error ? <Text className="text-center text-sm text-destructive">{error}</Text> : null}

          <Pressable
            onPress={modoCambiar ? handleCambiar : modoConfigurar ? handleConfigurar : handleVerificar}
            disabled={enviando || pin.length === 0}
            className="items-center rounded-xl bg-primary py-3.5"
            style={({ pressed }) => [shadowMd, (enviando || pin.length === 0) && { opacity: 0.6 }, pressed && { opacity: 0.9 }]}
          >
            <Text className="font-semibold text-primary-foreground">
              {enviando ? "Verificando…" : modoCambiar ? "Cambiar PIN" : modoConfigurar ? "Guardar PIN" : "Entrar"}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function Campo({
  label,
  value,
  onChangeText,
  autoFocus,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  autoFocus?: boolean;
}) {
  return (
    <View className="gap-1.5">
      <Text className="text-xs font-medium text-muted-foreground">{label}</Text>
      <TextInput
        className="rounded-lg border border-border bg-input-background px-3 py-2.5 text-center text-lg tracking-widest text-foreground"
        value={value}
        onChangeText={(text) => onChangeText(text.replace(/[^0-9]/g, ""))}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={8}
        autoFocus={autoFocus}
        placeholderTextColor={palette.mutedForeground}
      />
    </View>
  );
}
