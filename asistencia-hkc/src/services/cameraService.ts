/**
 * @deprecated Movido a `src/infrastructure/camera/cameraService.ts` para
 * seguir la estructura de capas del proyecto (infrastructure/camera/).
 * Este archivo queda como shim de compatibilidad porque el entorno de
 * desarrollo no permite borrar archivos; importa siempre desde la nueva
 * ubicación en código nuevo.
 */
export { savePhoto } from "../infrastructure/camera/cameraService";
export type { SavedPhoto } from "../infrastructure/camera/cameraService";
