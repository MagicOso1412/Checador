import { create } from "zustand";

import {
  guardarConfigDispositivo,
  obtenerConfigDispositivo,
} from "@/infrastructure/storage/deviceConfigStorage";

const CLAVE_MODO_OSCURO = "modo_oscuro";
const CLAVE_IDIOMA = "idioma";
const CLAVE_FRECUENCIA_SYNC = "frecuencia_sync";
const CLAVE_CALIDAD_IMAGENES = "calidad_imagenes";
const CLAVE_ALERTAS_SYNC = "alertas_sync";

/**
 * Claves de la URL del backend y la API key del dispositivo (Sprint 4:
 * `HttpSyncGateway`). Se exportan (no solo se usan aquí) porque
 * `syncStore.ts` también las necesita para decidir, al momento de
 * sincronizar, si construir un `HttpSyncGateway` real o seguir usando
 * `UnconfiguredSyncGateway` — un solo lugar dueño de los nombres de clave,
 * para que no puedan desalinearse entre los dos stores.
 */
export const CLAVE_SERVIDOR_URL = "servidor_url";
export const CLAVE_SERVIDOR_API_KEY = "servidor_api_key";

const VALORES_POR_DEFECTO = {
  modoOscuro: false,
  idioma: "Español",
  servidorUrl: "",
  servidorApiKey: "",
  frecuenciaSync: "15min",
  calidadImagenes: "Alta",
  alertasSync: true,
};

interface ConfiguracionState {
  cargando: boolean;
  modoOscuro: boolean;
  idioma: string;
  servidorUrl: string;
  servidorApiKey: string;
  frecuenciaSync: string;
  calidadImagenes: string;
  alertasSync: boolean;

  cargarConfiguracion: () => Promise<void>;
  setModoOscuro: (valor: boolean) => void;
  setIdioma: (valor: string) => void;
  setServidor: (url: string, apiKey: string) => void;
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
 * Nota: "Servidor" (URL + API key) ya tiene efecto funcional real — es lo
 * que usa `syncStore.ts` para construir `HttpSyncGateway` — pero "Frecuencia
 * de sync" sigue siendo solo una preferencia guardada sin disparador
 * automático detrás (ver "Por qué no hay reintentos automáticos todavía" en
 * ARCHITECTURE.md): hoy la sincronización se dispara a mano desde `/sync`.
 */
export const useConfiguracionStore = create<ConfiguracionState>((set) => ({
  cargando: false,
  ...VALORES_POR_DEFECTO,

  cargarConfiguracion: async () => {
    set({ cargando: true });
    try {
      const [modoOscuro, idioma, servidorUrl, servidorApiKey, frecuenciaSync, calidadImagenes, alertasSync] =
        await Promise.all([
          obtenerConfigDispositivo(CLAVE_MODO_OSCURO),
          obtenerConfigDispositivo(CLAVE_IDIOMA),
          obtenerConfigDispositivo(CLAVE_SERVIDOR_URL),
          obtenerConfigDispositivo(CLAVE_SERVIDOR_API_KEY),
          obtenerConfigDispositivo(CLAVE_FRECUENCIA_SYNC),
          obtenerConfigDispositivo(CLAVE_CALIDAD_IMAGENES),
          obtenerConfigDispositivo(CLAVE_ALERTAS_SYNC),
        ]);

      set({
        cargando: false,
        modoOscuro: modoOscuro !== null ? modoOscuro === "1" : VALORES_POR_DEFECTO.modoOscuro,
        idioma: idioma ?? VALORES_POR_DEFECTO.idioma,
        servidorUrl: servidorUrl ?? VALORES_POR_DEFECTO.servidorUrl,
        servidorApiKey: servidorApiKey ?? VALORES_POR_DEFECTO.servidorApiKey,
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
  setServidor: (url, apiKey) => {
    set({ servidorUrl: url, servidorApiKey: apiKey });
    persistir(CLAVE_SERVIDOR_URL, url);
    persistir(CLAVE_SERVIDOR_API_KEY, apiKey);
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
