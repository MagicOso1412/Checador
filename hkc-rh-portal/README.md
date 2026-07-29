# hkc-rh-portal

Portal web de RH para HKC Attendance. Ver `PORTAL_ARCHITECTURE.md` para el diseño
completo.

## Requisitos

- Node.js 20 o superior.
- `hkc-backend` corriendo (local en `http://localhost:3000`, o desplegado — ver
  `VITE_API_URL`).

## Desarrollo

```bash
npm install
npm run dev
```

## Primer acceso

Necesitas un usuario de RH ya creado en el backend:

```bash
# desde hkc-backend/
npm run crear-usuario-rh -- "rh@empresa.com" "Nombre Apellido" "una-contraseña-segura"
```

## Build de producción

```bash
npm run build   # genera dist/
```

Copia `.env.example` a `.env` y define `VITE_API_URL` con la URL real del backend
antes de buildear para producción.
