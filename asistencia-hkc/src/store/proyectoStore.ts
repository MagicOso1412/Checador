import { create } from "zustand";

import { Proyecto } from "@/domain/entities/Proyecto";
import { ObtenerProyectosUseCase } from "@/application/useCases/ObtenerProyectosUseCase";
import { SQLiteProyectoRepository } from "@/infrastructure/repositories/SQLiteProyectoRepository";

const obtenerProyectosUseCase = new ObtenerProyectosUseCase(new SQLiteProyectoRepository());

interface ProyectoState {
  proyectos: Proyecto[];
  proyectoSeleccionado: Proyecto | null;
  cargando: boolean;
  error: string | null;

  /** Carga los proyectos activos desde SQLite (vía use case) hacia el store. */
  cargarProyectos: () => Promise<void>;
  seleccionarProyecto: (proyecto: Proyecto) => void;
}

/**
 * Estado global del proyecto activo. La tablet puede moverse entre proyectos:
 * `proyectoSeleccionado` es el que se usará automáticamente para registrar
 * cualquier asistencia mientras no se cambie.
 *
 * Nota: Zustand no persiste en disco por sí solo; `proyectoSeleccionado` vive
 * solo en memoria por ahora. Cuando se implemente que el dispositivo "recuerde"
 * el proyecto entre reinicios de la app, agregar el middleware `persist` de
 * zustand (con un storage adapter async, ver AsyncStorage/expo-sqlite-storage)
 * en vez de reinventar esa lógica.
 */
export const useProyectoStore = create<ProyectoState>((set) => ({
  proyectos: [],
  proyectoSeleccionado: null,
  cargando: false,
  error: null,

  cargarProyectos: async () => {
    set({ cargando: true, error: null });
    try {
      const proyectos = await obtenerProyectosUseCase.execute();
      set({ proyectos, cargando: false });
    } catch (error) {
      console.error("[proyectoStore] error al cargar proyectos", error);
      set({
        cargando: false,
        error: error instanceof Error ? error.message : "Error al cargar proyectos",
      });
    }
  },

  seleccionarProyecto: (proyecto: Proyecto) => {
    set({ proyectoSeleccionado: proyecto });
  },
}));
