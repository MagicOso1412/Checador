import { create } from "zustand";

import { Trabajador } from "@/domain/entities/Trabajador";
import {
  ActualizarTrabajadorUseCase,
  type ActualizarTrabajadorRequest,
} from "@/application/useCases/ActualizarTrabajadorUseCase";
import { CrearTrabajadorUseCase, type CrearTrabajadorRequest } from "@/application/useCases/CrearTrabajadorUseCase";
import { EliminarTrabajadorUseCase } from "@/application/useCases/EliminarTrabajadorUseCase";
import { ListarTodosLosTrabajadoresUseCase } from "@/application/useCases/ListarTodosLosTrabajadoresUseCase";
import { ObtenerTrabajadorPorIdUseCase } from "@/application/useCases/ObtenerTrabajadorPorIdUseCase";
import { SQLiteTrabajadorRepository } from "@/infrastructure/repositories/SQLiteTrabajadorRepository";

const trabajadorRepository = new SQLiteTrabajadorRepository();
const listarTodosLosTrabajadoresUseCase = new ListarTodosLosTrabajadoresUseCase(trabajadorRepository);
const obtenerTrabajadorPorIdUseCase = new ObtenerTrabajadorPorIdUseCase(trabajadorRepository);
const crearTrabajadorUseCase = new CrearTrabajadorUseCase(trabajadorRepository);
const actualizarTrabajadorUseCase = new ActualizarTrabajadorUseCase(trabajadorRepository);
const eliminarTrabajadorUseCase = new EliminarTrabajadorUseCase(trabajadorRepository);

interface TrabajadoresAdminState {
  trabajadores: Trabajador[];
  cargando: boolean;
  guardando: boolean;
  error: string | null;

  /** Carga TODOS los trabajadores (activos e inactivos) — a diferencia de trabajadorStore, que solo trae activos. */
  cargarTrabajadores: () => Promise<void>;
  obtenerPorId: (id: string) => Promise<Trabajador | null>;
  crearTrabajador: (request: CrearTrabajadorRequest) => Promise<void>;
  actualizarTrabajador: (request: ActualizarTrabajadorRequest) => Promise<void>;
  eliminarTrabajador: (id: string) => Promise<void>;
}

/**
 * Store dedicado a la pantalla de administración de trabajadores (CRUD,
 * Sprint 3). Deliberadamente separado de `store/trabajadorStore.ts`: ese
 * store sirve al flujo de identificación de asistencia (solo lectura, solo
 * activos) y no debería mezclarse con las acciones de edición del admin —
 * son dos responsabilidades distintas aunque lean de la misma tabla.
 */
export const useTrabajadoresAdminStore = create<TrabajadoresAdminState>((set, get) => ({
  trabajadores: [],
  cargando: false,
  guardando: false,
  error: null,

  cargarTrabajadores: async () => {
    set({ cargando: true, error: null });
    try {
      const trabajadores = await listarTodosLosTrabajadoresUseCase.execute();
      set({ trabajadores, cargando: false });
    } catch (error) {
      console.error("[trabajadoresAdminStore] error al cargar trabajadores", error);
      set({
        cargando: false,
        error: error instanceof Error ? error.message : "Error al cargar trabajadores",
      });
    }
  },

  obtenerPorId: (id: string) => obtenerTrabajadorPorIdUseCase.execute(id),

  crearTrabajador: async (request) => {
    set({ guardando: true, error: null });
    try {
      await crearTrabajadorUseCase.execute(request);
      set({ guardando: false });
      await get().cargarTrabajadores();
    } catch (error) {
      set({
        guardando: false,
        error: error instanceof Error ? error.message : "Error al crear trabajador",
      });
      throw error;
    }
  },

  actualizarTrabajador: async (request) => {
    set({ guardando: true, error: null });
    try {
      await actualizarTrabajadorUseCase.execute(request);
      set({ guardando: false });
      await get().cargarTrabajadores();
    } catch (error) {
      set({
        guardando: false,
        error: error instanceof Error ? error.message : "Error al actualizar trabajador",
      });
      throw error;
    }
  },

  eliminarTrabajador: async (id) => {
    set({ guardando: true, error: null });
    try {
      await eliminarTrabajadorUseCase.execute(id);
      set({ guardando: false });
      await get().cargarTrabajadores();
    } catch (error) {
      set({
        guardando: false,
        error: error instanceof Error ? error.message : "Error al eliminar trabajador",
      });
      throw error;
    }
  },
}));
