import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import {
  Building2,
  Camera,
  ChevronRight,
  Clock,
  HardDrive,
  Info,
  LogOut,
  Navigation,
  RefreshCw,
  Server,
  Shield,
  Smartphone,
  Users,
} from "lucide-react-native";

import { DetailRow } from "@/components/attendance/ui-rows";
import { palette } from "@/constants/palette";
import { shadowSm } from "@/constants/shadows";
import { useAttendance } from "@/context/attendance-context";
import { verificarPermisoCamara } from "@/infrastructure/camera/cameraService";
import { obtenerNombreDispositivo, obtenerVersionApp } from "@/infrastructure/device/deviceInfo";
import { verificarPermisoUbicacion } from "@/infrastructure/location/locationService";
import { useConfiguracionStore } from "@/store/configuracionStore";
import { useProyectoStore } from "@/store/proyectoStore";
import { useSyncStore } from "@/store/syncStore";

/** `null` = todavía verificando. */
type EstadoPermiso = boolean | null;

export default function AdminScreen() {
  const { operationMode } = useAttendance();
  const proyectoSeleccionado = useProyectoStore((state) => state.proyectoSeleccionado);
  const servidor = useConfiguracionStore((state) => state.servidor);
  const cargarConfiguracion = useConfiguracionStore((state) => state.cargarConfiguracion);
  const ultimaSincronizacion = useSyncStore((state) => state.ultimaSincronizacion);
  const cargarEstadoSync = useSyncStore((state) => state.cargarEstado);

  const [gpsDisponible, setGpsDisponible] = useState<EstadoPermiso>(null);
  const [camaraDisponible, setCamaraDisponible] = useState<EstadoPermiso>(null);

  useEffect(() => {
    cargarConfiguracion();
    cargarEstadoSync();
    verificarPermisoUbicacion().then(setGpsDisponible);
    verificarPermisoCamara().then(setCamaraDisponible);
  }, [cargarConfiguracion, cargarEstadoSync]);

  return (
    <View className="flex-1 bg-background">
      <View className="bg-[#0d1b3e] px-4 pb-5 pt-14">
        <Pressable
          onPress={() => router.replace("/mode-select")}
          className="mb-3 flex-row items-center gap-1"
        >
          <Text className="text-sm" style={{ color: palette.white70 }}>
            ← Atrás
          </Text>
        </Pressable>
        <View className="flex-row items-center gap-2">
          <Shield size={18} color="#fbbf24" />
          <Text className="text-xl font-bold text-white">Administración</Text>
        </View>
        <Text className="mt-1 text-xs" style={{ color: palette.white50 }}>
          Acceso restringido · Admin
        </Text>
      </View>

      <View className="flex-1 gap-3 p-4">
        <View className="gap-3 rounded-2xl border border-border bg-card p-4" style={shadowSm}>
          <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Dispositivo
          </Text>
          <DetailRow
            icon={<Smartphone size={15} color={palette.mutedForeground} />}
            label="Nombre"
            value={obtenerNombreDispositivo()}
          />
          <DetailRow
            icon={<Info size={15} color={palette.mutedForeground} />}
            label="Versión"
            value={`v${obtenerVersionApp()}`}
          />
          <DetailRow
            icon={<Shield size={15} color={palette.mutedForeground} />}
            label="Modo"
            value={operationMode === "kiosco" ? "Kiosco" : "Campo"}
          />
          <DetailRow
            icon={<Building2 size={15} color={palette.mutedForeground} />}
            label="Proyecto"
            value={proyectoSeleccionado?.nombre ?? "Sin asignar"}
          />
        </View>

        <View className="gap-3 rounded-2xl border border-border bg-card p-4" style={shadowSm}>
          <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Estado del sistema
          </Text>
          <DetailRow
            icon={<Server size={15} color={palette.mutedForeground} />}
            label="Servidor"
            value={servidor}
          />
          <DetailRow
            icon={<Navigation size={15} color={palette.mutedForeground} />}
            label="GPS"
            value={gpsDisponible === null ? "Verificando…" : gpsDisponible ? "Permiso concedido ✓" : "Sin permiso"}
            valueClassName={`text-sm font-medium ${
              gpsDisponible ? "text-green-600" : "text-muted-foreground"
            }`}
          />
          <DetailRow
            icon={<Camera size={15} color={palette.mutedForeground} />}
            label="Cámara"
            value={
              camaraDisponible === null ? "Verificando…" : camaraDisponible ? "Permiso concedido ✓" : "Sin permiso"
            }
            valueClassName={`text-sm font-medium ${
              camaraDisponible ? "text-green-600" : "text-muted-foreground"
            }`}
          />
          <DetailRow
            icon={<HardDrive size={15} color={palette.mutedForeground} />}
            label="Almacenamiento"
            value="No disponible"
          />
          <DetailRow
            icon={<Clock size={15} color={palette.mutedForeground} />}
            label="Última sync"
            value={
              ultimaSincronizacion
                ? ultimaSincronizacion.toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })
                : "Nunca"
            }
          />
        </View>

        <Pressable
          onPress={() => router.push("/trabajadores")}
          className="flex-row items-center justify-between rounded-2xl border border-border bg-card px-5 py-4"
          style={({ pressed }) => [shadowSm, pressed && { opacity: 0.9 }]}
        >
          <View className="flex-row items-center gap-3">
            <Users size={20} color={palette.primary} />
            <Text className="text-sm font-medium text-foreground">Gestionar trabajadores</Text>
          </View>
          <ChevronRight size={18} color={palette.mutedForeground} />
        </Pressable>

        <Pressable
          onPress={() => router.push("/proyectos")}
          className="flex-row items-center justify-between rounded-2xl border border-border bg-card px-5 py-4"
          style={({ pressed }) => [shadowSm, pressed && { opacity: 0.9 }]}
        >
          <View className="flex-row items-center gap-3">
            <Building2 size={20} color={palette.primary} />
            <Text className="text-sm font-medium text-foreground">Gestionar proyectos</Text>
          </View>
          <ChevronRight size={18} color={palette.mutedForeground} />
        </Pressable>

        <Pressable
          onPress={() => router.push("/configuracion")}
          className="flex-row items-center justify-center gap-2 rounded-xl bg-primary py-3.5"
          style={({ pressed }) => pressed && { opacity: 0.9 }}
        >
          <RefreshCw size={16} color={palette.white} />
          <Text className="text-sm font-semibold text-primary-foreground">
            Actualizar configuración
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.replace("/mode-select")}
          className="flex-row items-center justify-center gap-2 rounded-xl bg-card py-3.5"
          style={({ pressed }) => [
            { borderWidth: 1, borderColor: palette.destructive40 },
            pressed && { opacity: 0.9 },
          ]}
        >
          <LogOut size={16} color={palette.destructive} />
          <Text className="text-sm font-semibold text-destructive">
            Cerrar sesión administrativa
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
