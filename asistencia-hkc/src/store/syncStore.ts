import { create } from "zustand";

import {
  ObtenerEstadoSincronizacionUseCase,
  type EstadoSincronizacion,
} from "@/application/useCases/ObtenerEstadoSincronizacionUseCase";
import {
  SincronizarAsistenciasUseCase,
  type ResultadoSincronizacion,
} from "@/application/useCases/SincronizarAsistenciasUseCase";
import { SQLiteAsistenciaRepository } from "@/infrastructure/repositories/SQLiteAsistenciaRepository";
import { UnconfiguredSyncGateway } from "@/infrastructure/sync/UnconfiguredSyncGateway";
import {
  guardarConfigDispositivo,
  obtenerConfigDispositivo,
} from "@/infrastructure/storage/deviceConfigStorage";

const CLAVE_ULTIMA_SINCRONIZACION = "ultima_sincronizacion";

const asistenciaRepository = new SQLiteAsistenciaRepository();
const obtenerEstadoSincronizacionUseCase = new ObtenerEstadoSincronizacionUseCase(asistenciaRepository);

/**
 * Gateway usado por esta app hoy: no hay backend real (Sprint 4 no lo
 * define todavía), así que cualquier intento de sincronizar falla con un
 * mensaje honesto en vez de fingir éxito — ver `UnconfiguredSyncGateway`.
 * El día que exista un backend, este es el único lugar que hay que cambiar
 * (por ejemplo, a `new HttpSyncGateway(urlDelServidor)`); todo lo demás
 * (cola, reintentos, UI) ya está listo.
 */
const sincronizarAsistenciasUseCase = new SincronizarAsistenciasUseCase(
  asistenciaRepository,
  new UnconfiguredSyncGateway(),
);

interface SyncState {
  pendientes: number;
  conError: number;
  cargando: boolean;
  sincronizando: boolean;
  progreso: { procesados: number; total: number } | null;
  ultimoResultado: ResultadoSincronizacion | null;
  ultimaSincronizacion: Date | null;
  error: string | null;

  cargarEstado: () => Promise<void>;
  sincronizar: () => Promise<void>;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  pendientes: 0,
  conError: 0,
  cargando: false,
  sincronizando: false,
  progreso: null,
  ultimoResultado: null,
  ultimaSincronizacion: null,
  error: null,

  cargarEstado: async () => {
    set({ cargando: true, error: null });
    try {
      const [estado, ultimaSincronizacionIso] = await Promise.all([
        obtenerEstadoSincronizacionUseCase.execute(),
        obtenerConfigDispositivo(CLAVE_ULTIMA_SINCRONIZACION),
      ]);

      set({
        cargando: false,
        pendientes: estado.pendientes,
        conError: estado.conError,
        ultimaSincronizacion: ultimaSincronizacionIso ? new Date(ultimaSincronizacionIso) : null,
      });
    } catch (error) {
      console.error("[syncStore] error al cargar estado de sincronización", error);
      set({
        cargando: false,
        error: error instanceof Error ? error.message : "Error al cargar el estado de sincronización",
      });
    }
  },

  sincronizar: async () => {
    if (get().sincronizando) return;

    set({ sincronizando: true, error: null, progreso: { procesados: 0, total: 0 } });
    try {
      const resultado = await sincronizarAsistenciasUseCase.execute((procesados, total) => {
        set({ progreso: { procesados, total } });
      });

      const ahora = new Date();
      await guardarConfigDispositivo(CLAVE_ULTIMA_SINCRONIZACION, ahora.toISOString());

      set({ sincronizando: false, progreso: null, ultimoResultado: resultado, ultimaSincronizacion: ahora });
      await get().cargarEstado();
    } catch (error) {
      console.error("[syncStore] error al sincronizar", error);
      set({
        sincronizando: false,
        progreso: null,
        error: error instanceof Error ? error.message : "Error al sincronizar",
      });
    }
  },
}));
