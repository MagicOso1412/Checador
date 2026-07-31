import { create } from "zustand";

import type { ISyncGateway } from "@/application/gateways/ISyncGateway";
import {
  ObtenerEstadoSincronizacionUseCase,
  type EstadoSincronizacion,
} from "@/application/useCases/ObtenerEstadoSincronizacionUseCase";
import {
  SincronizarAsistenciasUseCase,
  type ResultadoSincronizacion,
} from "@/application/useCases/SincronizarAsistenciasUseCase";
import { SQLiteAsistenciaRepository } from "@/infrastructure/repositories/SQLiteAsistenciaRepository";
import { SQLiteProyectoRepository } from "@/infrastructure/repositories/SQLiteProyectoRepository";
import { SQLiteTrabajadorRepository } from "@/infrastructure/repositories/SQLiteTrabajadorRepository";
import { HttpSyncGateway } from "@/infrastructure/sync/HttpSyncGateway";
import { UnconfiguredSyncGateway } from "@/infrastructure/sync/UnconfiguredSyncGateway";
import {
  guardarConfigDispositivo,
  obtenerConfigDispositivo,
} from "@/infrastructure/storage/deviceConfigStorage";
import { CLAVE_SERVIDOR_API_KEY, CLAVE_SERVIDOR_URL } from "@/store/configuracionStore";

const CLAVE_ULTIMA_SINCRONIZACION = "ultima_sincronizacion";

const asistenciaRepository = new SQLiteAsistenciaRepository();
const obtenerEstadoSincronizacionUseCase = new ObtenerEstadoSincronizacionUseCase(asistenciaRepository);

/**
 * Arma el gateway justo antes de sincronizar (no una sola vez al cargar el
 * módulo) porque la URL/API key viven en SQLite y pueden cambiar en
 * cualquier momento desde `/configuracion/servidor` sin reiniciar la app. Si
 * el usuario todavía no configuró un servidor, cae en
 * `UnconfiguredSyncGateway` — mismo comportamiento honesto de antes (falla
 * claro, no finge éxito).
 */
async function construirSyncGateway(): Promise<ISyncGateway> {
  const [url, apiKey] = await Promise.all([
    obtenerConfigDispositivo(CLAVE_SERVIDOR_URL),
    obtenerConfigDispositivo(CLAVE_SERVIDOR_API_KEY),
  ]);

  if (!url || !apiKey) {
    return new UnconfiguredSyncGateway();
  }

  return new HttpSyncGateway(url, apiKey);
}

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
      const sincronizarAsistenciasUseCase = new SincronizarAsistenciasUseCase(
        asistenciaRepository,
        new SQLiteTrabajadorRepository(),
        new SQLiteProyectoRepository(),
        await construirSyncGateway(),
      );

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
