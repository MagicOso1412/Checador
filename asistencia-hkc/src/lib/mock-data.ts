/**
 * Datos de ejemplo para poder navegar y visualizar la app mientras se conecta
 * la lógica real (SQLite local, reconocimiento facial, sincronización con
 * servidor, etc.). Reemplazar por datos reales conforme se implemente cada
 * módulo.
 */

export type Project = {
  id: string;
  name: string;
  company: string;
  location: string;
  employees: number;
  synced: boolean;
  pending: number;
};

export const PROJECTS: Project[] = [
  {
    id: "1",
    name: "Torre Residencial Bosques",
    company: "Constructora Ávila",
    location: "Monterrey, NL",
    employees: 48,
    synced: true,
    pending: 0,
  },
  {
    id: "2",
    name: "Puente Vehicular Km 34",
    company: "Infraestructura del Norte",
    location: "Saltillo, Coah.",
    employees: 31,
    synced: false,
    pending: 7,
  },
  {
    id: "3",
    name: "Centro Comercial Arcos",
    company: "Desarrollos Arcos SA",
    location: "Guadalajara, Jal.",
    employees: 62,
    synced: true,
    pending: 0,
  },
  {
    id: "4",
    name: "Planta Industrial Sigma",
    company: "Sigma Alimentos",
    location: "San Pedro, NL",
    employees: 25,
    synced: false,
    pending: 3,
  },
  {
    id: "5",
    name: "Boulevard Zona Tec",
    company: "Municipio de MTY",
    location: "Monterrey, NL",
    employees: 18,
    synced: true,
    pending: 0,
  },
];

export type HistoryStatus = "synced" | "pending" | "error";

export type HistoryRecord = {
  id: string;
  name: string;
  employee: string;
  time: string;
  type: string;
  photo: string;
  status: HistoryStatus;
};

export const HISTORY_RECORDS: HistoryRecord[] = [
  {
    id: "1",
    name: "Carlos Mendoza Ruiz",
    employee: "EMP-0041",
    time: "08:14",
    type: "Entrada",
    photo:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&auto=format",
    status: "synced",
  },
  {
    id: "2",
    name: "Ana Sofía García",
    employee: "EMP-0078",
    time: "08:22",
    type: "Entrada",
    photo:
      "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=120&h=120&fit=crop&auto=format",
    status: "synced",
  },
  {
    id: "3",
    name: "Roberto Salinas",
    employee: "EMP-0015",
    time: "12:01",
    type: "Comida Inicio",
    photo:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&auto=format",
    status: "pending",
  },
  {
    id: "4",
    name: "Lucía Torres Ríos",
    employee: "EMP-0093",
    time: "12:03",
    type: "Comida Inicio",
    photo:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&auto=format",
    status: "pending",
  },
  {
    id: "5",
    name: "Miguel Ángel Díaz",
    employee: "EMP-0057",
    time: "07:55",
    type: "Entrada",
    photo:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&auto=format",
    status: "error",
  },
];

export const STATUS_STYLES: Record<HistoryStatus, { bg: string; text: string }> = {
  synced: { bg: "bg-green-100", text: "text-green-700" },
  pending: { bg: "bg-amber-100", text: "text-amber-700" },
  error: { bg: "bg-red-100", text: "text-red-700" },
};

export const STATUS_LABELS: Record<HistoryStatus, string> = {
  synced: "Sincronizado",
  pending: "Pendiente",
  error: "Error",
};

export const MOVEMENT_TYPES = ["Entrada", "Salida", "Comida Inicio", "Comida Fin"] as const;

/** Colaborador "reconocido" de ejemplo, usado en las pantallas de confirmación/éxito. */
export const MOCK_EMPLOYEE = {
  name: "Carlos Mendoza Ruiz",
  employeeNumber: "EMP-0041",
  photo:
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&auto=format",
};
