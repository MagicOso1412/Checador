import { useEffect, useState } from "react";
import { ActivityIndicator, Text, TextInput, View, Pressable } from "react-native";
import { router } from "expo-router";
import { CheckCircle, XCircle } from "lucide-react-native";

import { ScreenHeader } from "@/components/attendance/screen-header";
import { palette } from "@/constants/palette";
import { shadowMd, shadowSm } from "@/constants/shadows";
import { verificarConexionServidor } from "@/infrastructure/sync/verificarConexionServidor";
import { useConfiguracionStore } from "@/store/configuracionStore";

type EstadoPrueba = "inactivo" | "probando" | "ok" | "error";

/**
 * URL del backend + API key del dispositivo (Sprint 4). Pantalla aparte de
 * `configuracion/index.tsx` (no un campo inline en la lista) porque una API
 * key merece más espacio y un botón de "Probar conexión" — la lista general
 * de ajustes es de un toque, esto necesita texto libre y feedback.
 */
export default function ConfiguracionServidorScreen() {
  const { servidorUrl, servidorApiKey, cargarConfiguracion, setServidor } = useConfiguracionStore();

  const [url, setUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [estadoPrueba, setEstadoPrueba] = useState<EstadoPrueba>("inactivo");
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    cargarConfiguracion();
  }, [cargarConfiguracion]);

  useEffect(() => {
    setUrl(servidorUrl);
    setApiKey(servidorApiKey);
  }, [servidorUrl, servidorApiKey]);

  const probarConexion = async () => {
    if (!url.trim()) return;
    setEstadoPrueba("probando");
    const ok = await verificarConexionServidor(url.trim());
    setEstadoPrueba(ok ? "ok" : "error");
  };

  const guardar = () => {
    setServidor(url.trim(), apiKey.trim());
    setGuardado(true);
    setTimeout(() => router.back(), 500);
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Servidor de sincronización" onBack={() => router.back()} className="bg-primary pb-4" />

      <View className="gap-4 p-4">
        <Text className="text-xs text-muted-foreground">
          URL y clave de API que te dio el administrador al dar de alta este dispositivo
          (`npm run crear-dispositivo` en `hkc-backend`). Se usan para enviar las
          asistencias pendientes cuando entras a "Sincronización" — no afecta el registro
          local, que sigue funcionando sin esto.
        </Text>

        <View className="gap-3 rounded-2xl border border-border bg-card p-4" style={shadowSm}>
          <Campo
            label="URL del servidor"
            placeholder="http://192.168.1.50:3000"
            value={url}
            onChangeText={(v) => {
              setUrl(v);
              setEstadoPrueba("inactivo");
            }}
            autoCapitalize="none"
            keyboardType="url"
          />
          <Campo
            label="Clave de API del dispositivo"
            placeholder="Pega aquí la api_key"
            value={apiKey}
            onChangeText={setApiKey}
            autoCapitalize="none"
            secureTextEntry
          />

          <Pressable
            onPress={probarConexion}
            disabled={!url.trim() || estadoPrueba === "probando"}
            className="flex-row items-center justify-center gap-2 rounded-xl bg-card py-3"
            style={({ pressed }) => [
              { borderWidth: 1, borderColor: palette.border },
              (!url.trim() || estadoPrueba === "probando") && { opacity: 0.6 },
              pressed && { opacity: 0.9 },
            ]}
          >
            {estadoPrueba === "probando" ? (
              <ActivityIndicator size="small" color={palette.primary} />
            ) : estadoPrueba === "ok" ? (
              <CheckCircle size={16} color="#16a34a" />
            ) : estadoPrueba === "error" ? (
              <XCircle size={16} color={palette.destructive} />
            ) : null}
            <Text className="text-sm font-semibold text-foreground">
              {estadoPrueba === "probando"
                ? "Probando…"
                : estadoPrueba === "ok"
                  ? "Conexión exitosa"
                  : estadoPrueba === "error"
                    ? "No se pudo conectar"
                    : "Probar conexión"}
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={guardar}
          className="items-center rounded-xl bg-primary py-3.5"
          style={({ pressed }) => [shadowMd, pressed && { opacity: 0.9 }]}
        >
          <Text className="font-semibold text-primary-foreground">
            {guardado ? "Guardado ✓" : "Guardar"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function Campo({
  label,
  value,
  onChangeText,
  placeholder,
  autoCapitalize,
  keyboardType,
  secureTextEntry,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoCapitalize?: "none" | "sentences";
  keyboardType?: "default" | "url";
  secureTextEntry?: boolean;
}) {
  return (
    <View className="gap-1.5">
      <Text className="text-xs font-medium text-muted-foreground">{label}</Text>
      <TextInput
        className="rounded-lg border border-border bg-input-background px-3 py-2.5 text-sm text-foreground"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.mutedForeground}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
      />
    </View>
  );
}
