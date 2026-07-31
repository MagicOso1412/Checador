/**
 * Similitud coseno entre dos embeddings faciales (fase 3, reconocimiento).
 * Función pura, sin dependencias — se puede probar hoy aunque todavía no
 * exista quien genere embeddings reales (`IReconocimientoFacialService`).
 * Devuelve un valor entre -1 y 1; en la práctica, para embeddings faciales
 * normalizados, valores cercanos a 1 significan "es la misma persona".
 *
 * El umbral de decisión ("¿qué tan cerca de 1 cuenta como match?") depende
 * del modelo TFLite que se use — no se fija aquí a propósito, vive en el
 * futuro `ReconocerTrabajadorUseCase` cuando exista un modelo real con el
 * que calibrarlo.
 */
export function similitudCoseno(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Los embeddings tienen dimensiones distintas (${a.length} vs ${b.length})`);
  }
  if (a.length === 0) {
    throw new Error("Los embeddings no pueden estar vacíos");
  }

  let productoPunto = 0;
  let normaA = 0;
  let normaB = 0;

  for (let i = 0; i < a.length; i++) {
    productoPunto += a[i] * b[i];
    normaA += a[i] * a[i];
    normaB += b[i] * b[i];
  }

  if (normaA === 0 || normaB === 0) {
    return 0;
  }

  return productoPunto / (Math.sqrt(normaA) * Math.sqrt(normaB));
}
