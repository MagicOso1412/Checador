import { create } from "zustand";

import {
  guardarConfigDispositivo,
  obtenerConfigDispositivo,
} from "@/infrastructure/storage/deviceConfigStorage";

const CLAVE_MODO_OSCURO = "modo_oscuro";
const CLAVE_IDIOMA = "idioma";
const CLAVE_SERVIDOR = "servidor";
const CLAVE_FRECUENCIA_SYNC = "frecuencia_sync";
const CLAVE_CALIDAD_IMAGENES = "calidad_imagenes";
const CLAVE_ALERTAS_SYNC = "alertas_sync";

const VALORES_POR_DEFECTO = {
  modoOscuro: false,
  idioma: "Español",
  servidor: "Producción",
  frecuenciaSync: "15min",
  calidadImagenes: "Alta",
  alertasSync: true,
};

interface ConfiguracionState {
  cargando: boolean;
  modoOscuro: boolean;
  idioma: string;
  servidor: string;
  frecuenciaSync: string;
  calidadImagenes: string;
  alertasSync: boolean;

  cargarConfiguracion: () => Promise<void>;
  setModoOscuro: (valor: boolean) => void;
  setIdioma: (valor: string) => void;
  setServidor: (valor: string) => void;
  setFrecuenciaSync: (valor: string) => void;
  setCalidadImagenes: (valor: string) => void;
  setAlertasSync: (valor: boolean) => void;
}

function persistir(clave: string, valor: string) {
  guardarConfigDispositivo(clave, valor).catch((error) => {
    console.error(`[configuracionStore] error al guardar "${clave}"`, error);
  });
}

/**
 * Preferencias de la app persistidas en `configuracion_dispositivo` (SQLite),
 * mismo mecanismo que usa `proyectoStore` para recordar el proyecto asignado
 * en Modo Kiosco. Antes (`configuracion/index.tsx`) estos valores vivían en
 * `useState` local y se perdían en cada reinicio; ahora sobreviven porque se
 * leen/escriben aquí.
 *
 * Nota: "Servidor" y "Frecuencia de sync" son preferencias reales que se
 * guardan de verdad, pero todavía no tienen efecto funcional — la
 * sincronización en sí es Sprint 4. Guardarlas ahora no es un dato falso: es
 * la preferencia del usuario, honestamente persistida, a la espera de que
 * exista el módulo que la use.
 */
export const useConfiguracionStore = create<ConfiguracionState>((set) => ({
  cargando: false,
  ...VALORES_POR_DEFECTO,

  cargarConfiguracion: async () => {
    set({ cargando: true });
    try {
      const [modoOscuro, idioma, servidor, frecuenciaSync, calidadImagenes, alertasSync] = await Promise.all([
        obtenerConfigDispositivo(CLAVE_MODO_OSCURO),
        obtenerConfigDispositivo(CLAVE_IDIOMA),
        obtenerConfigDispositivo(CLAVE_SERVIDOR),
        obtenerConfigDispositivo(CLAVE_FRECUENCIA_SYNC),
        obtenerConfigDispositivo(CLAVE_CALIDAD_IMAGENES),
        obtenerConfigDispositivo(CLAVE_ALERTAS_SYNC),
      ]);

      set({
        cargando: false,
        modoOscuro: modoOscuro !== null ? modoOscuro === "1" : VALORES_POR_DEFECTO.modoOscuro,
        idioma: idioma ?? VALORES_POR_DEFECTO.idioma,
        servidor: servidor ?? VALORES_POR_DEFECTO.servidor,
        frecuenciaSync: frecuenciaSync ?? VALORES_POR_DEFECTO.frecuenciaSync,
        calidadImagenes: calidadImagenes ?? VALORES_POR_DEFECTO.calidadImagenes,
        alertasSync: alertasSync !== null ? alertasSync === "1" : VALORES_POR_DEFECTO.alertasSync,
      });
    } catch (error) {
      console.error("[configuracionStore] error al cargar configuración", error);
      set({ cargando: false });
    }
  },

  setModoOscuro: (valor) => {
    set({ modoOscuro: valor });
    persistir(CLAVE_MODO_OSCURO, valor ? "1" : "0");
  },
  setIdioma: (valor) => {
    set({ idioma: valor });
    persistir(CLAVE_IDIOMA, valor);
  },
  setServidor: (valor) => {
    set({ servidor: valor });
    persistir(CLAVE_SERVIDOR, valor);
  },
  setFrecuenciaSync: (valor) => {
    set({ frecuenciaSync: valor });
    persistir(CLAVE_FRECUENCIA_SYNC, valor);
  },
  setCalidadImagenes: (valor) => {
    set({ calidadImagenes: valor });
    persistir(CLAVE_CALIDAD_IMAGENES, valor);
  },
  setAlertasSync: (valor) => {
    set({ alertasSync: valor });
    persistir(CLAVE_ALERTAS_SYNC, valor ? "1" : "0");
  },
}));
