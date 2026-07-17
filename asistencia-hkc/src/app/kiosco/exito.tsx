import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { CheckCircle } from "lucide-react-native";

import { DetailRow } from "@/components/attendance/ui-rows";
import { palette } from "@/constants/palette";
import { MOCK_EMPLOYEE } from "@/lib/mock-data";
import { useAttendance } from "@/context/attendance-context";

export default function KioskSuccessScreen() {
  const { movementType } = useAttendance();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const id = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (countdown <= 0) router.replace("/kiosco");
  }, [countdown]);

  const labelStyle = { fontSize: 14, color: palette.white50 };

  return (
    <View className="flex-1 items-center justify-center bg-[#0a2e1a] px-6">
      <View className="mb-4 h-24 w-24 overflow-hidden rounded-full border-4 border-green-400">
        <Image
          source={{ uri: MOCK_EMPLOYEE.photo }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />
      </View>

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
          value={MOCK_EMPLOYEE.name}
          labelStyle={labelStyle}
          valueClassName="text-sm font-medium text-white"
        />
        <DetailRow
          label="Empleado"
          value={MOCK_EMPLOYEE.employeeNumber}
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
