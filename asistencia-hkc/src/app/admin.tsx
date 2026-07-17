import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import {
  Building2,
  Camera,
  Clock,
  HardDrive,
  Info,
  LogOut,
  Navigation,
  RefreshCw,
  Server,
  Shield,
  Smartphone,
} from "lucide-react-native";

import { DetailRow } from "@/components/attendance/ui-rows";
import { palette } from "@/constants/palette";
import { shadowSm } from "@/constants/shadows";
import { useAttendance } from "@/context/attendance-context";
import { useProyectoStore } from "@/store/proyectoStore";

export default function AdminScreen() {
  const { operationMode } = useAttendance();
  const proyectoSeleccionado = useProyectoStore((state) => state.proyectoSeleccionado);

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
            value="Dispositivo-07"
          />
          <DetailRow
            icon={<Info size={15} color={palette.mutedForeground} />}
            label="Versión"
            value="v1.0.0"
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
            value="api.hkc-asistencia.mx"
          />
          <DetailRow
            icon={<Navigation size={15} color={palette.mutedForeground} />}
            label="GPS"
            value="Activo ✓"
            valueClassName="text-sm font-medium text-green-600"
          />
          <DetailRow
            icon={<Camera size={15} color={palette.mutedForeground} />}
            label="Cámara"
            value="Activa ✓"
            valueClassName="text-sm font-medium text-green-600"
          />
          <DetailRow
            icon={<HardDrive size={15} color={palette.mutedForeground} />}
            label="Almacenamiento"
            value="2.1 GB / 16 GB"
          />
          <DetailRow
            icon={<Clock size={15} color={palette.mutedForeground} />}
            label="Última sync"
            value="Hoy 14:32"
          />
        </View>

        <Pressable
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
