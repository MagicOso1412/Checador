import { useEffect, useState } from "react";
import { Image, Text, View } from "react-native";
import { router } from "expo-router";
import { CheckCircle } from "lucide-react-native";

import { DetailRow } from "@/components/attendance/ui-rows";
import { palette } from "@/constants/palette";
import { useAttendance } from "@/context/attendance-context";
import { useRegistroAsistenciaStore } from "@/store/registroAsistenciaStore";

/** Éxito del registro en Modo Kiosco — mismo pipeline que Campo, estilo oscuro propio de Kiosco. */
export default function KioskSuccessScreen() {
  const { movementType } = useAttendance();
  const { trabajadorSeleccionado, fotoUri, ubicacion, limpiar } = useRegistroAsistenciaStore();
  const [countdown, setCountdown] = useState(3);

  const volverAEspera = () => {
    limpiar();
    router.replace("/kiosco");
  };

  useEffect(() => {
    const id = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (countdown <= 0) volverAEspera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

  const labelStyle = { fontSize: 14, color: palette.white50 };

  return (
    <View className="flex-1 items-center justify-center bg-[#0a2e1a] px-6">
      {fotoUri ? (
        <View className="mb-4 h-24 w-24 overflow-hidden rounded-full border-4 border-green-400">
          <Image source={{ uri: fotoUri }} style={{ width: "100%", height: "100%" }} />
        </View>
      ) : null}

      <CheckCircle size={36} color="#4ade80" />
      <Text className="mt-3 text-center text-2xl font-bold text-white">
        Asistencia registrada correctamente
      </Text>
      <Text className="mt-1 text-center text-sm" style={{ color: palette.green30070 }}>
        Registro exitoso
      </Text>

      <View className="mt-6 w-full max-w-xs gap-2 rounded-2xl p-4" style={{ backgroundColor: palette.white10 }}>
        <DetailRow
          label="Nombre"
          value={trabajadorSeleccionado?.nombreCompleto ?? "—"}
          labelStyle={labelStyle}
          valueClassName="text-sm font-medium text-white"
        />
        <DetailRow
          label="Empleado"
          value={trabajadorSeleccionado?.numeroEmpleado ?? "—"}
          labelStyle={labelStyle}
          valueClassName="text-sm font-medium text-white"
        />
        <DetailRow
          label="Hora"
          value={new Date().toLocaleTimeString("es-MX", {
            hour: "2-digit",
            minute: "2-digit",
          })}
          labelStyle={labelStyle}
          valueClassName="text-sm font-medium text-white"
        />
        <DetailRow
          label="Movimiento"
          value={movementType}
          labelStyle={labelStyle}
          valueClassName="text-sm font-medium text-green-400"
        />
        <DetailRow
          label="GPS"
          value={ubicacion ? "Obtenido ✓" : "No disponible"}
          labelStyle={labelStyle}
          valueClassName={`text-sm font-medium ${ubicacion ? "text-green-400" : "text-white"}`}
        />
      </View>

      <View className="mt-6 items-center">
        <Text className="text-sm" style={{ color: palette.white50 }}>
          Regresando en
        </Text>
        <Text className="text-5xl font-bold text-green-400">{countdown}</Text>
      </View>
    </View>
  );
}
