/**
 * Shim de tipos para `lucide-react-native`.
 *
 * El paquete instala sus `.d.ts` oficiales en `node_modules/lucide-react-native/dist/types`,
 * pero en este entorno la copia de esos archivos (miles de `.d.ts`, uno por ícono) al disco
 * montado de Windows es extremadamente lenta y quedó incompleta. Este shim declara solo los
 * íconos que usamos hoy en la app para que TypeScript no falle; en tiempo de ejecución
 * (Metro/Babel) los tipos no importan, así que esto no afecta el funcionamiento de la app.
 *
 * Si agregas un ícono nuevo de lucide-react-native y TypeScript se queja de que no existe,
 * agrégalo a la lista de abajo (o, si prefieres, borra este archivo una vez que
 * `node_modules/lucide-react-native/dist/types` esté completo — por ejemplo tras un
 * `rm -rf node_modules && npm install` en tu máquina local en vez de en este entorno).
 */
declare module "lucide-react-native" {
  import type { ComponentType } from "react";

  export interface LucideProps {
    size?: string | number;
    color?: string;
    strokeWidth?: string | number;
    absoluteStrokeWidth?: boolean;
  }

  type LucideIcon = ComponentType<LucideProps>;

  export const ArrowLeft: LucideIcon;
  export const AlertTriangle: LucideIcon;
  export const Bell: LucideIcon;
  export const Building2: LucideIcon;
  export const Calendar: LucideIcon;
  export const Camera: LucideIcon;
  export const CheckCircle: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const ClipboardList: LucideIcon;
  export const Clock: LucideIcon;
  export const Download: LucideIcon;
  export const Globe: LucideIcon;
  export const HardDrive: LucideIcon;
  export const History: LucideIcon;
  export const Image: LucideIcon;
  export const Info: LucideIcon;
  export const Layers: LucideIcon;
  export const LogOut: LucideIcon;
  export const MapPin: LucideIcon;
  export const Moon: LucideIcon;
  export const Navigation: LucideIcon;
  export const Plus: LucideIcon;
  export const RefreshCw: LucideIcon;
  export const Scan: LucideIcon;
  export const Server: LucideIcon;
  export const Settings: LucideIcon;
  export const Shield: LucideIcon;
  export const Smartphone: LucideIcon;
  export const Trash2: LucideIcon;
  export const UploadCloud: LucideIcon;
  export const User: LucideIcon;
  export const Users: LucideIcon;
  export const Wifi: LucideIcon;
  export const WifiOff: LucideIcon;
  export const XCircle: LucideIcon;
}
