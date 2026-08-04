import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { CheckCircle } from "lucide-react-native";

import { DetailRow } from "@/components/attendance/ui-rows";
import { shadowSm } from "@/constants/shadows";
import { useAttendance } from "@/context/attendance-context";
import { useProyectoStore } from "@/store/proyectoStore";
import { useRegistroAsistenciaStore } from "@/store/registroAsistenciaStore";

/**
 * Al terminar el conteo (o tocar "Registrar siguiente"), regresa directo a
 * identificar al próximo trabajador (`/asistencia`), no al hub `/proyecto`
 * — un supervisor registrando asistencia de varios trabajadores seguidos no
 * debería tener que volver a tocar "Registrar Asistencia" cada vez. Queda
 * un enlace secundario para terminar y volver al hub cuando ya se acabó la
 * ronda. `router.replace` (no `push`) en cada paso del wizard mantiene el
 * histórico acotado — ver la nota de navegación en ARCHITECTURE.md.
 */
export default function CampoSuccessScreen() {
  const { movementType } = useAttendance();
  const proyectoSeleccionado = useProyectoStore((state) => state.proyectoSeleccionado);
  const { trabajadorSeleccionado, ubicacion, limpiar } = useRegistroAsistenciaStore();
  const [countdown, setCountdown] = useState(4);

  const registrarSiguiente = () => {
    limpiar();
    router.replace("/asistencia");
  };

  /**
   * `router.back()`, no `replace("/proyecto")` — el histórico en este punto
   * es siempre exactamente [proyecto, pantalla-actual] (cada paso del
   * wizard reemplaza al anterior); `back()` regresa a ese `/proyecto`
   * original sin crear una segunda entrada duplicada.
   */
  const terminarRonda = () => {
    limpiar();
    router.back();
  };

  useEffect(() => {
    const id = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (countdown <= 0) registrarSiguiente();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <DetailRow label="Empleado" value={trabajadorSeleccionado?.nombreCompleto ?? "—"} />
        <DetailRow label="Número" value={trabajadorSeleccionado?.numeroEmpleado ?? "—"} />
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
          value={ubicacion ? "Obtenido ✓" : "No disponible"}
          valueClassName={`text-sm font-medium ${ubicacion ? "text-green-600" : "text-muted-foreground"}`}
        />
      </View>

      <Pressable
        onPress={registrarSiguiente}
        className="mt-6 rounded-2xl bg-primary px-8 py-3.5"
        style={({ pressed }) => pressed && { opacity: 0.9 }}
      >
        <Text className="font-semibold text-primary-foreground">Registrar siguiente</Text>
      </Pressable>
      <Text className="mt-3 text-xs text-muted-foreground">Siguiente trabajador en {countdown}s</Text>

      <Pressable onPress={terminarRonda} className="mt-4" hitSlop={8}>
        <Text className="text-xs text-muted-foreground underline">Terminar y volver al inicio</Text>
      </Pressable>
    </View>
  );
}
