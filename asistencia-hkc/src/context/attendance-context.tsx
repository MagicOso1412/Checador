import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import { MOVEMENT_TYPES } from "@/lib/mock-data";

/**
 * Estado compartido de UI que todavía no tiene lugar propio en la capa de
 * dominio: tipo de movimiento (entrada/salida) y modo de operación del
 * dispositivo (kiosco/campo).
 *
 * El proyecto seleccionado NO vive aquí: es estado real de negocio, viene de
 * SQLite vía `ObtenerProyectosUseCase` y vive en `store/proyectoStore.ts`
 * (Zustand). Las pantallas deben leer `proyectoSeleccionado` desde
 * `useProyectoStore()`, no desde este contexto.
 */
type AttendanceContextValue = {
  movementType: (typeof MOVEMENT_TYPES)[number];
  setMovementType: (movement: (typeof MOVEMENT_TYPES)[number]) => void;
  operationMode: "kiosco" | "campo";
  setOperationMode: (mode: "kiosco" | "campo") => void;
};

const AttendanceContext = createContext<AttendanceContextValue | null>(null);

export function AttendanceProvider({ children }: { children: ReactNode }) {
  const [movementType, setMovementType] =
    useState<(typeof MOVEMENT_TYPES)[number]>("Entrada");
  const [operationMode, setOperationMode] = useState<"kiosco" | "campo">("campo");

  const value = useMemo(
    () => ({
      movementType,
      setMovementType,
      operationMode,
      setOperationMode,
    }),
    [movementType, operationMode],
  );

  return (
    <AttendanceContext.Provider value={value}>{children}</AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const ctx = useContext(AttendanceContext);
  if (!ctx) {
    throw new Error("useAttendance debe usarse dentro de <AttendanceProvider>");
  }
  return ctx;
}
