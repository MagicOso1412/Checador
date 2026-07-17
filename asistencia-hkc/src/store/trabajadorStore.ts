import { create } from "zustand";

import { Trabajador } from "@/domain/entities/Trabajador";
import { ObtenerTrabajadoresUseCase } from "@/application/useCases/ObtenerTrabajadoresUseCase";
import { SQLiteTrabajadorRepository } from "@/infrastructure/repositories/SQLiteTrabajadorRepository";

const obtenerTrabajadoresUseCase = new ObtenerTrabajadoresUseCase(new SQLiteTrabajadorRepository());

interface TrabajadorState {
  trabajadores: Trabajador[];
  cargando: boolean;
  error: string | null;

  /** Carga los trabajadores activos desde SQLite (vía use case) hacia el store. */
  cargarTrabajadores: () => Promise<void>;
}

/**
 * Estado global de trabajadores activos. Por ahora solo expone lectura (lista
 * de trabajadores activos); todavía no hay CRUD de trabajadores en la UI
 * (pendiente Sprint 3) ni identificación real por reconocimiento facial —
 * mientras tanto, pantallas como el flujo de Campo usan esta lista como
 * fuente de datos reales para simular la identificación de un trabajador.
 */
export const useTrabajadorStore = create<TrabajadorState>((set) => ({
  trabajadores: [],
  cargando: false,
  error: null,

  cargarTrabajadores: async () => {
    set({ cargando: true, error: null });
    try {
      const trabajadores = await obtenerTrabajadoresUseCase.execute();
      set({ trabajadores, cargando: false });
    } catch (error) {
      console.error("[trabajadorStore] error al cargar trabajadores", error);
      set({
        cargando: false,
        error: error instanceof Error ? error.message : "Error al cargar trabajadores",
      });
    }
  },
}));
