import { create } from "zustand";

import { FotoReferenciaFacial } from "@/domain/entities/FotoReferenciaFacial";
import { MAXIMO_FOTOS_POR_TRABAJADOR } from "@/domain/repositories/IFotoReferenciaFacialRepository";
import { CapturarFotoReferenciaUseCase } from "@/application/useCases/CapturarFotoReferenciaUseCase";
import { EliminarFotoReferenciaUseCase } from "@/application/useCases/EliminarFotoReferenciaUseCase";
import { ObtenerFotosReferenciaUseCase } from "@/application/useCases/ObtenerFotosReferenciaUseCase";
import { eliminarArchivo } from "@/infrastructure/storage/fileService";
import { SQLiteFotoReferenciaFacialRepository } from "@/infrastructure/repositories/SQLiteFotoReferenciaFacialRepository";

const fotoRepository = new SQLiteFotoReferenciaFacialRepository();
const obtenerFotosReferenciaUseCase = new ObtenerFotosReferenciaUseCase(fotoRepository);
const capturarFotoReferenciaUseCase = new CapturarFotoReferenciaUseCase(fotoRepository);
const eliminarFotoReferenciaUseCase = new EliminarFotoReferenciaUseCase(fotoRepository);

interface FotosReferenciaState {
  fotos: FotoReferenciaFacial[];
  cargando: boolean;
  guardando: boolean;
  error: string | null;

  cargarFotos: (trabajadorId: string) => Promise<void>;
  capturarFoto: (trabajadorId: string, fotoUri: string) => Promise<void>;
  eliminarFoto: (foto: FotoReferenciaFacial) => Promise<void>;
}

/**
 * Fotos de referencia por trabajador (Sprint 5, Fase 1 — captura y gestión;
 * la generación de embeddings/reconocimiento real es una fase posterior, ver
 * `application/ports/IReconocimientoFacialService.ts`). Store dedicado,
 * mismo criterio que `trabajadoresAdminStore`: una responsabilidad por
 * store, aunque ambos toquen datos relacionados con `trabajadores`.
 */
export const useFotosReferenciaStore = create<FotosReferenciaState>((set, get) => ({
  fotos: [],
  cargando: false,
  guardando: false,
  error: null,

  cargarFotos: async (trabajadorId) => {
    set({ cargando: true, error: null });
    try {
      const fotos = await obtenerFotosReferenciaUseCase.execute(trabajadorId);
      set({ fotos, cargando: false });
    } catch (error) {
      console.error("[fotosReferenciaStore] error al cargar fotos", error);
      set({
        cargando: false,
        error: error instanceof Error ? error.message : "Error al cargar fotos de referencia",
      });
    }
  },

  capturarFoto: async (trabajadorId, fotoUri) => {
    set({ guardando: true, error: null });
    try {
      await capturarFotoReferenciaUseCase.execute(trabajadorId, fotoUri);
      set({ guardando: false });
      await get().cargarFotos(trabajadorId);
    } catch (error) {
      set({
        guardando: false,
        error: error instanceof Error ? error.message : "Error al guardar la foto",
      });
      throw error;
    }
  },

  eliminarFoto: async (foto) => {
    set({ guardando: true, error: null });
    try {
      await eliminarFotoReferenciaUseCase.execute(foto.id);
      // Best-effort: si falla borrar el archivo físico, el registro ya se
      // quitó (que es lo que importa para la UI/el conteo); un archivo
      // huérfano es una fuga de almacenamiento menor, no un bug de datos.
      await eliminarArchivo(foto.fotoUri).catch((err) =>
        console.warn("[fotosReferenciaStore] no se pudo borrar el archivo físico", err),
      );
      set({ guardando: false });
      await get().cargarFotos(foto.trabajadorId);
    } catch (error) {
      set({
        guardando: false,
        error: error instanceof Error ? error.message : "Error al eliminar la foto",
      });
      throw error;
    }
  },
}));

export { MAXIMO_FOTOS_POR_TRABAJADOR };
