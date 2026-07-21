import { create } from "zustand";

import { Proyecto } from "@/domain/entities/Proyecto";
import { ObtenerProyectosUseCase } from "@/application/useCases/ObtenerProyectosUseCase";
import { SQLiteProyectoRepository } from "@/infrastructure/repositories/SQLiteProyectoRepository";
import {
  guardarConfigDispositivo,
  obtenerConfigDispositivo,
} from "@/infrastructure/storage/deviceConfigStorage";

const obtenerProyectosUseCase = new ObtenerProyectosUseCase(new SQLiteProyectoRepository());

const CLAVE_PROYECTO_ASIGNADO = "proyecto_asignado_id";

interface ProyectoState {
  proyectos: Proyecto[];
  proyectoSeleccionado: Proyecto | null;
  cargando: boolean;
  error: string | null;

  /**
   * Carga los proyectos activos desde SQLite. Si el dispositivo ya tiene un
   * proyecto asignado guardado (Modo Kiosco, ver `seleccionarProyecto`) y
   * todavía no hay ninguno seleccionado en memoria, lo restaura.
   */
  cargarProyectos: () => Promise<void>;
  seleccionarProyecto: (proyecto: Proyecto) => void;
}

/**
 * Estado global del proyecto activo. La tablet puede moverse entre proyectos:
 * `proyectoSeleccionado` es el que se usará automáticamente para registrar
 * cualquier asistencia mientras no se cambie.
 *
 * `proyectoSeleccionado` se persiste en `configuracion_dispositivo` (SQLite,
 * ver `infrastructure/storage/deviceConfigStorage.ts`) para que un
 * dispositivo en Modo Kiosco (fijo en una obra, se espera que casi nunca
 * cambie de proyecto) no tenga que volver a preguntarlo en cada reinicio de
 * la app. Se eligió SQLite en vez de `zustand/middleware persist` +
 * AsyncStorage porque SQLite ya es una dependencia nativa comprobada en esta
 * app (migraciones, seeds, trabajadores/proyectos/asistencias) — agregar
 * AsyncStorage solo para esto sumaba otro módulo nativo que además requiere
 * reconstruir el dev client para quedar linkeado.
 *
 * Modo Campo no se ve afectado: su pantalla de selección
 * (`proyecto/seleccionar.tsx`) siempre se muestra explícitamente al entrar,
 * sin importar lo que haya persistido.
 */
export const useProyectoStore = create<ProyectoState>((set, get) => ({
  proyectos: [],
  proyectoSeleccionado: null,
  cargando: false,
  error: null,

  cargarProyectos: async () => {
    set({ cargando: true, error: null });
    try {
      const proyectos = await obtenerProyectosUseCase.execute();
      set({ proyectos, cargando: false });

      if (!get().proyectoSeleccionado) {
        const idAsignado = await obtenerConfigDispositivo(CLAVE_PROYECTO_ASIGNADO);
        const asignado = idAsignado ? proyectos.find((p) => p.id === idAsignado) : undefined;
        if (asignado) {
          set({ proyectoSeleccionado: asignado });
        }
      }
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
    guardarConfigDispositivo(CLAVE_PROYECTO_ASIGNADO, proyecto.id).catch((error) => {
      console.error("[proyectoStore] error al guardar proyecto asignado", error);
    });
  },
}));
