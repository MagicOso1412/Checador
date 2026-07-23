# hkc-backend

Backend de HKC Attendance. Ver `BACKEND_ARCHITECTURE.md` para el diseño completo
(stack, decisiones, contrato de API).

## Requisitos

- Node.js 20 o superior.

## Arranque en desarrollo

```bash
npm install
npm run dev
```

Esto aplica las migraciones automáticamente al arrancar y levanta el servidor en
`http://localhost:3000` (configurable con la variable de entorno `PORT`).

## Dar de alta un dispositivo

Antes de que un teléfono pueda sincronizar, necesita una API key:

```bash
npm run crear-dispositivo -- "Kiosco Obra Norte"
```

Copia la `api_key` que imprime — es lo que va en `HttpSyncGateway` del lado del
cliente (`new HttpSyncGateway(urlDelServidor, apiKey)`).

## Probar el endpoint de sincronización

```bash
curl -X POST http://localhost:3000/api/asistencias \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_API_KEY" \
  -d '{
    "id": "test-1",
    "trabajadorId": "t1",
    "trabajadorNombre": "Juan Pérez",
    "numeroEmpleado": "EMP001",
    "proyectoId": "p1",
    "proyectoNombre": "Obra Norte",
    "tipoRegistro": "ENTRADA",
    "fechaHora": "2026-07-22T08:00:00.000Z",
    "fotoUri": "data:image/jpeg;base64,...",
    "latitud": null,
    "longitud": null
  }'
```

## Dar de alta un usuario de RH

```bash
npm run crear-usuario-rh -- "rh@empresa.com" "Nombre Apellido" "una-contraseña-segura"
```

## Probar el login y la lectura para RH

```bash
# Login → token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"rh@empresa.com","password":"una-contraseña-segura"}'

# Lista filtrable (usa el token que devolvió el login)
curl "http://localhost:3000/api/asistencias?proyectoId=p1" \
  -H "Authorization: Bearer TU_TOKEN"

# Descarga CSV
curl "http://localhost:3000/api/asistencias/export.csv" \
  -H "Authorization: Bearer TU_TOKEN" -o asistencias.csv
```

## Build para producción

```bash
npm run build
npm start
```

Para producción, define `JWT_SECRET` como variable de entorno persistente (ver
"Autenticación" en `BACKEND_ARCHITECTURE.md`) — sin ella, las sesiones de RH se
invalidan en cada reinicio del proceso.

## Estado

Ver el roadmap y la guía de despliegue en `BACKEND_ARCHITECTURE.md`. Hoy existen:
sincronización de asistencias (`POST /api/asistencias`), login de RH
(`POST /api/auth/login`) y lectura/exportación (`GET /api/asistencias`,
`GET /api/asistencias/export.csv`). Pendiente: desplegar en el Mac mini, y el
frontend del portal RH (esto es solo la API).
