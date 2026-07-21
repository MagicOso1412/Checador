import { create } from "zustand";

import { ExportarHistorialUseCase } from "@/application/useCases/ExportarHistorialUseCase";
import { ObtenerHistorialUseCase } from "@/application/useCases/ObtenerHistorialUseCase";
import type { HistorialAsistenciaDTO } from "@/application/dto/HistorialAsistenciaDTO";
import { guardarCsv } from "@/infrastructure/export/exportService";
import { SQLiteAsistenciaRepository } from "@/infrastructure/repositories/SQLiteAsistenciaRepository";
import { SQLiteProyectoRepository } from "@/infrastructure/repositories/SQLiteProyectoRepository";
import { SQLiteTrabajadorRepository } from "@/infrastructure/repositories/SQLiteTrabajadorRepository";

const obtenerHistorialUseCase = new ObtenerHistorialUseCase(
  new SQLiteAsistenciaRepository(),
  new SQLiteTrabajadorRepository(),
  new SQLiteProyectoRepository(),
);
const exportarHistorialUseCase = new ExportarHistorialUseCase(obtenerHistorialUseCase);

interface HistorialState {
  registros: HistorialAsistenciaDTO[];
  cargando: boolean;
  error: string | null;
  exportando: boolean;
  errorExportacion: string | null;

  /** Si se pasa `proyectoId`, muestra solo el historial de ese proyecto. */
  cargarHistorial: (proyectoId?: string) => Promise<void>;
  /** Exporta el historial visible (mismo filtro de proyecto) a CSV. Devuelve dónde quedó guardado. */
  exportarCsv: (proyectoId?: string) => Promise<{ guardadoEn: string; totalRegistros: number }>;
}

export const useHistorialStore = create<HistorialState>((set) => ({
  registros: [],
  cargando: false,
  error: null,
  exportando: false,
  errorExportacion: null,

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

  exportarCsv: async (proyectoId?: string) => {
    set({ exportando: true, errorExportacion: null });
    try {
      const { csv, fileName, totalRegistros } = await exportarHistorialUseCase.execute(proyectoId);
      const { guardadoEn } = await guardarCsv(csv, fileName);
      set({ exportando: false });
      return { guardadoEn, totalRegistros };
    } catch (error) {
      console.error("[historialStore] error al exportar CSV", error);
      const mensaje = error instanceof Error ? error.message : "Error al exportar el historial";
      set({ exportando: false, errorExportacion: mensaje });
      throw error;
    }
  },
}));
