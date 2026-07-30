import { create } from "zustand";
import { configurarPin, tienePinConfigurado, verificarPin } from "@/infrastructure/security/pinService";

interface AdminPinState {
  cargando: boolean;
  tienePin: boolean | null;

  verificarEstado: () => Promise<void>;
  configurar: (pin: string) => Promise<void>;
  verificar: (pin: string) => Promise<boolean>;
  /** Cambia el PIN solo si `pinActual` es correcto. Devuelve `false` si no lo es. */
  cambiar: (pinActual: string, pinNuevo: string) => Promise<boolean>;
}

/**
 * Estado del PIN de administrador del dispositivo (ver
 * `infrastructure/security/pinService.ts`). Store dedicado, mismo criterio
 * que `configuracionStore`/`proyectoStore`: una responsabilidad de
 * dispositivo, no de dominio de negocio, así que llama directo al servicio
 * de infraestructura sin una capa de use cases de por medio.
 */
export const useAdminPinStore = create<AdminPinState>((set) => ({
  cargando: false,
  tienePin: null,

  verificarEstado: async () => {
    set({ cargando: true });
    try {
      const tienePin = await tienePinConfigurado();
      set({ tienePin, cargando: false });
    } catch (error) {
      console.error("[adminPinStore] error al verificar estado del PIN", error);
      set({ cargando: false });
    }
  },

  configurar: async (pin: string) => {
    await configurarPin(pin);
    set({ tienePin: true });
  },

  verificar: (pin: string) => verificarPin(pin),

  cambiar: async (pinActual: string, pinNuevo: string) => {
    const esValido = await verificarPin(pinActual);
    if (!esValido) return false;
    await configurarPin(pinNuevo);
    return true;
  },
}));
