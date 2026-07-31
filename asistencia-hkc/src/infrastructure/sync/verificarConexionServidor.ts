/**
 * Chequeo de conectividad simple para la pantalla de configuración del
 * servidor: pega a `GET /health` (sin autenticación, ver
 * `hkc-backend/src/routes/health.routes.ts`) y confirma que responde. No
 * vive en `HttpSyncGateway` a propósito: ese gateway solo sabe enviar
 * asistencias (una responsabilidad), esto es un chequeo de UI, no parte del
 * contrato de sincronización.
 */
export async function verificarConexionServidor(baseUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
