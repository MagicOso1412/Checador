import { create } from "zustand";

import { Asistencia } from "@/domain/entities/Asistencia";
import { Trabajador } from "@/domain/entities/Trabajador";
import { TipoRegistro } from "@/domain/enums/TipoRegistro";
import { RegistrarAsistenciaUseCase } from "@/application/useCases/RegistrarAsistenciaUseCase";
import { SQLiteAsistenciaRepository } from "@/infrastructure/repositories/SQLiteAsistenciaRepository";
import type { Coordenadas } from "@/infrastructure/location/locationService";

const registrarAsistenciaUseCase = new RegistrarAsistenciaUseCase(new SQLiteAsistenciaRepository());

interface RegistroAsistenciaState {
  trabajadorSeleccionado: Trabajador | null;
  fotoUri: string | null;
  ubicacion: Coordenadas | null;
  ubicacionCargando: boolean;
  registrando: boolean;
  error: string | null;

  seleccionarTrabajador: (trabajador: Trabajador) => void;
  setFoto: (uri: string) => void;
  setUbicacion: (coords: Coordenadas | null, cargando?: boolean) => void;
  /**
   * Llama a RegistrarAsistenciaUseCase con el borrador actual y lo persiste
   * en SQLite. `tipo` se recibe como parámetro (no vive en este store) para
   * no duplicar la fuente de verdad: la UI ya lo maneja en
   * `attendance-context` (`movementType`), mapeado con `mapMovementLabelToTipoRegistro`.
   */
  registrar: (proyectoId: string, tipo: TipoRegistro) => Promise<Asistencia>;
  /** Limpia el borrador. Llamar al volver a la pantalla de espera tras un registro (o al cancelar). */
  limpiar: () => void;
}

const ESTADO_INICIAL = {
  trabajadorSeleccionado: null,
  fotoUri: null,
  ubicacion: null,
  ubicacionCargando: false,
  registrando: false,
  error: null,
} as const;

/**
 * Estado del registro de asistencia "en curso": el trabajador que se está
 * identificando, la foto que se acaba de tomar, la ubicación GPS y el tipo
 * de movimiento, mientras se recorren las pantallas `asistencia/index`
 * (elegir trabajador) → `asistencia/capturar` (foto) → `asistencia/confirmar`
 * (GPS + confirmar) → `asistencia/exito`. Vive en Zustand (no en cada
 * pantalla) porque expo-router monta cada ruta como un componente separado;
 * pasar esto por query params sería frágil y perdería tipado.
 */
export const useRegistroAsistenciaStore = create<RegistroAsistenciaState>((set, get) => ({
  ...ESTADO_INICIAL,

  seleccionarTrabajador: (trabajador) => set({ trabajadorSeleccionado: trabajador }),
  setFoto: (uri) => set({ fotoUri: uri }),
  setUbicacion: (coords, cargando = false) => set({ ubicacion: coords, ubicacionCargando: cargando }),

  registrar: async (proyectoId: string, tipo: TipoRegistro) => {
    const { trabajadorSeleccionado, fotoUri, ubicacion } = get();

    if (!trabajadorSeleccionado) {
      throw new Error("No hay un trabajador seleccionado");
    }
    if (!fotoUri) {
      throw new Error("No se capturó ninguna foto");
    }

    set({ registrando: true, error: null });
    try {
      const asistencia = await registrarAsistenciaUseCase.execute({
        trabajadorId: trabajadorSeleccionado.id,
        proyectoId,
        tipo,
        fotoUri,
        latitud: ubicacion?.latitud ?? null,
        longitud: ubicacion?.longitud ?? null,
      });
      set({ registrando: false });
      return asistencia;
    } catch (error) {
      console.error("[registroAsistenciaStore] error al registrar asistencia", error);
      set({
        registrando: false,
        error: error instanceof Error ? error.message : "Error al registrar asistencia",
      });
      throw error;
    }
  },

  limpiar: () => set({ ...ESTADO_INICIAL }),
}));
