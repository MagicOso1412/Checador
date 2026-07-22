import { Asistencia } from "../../domain/entities/Asistencia";
import type { ISyncGateway } from "../../domain/gateways/ISyncGateway";
import type { AsistenciaDTO } from "../../application/dto/AsistenciaDTO";

function toDto(asistencia: Asistencia): AsistenciaDTO {
  return {
    id: asistencia.id,
    trabajadorId: asistencia.trabajadorId,
    proyectoId: asistencia.proyectoId,
    tipo: asistencia.tipoRegistro,
    fechaHora: asistencia.fechaHora,
    fotoUri: asistencia.fotoUri,
    latitud: asistencia.latitud,
    longitud: asistencia.longitud,
  };
}

/**
 * Implementación real de `ISyncGateway` sobre HTTP, lista para conectar el
 * día que exista un backend (Sprint 4 todavía no lo tiene — ver
 * `UnconfiguredSyncGateway`, que es lo que usa `store/syncStore.ts` por
 * defecto). Hace un `POST` por asistencia a `${baseUrl}/asistencias` con el
 * `AsistenciaDTO`.
 *
 * **Limitación conocida y deliberada:** envía `fotoUri` tal cual (una ruta
 * local o `data:` URI), no el archivo en sí. Subir la foto de evidencia
 * (multipart o base64) depende del contrato real que tenga el backend
 * cuando exista — no tiene sentido diseñarlo a ciegas antes de conocerlo.
 * Cuando haya una API real, este es el lugar a extender.
 */
export class HttpSyncGateway implements ISyncGateway {
  constructor(private readonly baseUrl: string) {}

  async enviarAsistencia(asistencia: Asistencia): Promise<void> {
    const response = await fetch(`${this.baseUrl}/asistencias`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toDto(asistencia)),
    });

    if (!response.ok) {
      throw new Error(`El servidor respondió ${response.status} ${response.statusText}`);
    }
  }
}
