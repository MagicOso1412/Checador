import { useEffect, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Calendar, Clock, Layers, Navigation } from "lucide-react-native";

import { DetailRow, StatusPill } from "@/components/attendance/ui-rows";
import { palette } from "@/constants/palette";
import { shadowMd, shadowSm } from "@/constants/shadows";
import { useAttendance } from "@/context/attendance-context";
import { obtenerUbicacionActual } from "@/infrastructure/location/locationService";
import { MOVEMENT_TYPES } from "@/lib/mock-data";
import { useProyectoStore } from "@/store/proyectoStore";
import { useRegistroAsistenciaStore } from "@/store/registroAsistenciaStore";
import { mapMovementLabelToTipoRegistro } from "@/utils/tipoRegistro";

function formatCoordenada(valor: number, positivo: string, negativo: string) {
  return `${Math.abs(valor).toFixed(4)}° ${valor >= 0 ? positivo : negativo}`;
}

/** Paso 3 del registro: revisar GPS + tipo de movimiento y confirmar (o cancelar). */
export default function AttendanceConfirmScreen() {
  const { movementType, setMovementType } = useAttendance();
  const proyectoSeleccionado = useProyectoStore((state) => state.proyectoSeleccionado);
  const {
    trabajadorSeleccionado,
    fotoUri,
    ubicacion,
    ubicacionCargando,
    registrando,
    error,
    setUbicacion,
    registrar,
    limpiar,
  } = useRegistroAsistenciaStore();
  const now = new Date();

  // Esta pantalla depende de los pasos anteriores del flujo (trabajador +
  // foto). Si falta alguno (deep link directo, back navigation rara, etc.)
  // no hay nada que confirmar.
  useEffect(() => {
    if (!trabajadorSeleccionado || !fotoUri) {
      router.replace("/asistencia");
    }
  }, [trabajadorSeleccionado, fotoUri]);

  // GPS es best-effort: se pide una sola vez al entrar a confirmar. Si falla
  // o se niega el permiso, `obtenerUbicacionActual` devuelve null y el
  // registro sigue siendo posible (ver infrastructure/location/locationService.ts).
  useEffect(() => {
    let cancelled = false;
    setUbicacion(null, true);
    obtenerUbicacionActual().then((coords) => {
      if (!cancelled) setUbicacion(coords, false);
    });
    return () => {
      cancelled = true;
    };
  }, [setUbicacion]);

  if (!trabajadorSeleccionado || !fotoUri) {
    return <View className="flex-1 bg-background" />;
  }

  const puedeConfirmar = Boolean(proyectoSeleccionado) && !registrando;

  const handleCancelar = () => {
    limpiar();
    router.replace("/proyecto");
  };

  const handleConfirmar = async () => {
    if (!proyectoSeleccionado) return;
    try {
      await registrar(proyectoSeleccionado.id, mapMovementLabelToTipoRegistro(movementType));
      router.push("/asistencia/exito");
    } catch {
      // El error ya queda expuesto en el store (`error`) y se muestra abajo.
    }
  };

  return (
    <View className="flex-1 bg-background">
      <View className="bg-primary px-4 pb-5 pt-14">
        <Pressable onPress={handleCancelar} className="mb-3">
          <Text className="text-sm" style={{ color: palette.white70 }}>
            ← Cancelar
          </Text>
        </Pressable>
        <Text className="text-xl font-bold text-white">Confirmar Asistencia</Text>
      </View>

      <View className="flex-1 gap-4 p-4">
        <View className="flex-row items-center gap-4 rounded-2xl border border-border bg-card p-4" style={shadowSm}>
          <View className="h-16 w-16 overflow-hidden rounded-xl bg-muted">
            <Image source={{ uri: fotoUri }} style={{ width: "100%", height: "100%" }} />
          </View>
          <View className="flex-1">
            <Text className="font-semibold text-foreground">
              {trabajadorSeleccionado.nombreCompleto}
            </Text>
            <Text className="text-sm text-muted-foreground">
              {trabajadorSeleccionado.numeroEmpleado}
            </Text>
            <View className="mt-1 self-start">
              <StatusPill
                label="Identificado"
                bgClassName="bg-green-100"
                textClassName="text-green-700"
              />
            </View>
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
            value={
              ubicacionCargando
                ? "Obteniendo…"
                : ubicacion
                  ? `${formatCoordenada(ubicacion.latitud, "N", "S")}, ${formatCoordenada(ubicacion.longitud, "E", "W")}`
                  : "No disponible"
            }
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

        {error ? <Text className="text-center text-sm text-destructive">{error}</Text> : null}
      </View>

      <View className="flex-row gap-3 border-t border-border p-4">
        <Pressable
          onPress={handleCancelar}
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
            {registrando ? "Guardando…" : "Confirmar"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
