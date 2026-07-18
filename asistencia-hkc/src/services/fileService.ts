/**
 * @deprecated Movido a `src/infrastructure/storage/fileService.ts` para
 * seguir la estructura de capas del proyecto (infrastructure/storage/).
 * Este archivo queda como shim de compatibilidad porque el entorno de
 * desarrollo no permite borrar archivos; importa siempre desde la nueva
 * ubicación en código nuevo.
 */
export { ensurePhotosDirectory } from "../infrastructure/storage/fileService";
