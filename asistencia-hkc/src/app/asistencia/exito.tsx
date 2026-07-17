import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { CheckCircle } from "lucide-react-native";

import { DetailRow } from "@/components/attendance/ui-rows";
import { shadowSm } from "@/constants/shadows";
import { useAttendance } from "@/context/attendance-context";
import { useProyectoStore } from "@/store/proyectoStore";
import { useTrabajadorStore } from "@/store/trabajadorStore";

export default function CampoSuccessScreen() {
  const { movementType } = useAttendance();
  const proyectoSeleccionado = useProyectoStore((state) => state.proyectoSeleccionado);
  // Mismo trabajador "identificado" que en la pantalla de confirmación (el
  // store ya está cargado a estas alturas del flujo); ver nota sobre
  // reconocimiento facial pendiente en asistencia/confirmar.tsx.
  const trabajador = useTrabajadorStore((state) => state.trabajadores[0] ?? null);
  const [countdown, setCountdown] = useState(4);

  useEffect(() => {
    const id = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (countdown <= 0) router.replace("/proyecto");
  }, [countdown]);

  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      <View className="mb-5 h-20 w-20 items-center justify-center rounded-full bg-green-100">
        <CheckCircle size={42} color="#16a34a" />
      </View>
      <Text className="text-center text-2xl font-bold text-foreground">
        Asistencia registrada
      </Text>
      <Text className="mt-2 text-center text-sm text-muted-foreground">
        El registro fue guardado correctamente
      </Text>

      <View className="mt-6 w-full max-w-xs gap-2.5 rounded-2xl border border-border bg-card p-4" style={shadowSm}>
        <DetailRow label="Empleado" value={trabajador?.nombreCompleto ?? "—"} />
        <DetailRow label="Número" value={trabajador?.numeroEmpleado ?? "—"} />
        <DetailRow
          label="Movimiento"
          value={movementType}
          valueClassName="text-sm font-medium text-green-600"
        />
        <DetailRow label="Proyecto" value={proyectoSeleccionado?.nombre ?? "—"} />
        <DetailRow
          label="Hora"
          value={new Date().toLocaleTimeString("es-MX", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        />
        <DetailRow
          label="GPS"
          value="Obtenido ✓"
          valueClassName="text-sm font-medium text-green-600"
        />
      </View>

      <Pressable
        onPress={() => router.replace("/proyecto")}
        className="mt-6 rounded-2xl bg-primary px-8 py-3.5"
        style={({ pressed }) => pressed && { opacity: 0.9 }}
      >
        <Text className="font-semibold text-primary-foreground">Nuevo registro</Text>
      </Pressable>
      <Text className="mt-3 text-xs text-muted-foreground">Cerrando en {countdown}s</Text>
    </View>
  );
}
