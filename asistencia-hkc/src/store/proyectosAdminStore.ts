import { create } from "zustand";

import { Proyecto } from "@/domain/entities/Proyecto";
import {
  ActualizarProyectoUseCase,
  type ActualizarProyectoRequest,
} from "@/application/useCases/ActualizarProyectoUseCase";
import { CrearProyectoUseCase, type CrearProyectoRequest } from "@/application/useCases/CrearProyectoUseCase";
import { EliminarProyectoUseCase } from "@/application/useCases/EliminarProyectoUseCase";
import { ListarTodosLosProyectosUseCase } from "@/application/useCases/ListarTodosLosProyectosUseCase";
import { ObtenerProyectoPorIdUseCase } from "@/application/useCases/ObtenerProyectoPorIdUseCase";
import { SQLiteProyectoRepository } from "@/infrastructure/repositories/SQLiteProyectoRepository";

const proyectoRepository = new SQLiteProyectoRepository();
const listarTodosLosProyectosUseCase = new ListarTodosLosProyectosUseCase(proyectoRepository);
const obtenerProyectoPorIdUseCase = new ObtenerProyectoPorIdUseCase(proyectoRepository);
const crearProyectoUseCase = new CrearProyectoUseCase(proyectoRepository);
const actualizarProyectoUseCase = new ActualizarProyectoUseCase(proyectoRepository);
const eliminarProyectoUseCase = new EliminarProyectoUseCase(proyectoRepository);

interface ProyectosAdminState {
  proyectos: Proyecto[];
  cargando: boolean;
  guardando: boolean;
  error: string | null;

  /** Carga TODOS los proyectos (activos e inactivos) — a diferencia de proyectoStore, que solo trae activos. */
  cargarProyectos: () => Promise<void>;
  obtenerPorId: (id: string) => Promise<Proyecto | null>;
  crearProyecto: (request: CrearProyectoRequest) => Promise<void>;
  actualizarProyecto: (request: ActualizarProyectoRequest) => Promise<void>;
  eliminarProyecto: (id: string) => Promise<void>;
}

/**
 * Store dedicado a la pantalla de administración de proyectos (CRUD,
 * Sprint 3). Deliberadamente separado de `store/proyectoStore.ts`: ese store
 * sirve al flujo de selección de proyecto activo en Campo/Kiosco (solo
 * lectura, solo activos, con persistencia del proyecto asignado) y no debería
 * mezclarse con las acciones de edición del admin — son dos
 * responsabilidades distintas aunque lean de la misma tabla.
 */
export const useProyectosAdminStore = create<ProyectosAdminState>((set, get) => ({
  proyectos: [],
  cargando: false,
  guardando: false,
  error: null,

  cargarProyectos: async () => {
    set({ cargando: true, error: null });
    try {
      const proyectos = await listarTodosLosProyectosUseCase.execute();
      set({ proyectos, cargando: false });
    } catch (error) {
      console.error("[proyectosAdminStore] error al cargar proyectos", error);
      set({
        cargando: false,
        error: error instanceof Error ? error.message : "Error al cargar proyectos",
      });
    }
  },

  obtenerPorId: (id: string) => obtenerProyectoPorIdUseCase.execute(id),

  crearProyecto: async (request) => {
    set({ guardando: true, error: null });
    try {
      await crearProyectoUseCase.execute(request);
      set({ guardando: false });
      await get().cargarProyectos();
    } catch (error) {
      set({
        guardando: false,
        error: error instanceof Error ? error.message : "Error al crear proyecto",
      });
      throw error;
    }
  },

  actualizarProyecto: async (request) => {
    set({ guardando: true, error: null });
    try {
      await actualizarProyectoUseCase.execute(request);
      set({ guardando: false });
      await get().cargarProyectos();
    } catch (error) {
      set({
        guardando: false,
        error: error instanceof Error ? error.message : "Error al actualizar proyecto",
      });
      throw error;
    }
  },

  eliminarProyecto: async (id) => {
    set({ guardando: true, error: null });
    try {
      await eliminarProyectoUseCase.execute(id);
      set({ guardando: false });
      await get().cargarProyectos();
    } catch (error) {
      set({
        guardando: false,
        error: error instanceof Error ? error.message : "Error al eliminar proyecto",
      });
      throw error;
    }
  },
}));
