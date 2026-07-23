import type { AsistenciaSyncPayload } from "../../application/dto/AsistenciaSyncPayload";
import type { ISyncGateway } from "../../application/gateways/ISyncGateway";

/**
 * Implementación real de `ISyncGateway` sobre HTTP, lista para conectar el
 * día que exista un backend (Sprint 4: ver `hkc-backend/`, todavía sin
 * desplegar en el Mac mini). `store/syncStore.ts` usa
 * `UnconfiguredSyncGateway` por defecto — este es el reemplazo cuando haya
 * una URL real.
 *
 * Hace un `POST` por asistencia a `${baseUrl}/api/asistencias` con el
 * `AsistenciaSyncPayload` (ya denormalizado con nombre de trabajador y
 * proyecto — ver ese archivo para el porqué), autenticado con una API key
 * de dispositivo (`Authorization: Bearer <apiKey>`) — ver
 * `hkc-backend/BACKEND_ARCHITECTURE.md` para el contrato completo.
 *
 * **Limitación conocida y deliberada:** envía `fotoUri` tal cual (una ruta
 * local o `data:` URI), no el archivo en sí. Subir la foto de evidencia
 * (multipart o base64) queda para cuando el backend tenga almacenamiento de
 * archivos definido.
 */
export class HttpSyncGateway implements ISyncGateway {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
  ) {}

  async enviarAsistencia(payload: AsistenciaSyncPayload): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/asistencias`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`El servidor respondió ${response.status} ${response.statusText}`);
    }
  }
}
