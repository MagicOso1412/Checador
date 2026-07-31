/**
 * Una foto de referencia de un trabajador, usada como material de
 * entrenamiento/comparación para el futuro reconocimiento facial (Sprint 5).
 * Varias de estas por trabajador — ver la nota en la migración 008 sobre por
 * qué una sola foto no basta.
 *
 * Deliberadamente no tiene `embedding` todavía: generar el vector de
 * características requiere el motor de reconocimiento real (fase 2-3, ver
 * `application/ports/IReconocimientoFacialService.ts`), que hoy es un
 * `NoOpReconocimientoFacialService`. Agregar el campo ahora sería un dato
 * que nadie llena — se agrega cuando exista quien lo calcule.
 */
export class FotoReferenciaFacial {
  constructor(
    public readonly id: string,
    public readonly trabajadorId: string,
    public readonly fotoUri: string,
    public readonly creadoEn: Date,
  ) {}
}
