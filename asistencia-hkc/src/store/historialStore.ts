import { create } from "zustand";

import { ObtenerHistorialUseCase } from "@/application/useCases/ObtenerHistorialUseCase";
import type { HistorialAsistenciaDTO } from "@/application/dto/HistorialAsistenciaDTO";
import { SQLiteAsistenciaRepository } from "@/infrastructure/repositories/SQLiteAsistenciaRepository";
import { SQLiteProyectoRepository } from "@/infrastructure/repositories/SQLiteProyectoRepository";
import { SQLiteTrabajadorRepository } from "@/infrastructure/repositories/SQLiteTrabajadorRepository";

const obtenerHistorialUseCase = new ObtenerHistorialUseCase(
  new SQLiteAsistenciaRepository(),
  new SQLiteTrabajadorRepository(),
  new SQLiteProyectoRepository(),
);

interface HistorialState {
  registros: HistorialAsistenciaDTO[];
  cargando: boolean;
  error: string | null;

  /** Si se pasa `proyectoId`, muestra solo el historial de ese proyecto. */
  cargarHistorial: (proyectoId?: string) => Promise<void>;
}

export const useHistorialStore = create<HistorialState>((set) => ({
  registros: [],
  cargando: false,
  error: null,

  cargarHistorial: async (proyectoId?: string) => {
    set({ cargando: true, error: null });
    try {
      const registros = await obtenerHistorialUseCase.execute(proyectoId);
      set({ registros, cargando: false });
    } catch (error) {
      console.error("[historialStore] error al cargar historial", error);
      set({
        cargando: false,
        error: error instanceof Error ? error.message : "Error al cargar historial",
      });
    }
  },
}));
