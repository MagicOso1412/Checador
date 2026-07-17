import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Calendar, Clock, Layers, Navigation, User } from "lucide-react-native";

import { DetailRow, StatusPill } from "@/components/attendance/ui-rows";
import { palette } from "@/constants/palette";
import { shadowMd, shadowSm } from "@/constants/shadows";
import { useAttendance } from "@/context/attendance-context";
import { MOVEMENT_TYPES } from "@/lib/mock-data";
import { RegistrarAsistenciaUseCase } from "@/application/useCases/RegistrarAsistenciaUseCase";
import { SQLiteAsistenciaRepository } from "@/infrastructure/repositories/SQLiteAsistenciaRepository";
import { useProyectoStore } from "@/store/proyectoStore";
import { useTrabajadorStore } from "@/store/trabajadorStore";
import { mapMovementLabelToTipoRegistro } from "@/utils/tipoRegistro";

const registrarAsistenciaUseCase = new RegistrarAsistenciaUseCase(new SQLiteAsistenciaRepository());

// El reconocimiento facial todavía no existe (Sprint 5). Mientras tanto, esta
// pantalla usa el primer trabajador activo de SQLite como el "identificado",
// y foto/GPS quedan como placeholders documentados: la captura real de
// cámara y la geolocalización son módulos pendientes (ver ARCHITECTURE.md).
const FOTO_URI_PENDIENTE = "pending://captura-de-camara-no-integrada";
const GPS_PLACEHOLDER = { latitud: 25.6714, longitud: -100.3098 };

export default function AttendanceConfirmScreen() {
  const { movementType, setMovementType } = useAttendance();
  const proyectoSeleccionado = useProyectoStore((state) => state.proyectoSeleccionado);
  const { trabajadores, cargando, cargarTrabajadores } = useTrabajadorStore();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const now = new Date();

  useEffect(() => {
    cargarTrabajadores();
  }, [cargarTrabajadores]);

  const trabajador = trabajadores[0] ?? null;
  const puedeConfirmar = Boolean(trabajador && proyectoSeleccionado) && !submitting;

  const handleConfirmar = async () => {
    if (!trabajador || !proyectoSeleccionado) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await registrarAsistenciaUseCase.execute({
        trabajadorId: trabajador.id,
        proyectoId: proyectoSeleccionado.id,
        tipo: mapMovementLabelToTipoRegistro(movementType),
        fotoUri: FOTO_URI_PENDIENTE,
        latitud: GPS_PLACEHOLDER.latitud,
        longitud: GPS_PLACEHOLDER.longitud,
      });
      router.push("/asistencia/exito");
    } catch (error) {
      console.error("[asistencia/confirmar] error al registrar asistencia", error);
      setSubmitError(
        error instanceof Error ? error.message : "No se pudo registrar la asistencia",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <View className="bg-primary px-4 pb-5 pt-14">
        <Pressable onPress={() => router.replace("/proyecto")} className="mb-3">
          <Text className="text-sm" style={{ color: palette.white70 }}>
            ← Cancelar
          </Text>
        </Pressable>
        <Text className="text-xl font-bold text-white">Confirmar Asistencia</Text>
      </View>

      <View className="flex-1 gap-4 p-4">
        <View className="flex-row items-center gap-4 rounded-2xl border border-border bg-card p-4" style={shadowSm}>
          <View
            className="h-16 w-16 items-center justify-center overflow-hidden rounded-xl"
            style={{ backgroundColor: palette.primary10 }}
          >
            <User size={28} color={palette.primary} />
          </View>
          <View className="flex-1">
            {cargando ? (
              <ActivityIndicator size="small" color={palette.primary} style={{ alignSelf: "flex-start" }} />
            ) : trabajador ? (
              <>
                <Text className="font-semibold text-foreground">{trabajador.nombreCompleto}</Text>
                <Text className="text-sm text-muted-foreground">{trabajador.numeroEmpleado}</Text>
                <View className="mt-1 self-start">
                  <StatusPill
                    label="Identificado"
                    bgClassName="bg-green-100"
                    textClassName="text-green-700"
                  />
                </View>
              </>
            ) : (
              <Text className="text-sm text-destructive">
                No hay trabajadores activos registrados en el dispositivo.
              </Text>
            )}
          </View>
        </View>

        <View className="gap-3 rounded-2xl border border-border bg-card p-4" style={shadowSm}>
          <DetailRow
            icon={<Calendar size={15} color={palette.mutedForeground} />}
            label="Fecha"
            value={now.toLocaleDateString("es-MX", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          />
          <DetailRow
            icon={<Clock size={15} color={palette.mutedForeground} />}
            label="Hora"
            value={now.toLocaleTimeString("es-MX", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          />
          <DetailRow
            icon={<Layers size={15} color={palette.mutedForeground} />}
            label="Proyecto"
            value={proyectoSeleccionado?.nombre ?? "—"}
          />
          <DetailRow
            icon={<Navigation size={15} color={palette.mutedForeground} />}
            label="GPS"
            value={`${GPS_PLACEHOLDER.latitud}° N, ${Math.abs(GPS_PLACEHOLDER.longitud)}° W`}
          />
        </View>

        <View className="rounded-2xl border border-border bg-card p-4" style={shadowSm}>
          <Text className="mb-3 text-sm font-semibold text-foreground">
            Tipo de movimiento
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {MOVEMENT_TYPES.map((type) => {
              const active = movementType === type;
              return (
                <Pressable
                  key={type}
                  onPress={() => setMovementType(type)}
                  className={`min-w-[47%] flex-1 items-center rounded-xl border-2 py-2.5 ${
                    active ? "border-primary" : "border-border bg-muted"
                  }`}
                  style={active ? { backgroundColor: palette.primary10 } : undefined}
                >
                  <Text
                    className={`text-sm font-medium ${
                      active ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {type}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {submitError ? (
          <Text className="text-center text-sm text-destructive">{submitError}</Text>
        ) : null}
      </View>

      <View className="flex-row gap-3 border-t border-border p-4">
        <Pressable
          onPress={() => router.replace("/proyecto")}
          className="flex-1 items-center rounded-2xl border-2 border-border py-4"
          style={({ pressed }) => pressed && { opacity: 0.9 }}
        >
          <Text className="font-semibold text-foreground">Cancelar</Text>
        </Pressable>
        <Pressable
          onPress={handleConfirmar}
          disabled={!puedeConfirmar}
          className="flex-1 items-center rounded-2xl bg-primary py-4"
          style={({ pressed }) => [
            shadowMd,
            !puedeConfirmar && { opacity: 0.5 },
            pressed && puedeConfirmar && { opacity: 0.9 },
          ]}
        >
          <Text className="font-semibold text-primary-foreground">
            {submitting ? "Guardando…" : "Confirmar"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
