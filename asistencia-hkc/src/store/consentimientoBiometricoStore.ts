import { create } from "zustand";

import { ConsentimientoBiometrico } from "@/domain/entities/ConsentimientoBiometrico";
import { ObtenerConsentimientoBiometricoUseCase } from "@/application/useCases/ObtenerConsentimientoBiometricoUseCase";
import { OtorgarConsentimientoBiometricoUseCase } from "@/application/useCases/OtorgarConsentimientoBiometricoUseCase";
import { RevocarConsentimientoBiometricoUseCase } from "@/application/useCases/RevocarConsentimientoBiometricoUseCase";
import { eliminarArchivo } from "@/infrastructure/storage/fileService";
import { SQLiteConsentimientoBiometricoRepository } from "@/infrastructure/repositories/SQLiteConsentimientoBiometricoRepository";
import { SQLiteFotoReferenciaFacialRepository } from "@/infrastructure/repositories/SQLiteFotoReferenciaFacialRepository";

const consentimientoRepository = new SQLiteConsentimientoBiometricoRepository();
const fotoRepository = new SQLiteFotoReferenciaFacialRepository();

const obtenerConsentimientoUseCase = new ObtenerConsentimientoBiometricoUseCase(consentimientoRepository);
const otorgarConsentimientoUseCase = new OtorgarConsentimientoBiometricoUseCase(consentimientoRepository);
const revocarConsentimientoUseCase = new RevocarConsentimientoBiometricoUseCase(consentimientoRepository, fotoRepository);

interface ConsentimientoBiometricoState {
  consentimiento: ConsentimientoBiometrico | null;
  cargando: boolean;
  guardando: boolean;
  error: string | null;

  cargarConsentimiento: (trabajadorId: string) => Promise<void>;
  otorgarConsentimiento: (trabajadorId: string) => Promise<void>;
  /** También borra (best-effort) los archivos físicos de las fotos que tenía el trabajador — ver el use case. */
  revocarConsentimiento: (trabajadorId: string) => Promise<void>;
}

/**
 * Consentimiento biométrico (Sprint 5): store dedicado, separado de
 * `fotosReferenciaStore`, mismo criterio ya usado en el proyecto — una
 * responsabilidad por store aunque varios stores se combinen en una misma
 * pantalla (`fotos.tsx` ya combina `fotosReferenciaStore` y
 * `trabajadoresAdminStore`).
 */
export const useConsentimientoBiometricoStore = create<ConsentimientoBiometricoState>((set) => ({
  consentimiento: null,
  cargando: false,
  guardando: false,
  error: null,

  cargarConsentimiento: async (trabajadorId) => {
    set({ cargando: true, error: null });
    try {
      const consentimiento = await obtenerConsentimientoUseCase.execute(trabajadorId);
      set({ consentimiento, cargando: false });
    } catch (error) {
      console.error("[consentimientoBiometricoStore] error al cargar consentimiento", error);
      set({
        cargando: false,
        error: error instanceof Error ? error.message : "Error al cargar el consentimiento",
      });
    }
  },

  otorgarConsentimiento: async (trabajadorId) => {
    set({ guardando: true, error: null });
    try {
      const consentimiento = await otorgarConsentimientoUseCase.execute(trabajadorId);
      set({ consentimiento, guardando: false });
    } catch (error) {
      set({
        guardando: false,
        error: error instanceof Error ? error.message : "No se pudo guardar el consentimiento",
      });
      throw error;
    }
  },

  revocarConsentimiento: async (trabajadorId) => {
    set({ guardando: true, error: null });
    try {
      const fotosBorradas = await revocarConsentimientoUseCase.execute(trabajadorId);
      // Best-effort, mismo criterio que `fotosReferenciaStore.eliminarFoto`: si
      // falla borrar un archivo físico, los registros ya se quitaron (que es
      // lo que importa para "ya no tengo tus fotos guardadas"), un archivo
      // huérfano es una fuga de almacenamiento menor, no un bug de datos.
      await Promise.all(
        fotosBorradas.map((foto) =>
          eliminarArchivo(foto.fotoUri).catch((err) =>
            console.warn("[consentimientoBiometricoStore] no se pudo borrar un archivo físico", err),
          ),
        ),
      );
      set({ guardando: false, consentimiento: null });
    } catch (error) {
      set({
        guardando: false,
        error: error instanceof Error ? error.message : "No se pudo revocar el consentimiento",
      });
      throw error;
    }
  },
}));
