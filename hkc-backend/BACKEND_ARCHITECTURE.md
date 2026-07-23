# HKC Attendance — Backend (hkc-backend)

## Objetivo

Servicio HTTP que corre en el Mac mini de la empresa (accesible por internet, con
dominio/HTTPS — decisión tomada con el usuario). Dos consumidores:

- Los dispositivos móviles (`asistencia-hkc`, modos Campo/Kiosco) le envían las
  asistencias registradas localmente (`store/syncStore.ts` → `HttpSyncGateway`).
- El portal web de RH (todavía no construido) lee de aquí para ver/descargar
  asistencias de los trabajadores.

Es un proyecto npm separado, hermano de `asistencia-hkc/` dentro del mismo
repositorio (monorepo simple, sin tooling de workspaces todavía — no hace falta con
solo dos proyectos).

---

## Alcance de esta primera versión

Sí incluye:
- Recibir y almacenar asistencias sincronizadas.
- Autenticación simple por API key para dispositivos.
- Lectura filtrable de asistencias (pensada para el futuro portal RH).

Deliberadamente **no** incluye todavía (documentado para no perder de vista, no por
descuido):
- Sincronización del catálogo de trabajadores/proyectos. Cada dispositivo sigue
  siendo dueño de su propio catálogo local (igual que hoy). El payload de
  sincronización va denormalizado (nombre de trabajador/proyecto incluido, no solo
  el id) precisamente para que el backend no necesite ese catálogo para ser útil —
  ver la nota en `AsistenciaSyncPayload` del lado del cliente. Si más adelante RH
  necesita administrar centralmente trabajadores/proyectos (en vez de que cada
  teléfono tenga su propia lista), eso es un cambio de diseño más grande a conversar
  aparte.
- Subida del archivo real de la foto de evidencia (solo viaja la URI/metadata por
  ahora).
- UI del portal RH (esto es solo la API).
- Reintentos automáticos del lado del cliente (tiene sentido una vez que este
  backend esté realmente desplegado y accesible).

---

## Stack

- **Node.js + TypeScript** — mismo lenguaje que el cliente Expo, facilita mantener
  el contrato (`AsistenciaSyncPayload`) sincronizado entre ambos proyectos.
- **Express** — simple, bien documentado, suficiente para el volumen esperado
  (dispositivos de una sola empresa, no tráfico masivo). No se justifica Fastify/NestJS
  por rendimiento o estructura todavía.
- **SQLite vía `better-sqlite3`** — mismo criterio que se usó en el cliente: evita
  levantar y mantener un servidor de base de datos aparte en el Mac mini (Postgres
  requeriría instalación, usuarios, backups propios). Con el volumen esperado
  (registros de asistencia de una constructora, no miles de escrituras concurrentes
  por segundo), SQLite con `better-sqlite3` (API síncrona, muy rápida para este caso)
  es suficiente. **Camino de upgrade documentado, no tomado todavía:** si en el
  futuro el portal RH necesita queries concurrentes pesadas mientras varios
  dispositivos sincronizan a la vez, ese es el momento de migrar a Postgres — no
  antes, para no adelantar complejidad operativa que hoy no hace falta.
- Mismo patrón de **migraciones versionadas** que `asistencia-hkc` (consistencia
  entre ambos proyectos, mismo equipo mantiene los dos).

---

## Estructura de carpetas

```
hkc-backend/
  src/
    server.ts              — entry point, arranca el servidor HTTP
    app.ts                 — configura Express (middlewares, rutas)
    db/
      db.ts                — conexión better-sqlite3 + PRAGMA foreign_keys
      migrations/           — mismo patrón versionado que el cliente
        001_create_asistencias.ts
        002_create_dispositivos.ts
        index.ts
        types.ts
      migrationRunner.ts
    routes/
      health.routes.ts
      asistencias.routes.ts
    middleware/
      apiKeyAuth.ts        — valida `Authorization: Bearer <apiKey>` contra `dispositivos`
      errorHandler.ts
    dto/
      AsistenciaSyncPayload.ts  — copia del contrato del cliente (ver nota abajo)
  package.json
  tsconfig.json
  BACKEND_ARCHITECTURE.md
```

### Nota sobre tipos compartidos

El cliente (`asistencia-hkc`) y este backend son paquetes npm independientes, sin un
paquete de tipos compartido todavía. El contrato (`AsistenciaSyncPayload`) se
mantiene sincronizado **a mano** entre los dos por ahora — documentado explícitamente
aquí y en `asistencia-hkc/src/application/dto/AsistenciaSyncPayload.ts` para que un
cambio en uno recuerde actualizar el otro. Extraer un paquete compartido
(`hkc-shared-types`, npm workspace) tiene sentido si el contrato crece mucho — es
prematuro hacerlo ahora con un solo endpoint real.

---

## Autenticación

Dos mecanismos deliberadamente distintos, uno por tipo de cliente:

- **Dispositivos (teléfonos):** API key fija por dispositivo (`middleware/apiKeyAuth.ts`).
  Un admin la genera con `npm run crear-dispositivo -- "Nombre"` y la guarda en la
  tabla `dispositivos`; el dispositivo la guarda en su `configuracion_dispositivo`
  local (SQLite, cliente) y la manda como `Authorization: Bearer <apiKey>`. Simple y
  suficiente para el número pequeño de dispositivos controlados por la empresa — no
  se justifica OAuth ni JWT rotativo para este caso. Sin expiración (no tendría
  sentido para un dispositivo fijo); se revoca poniendo `activo = 0` en la fila.
- **Portal RH:** usuario/contraseña + JWT (`middleware/jwtAuth.ts`,
  `routes/auth.routes.ts`). `POST /api/auth/login` valida contra `usuarios_rh`
  (contraseña con `bcryptjs`, ver nota abajo) y devuelve un JWT de 8 horas; el portal
  lo manda como `Authorization: Bearer <token>` en cada llamada. Un admin da de alta
  usuarios con `npm run crear-usuario-rh -- "email" "Nombre" "password"` — sin
  autoregistro, a propósito.

  **Importante para producción:** define `JWT_SECRET` como variable de entorno
  persistente en el Mac mini (ver sección de despliegue). Sin ella, el proceso genera
  un secreto aleatorio en cada arranque y todas las sesiones de RH se invalidan en
  cada reinicio — funciona para desarrollo, no para producción.

  **Por qué `bcryptjs` y no `bcrypt`:** `bcrypt` requiere compilar un módulo nativo
  (igual que `better-sqlite3`) — para el volumen de logins de un puñado de personas
  de RH, la diferencia de performance frente a la versión pura en JavaScript es
  irrelevante, y evita depender de un toolchain de compilación en cada máquina donde
  se instale.

---

## Endpoints (v1)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/health` | Ninguna | Chequeo de salud/uptime. |
| POST | `/api/auth/login` | Ninguna (es el login) | `{ email, password }` → `{ token, usuario }`. |
| POST | `/api/asistencias` | API key de dispositivo | Recibe un `AsistenciaSyncPayload`. Idempotente por `id`: si ya existe, responde `200` sin duplicar (un dispositivo puede reintentar un envío que sí llegó pero cuya respuesta no recibió). |
| GET | `/api/asistencias` | Sesión RH (JWT) | Lectura filtrable: `?proyectoId=&trabajadorId=&desde=&hasta=&limite=` (todos opcionales; `desde`/`hasta` en ISO 8601). Devuelve `{ total, registros }`. |
| GET | `/api/asistencias/export.csv` | Sesión RH (JWT) | Mismo filtro que el anterior, como descarga CSV — el "ver o descargar" que RH necesita. |

---

## Pendiente

- Despliegue real en el Mac mini (proceso persistente con `pm2` o similar, exposición
  por internet vía Cloudflare Tunnel, `JWT_SECRET` persistente) — ver sección de
  despliegue más abajo.
- UI del portal RH (esto es solo la API — el frontend que consume estos endpoints
  todavía no existe).
- Subida real de fotos de evidencia (hoy solo viaja la URI/metadata).
- Sincronización del catálogo de trabajadores/proyectos, si se decide centralizarlo
  (ver la nota en "Alcance de esta primera versión").

---

## Despliegue en el Mac mini

Guía de referencia — ajusta según lo que ya tengan configurado en la máquina.

1. **Instalar Node.js** (20 o superior) en el Mac mini, si no está ya.
2. **Clonar el repo** y entrar a `hkc-backend/`.
3. **Variables de entorno persistentes** (por ejemplo en un archivo `.env` cargado por
   el proceso, o exportadas en el perfil del usuario que corre el servicio):
   - `JWT_SECRET` — genera uno una sola vez (`openssl rand -hex 32`) y no lo cambies
     después (cambiar el secreto invalida todas las sesiones de RH activas).
   - `PORT` — opcional, default `3000`.
   - `DB_PATH` — opcional, dónde vive el archivo SQLite (default `./data/hkc-backend.sqlite`).
4. **Instalar y compilar:**
   ```bash
   npm install
   npm run build
   ```
5. **Mantener el proceso corriendo** — un `node dist/server.js` suelto muere si la
   terminal se cierra o el proceso crashea. Usa un manejador de procesos, por ejemplo
   [`pm2`](https://pm2.keymetrics.io/):
   ```bash
   npm install -g pm2
   pm2 start dist/server.js --name hkc-backend
   pm2 save
   pm2 startup   # configura que pm2 arranque solo al reiniciar el Mac mini
   ```
6. **Dar de alta el primer usuario de RH y el primer dispositivo:**
   ```bash
   npm run crear-usuario-rh -- "rh@empresa.com" "Nombre Apellido" "una-contraseña-segura"
   npm run crear-dispositivo -- "Kiosco Obra Norte"
   ```
7. **Exponer por internet con HTTPS**, para que los teléfonos en obra y el portal RH
   puedan llegar desde fuera de la red de la oficina (decisión ya tomada con el
   usuario). Recomendado: **Cloudflare Tunnel** (`cloudflared`) — no requiere abrir
   puertos en el router ni gestionar certificados TLS a mano:
   ```bash
   brew install cloudflared
   cloudflared tunnel login
   cloudflared tunnel create hkc-backend
   # apunta el túnel a http://localhost:3000 y asígnale un subdominio
   # (ej. asistencia.tuempresa.com) siguiendo la guía oficial de Cloudflare Tunnel
   cloudflared tunnel run hkc-backend
   ```
   Alternativa tradicional (más piezas que mantener): DNS dinámico + port forwarding
   en el router + certificado TLS (Let's Encrypt vía Caddy o nginx) — válida si ya
   tienen ese setup, pero Cloudflare Tunnel evita tocar la configuración de red de la
   oficina.
8. **Configurar el cliente Expo** para apuntar al backend real: en
   `asistencia-hkc/src/store/syncStore.ts`, reemplazar
   `new UnconfiguredSyncGateway()` por
   `new HttpSyncGateway("https://asistencia.tuempresa.com", "<apiKey del dispositivo>")`.

---

## Siguientes pasos sugeridos (fuera de este documento)

- **Portal web RH:** consumir `POST /api/auth/login` y `GET /api/asistencias(/export.csv)`.
  Como `asistencia-hkc` ya compila a web (Expo Router + Metro), es una opción construirlo
  como rutas nuevas dentro del mismo proyecto cliente en vez de un proyecto aparte — a
  decidir cuando se aborde esa pieza.
- **Distribución móvil (Android/iOS), interna, sin tiendas públicas** (decisión ya
  tomada con el usuario):
  - Android: `eas build --platform android --profile preview` (o el perfil que se
    configure) genera un `.apk` instalable directo, sin cuenta de desarrollador.
  - iOS: requiere una cuenta de Apple Developer Program (el usuario confirmó que
    todavía no la tiene) antes de poder generar un build instalable en un iPhone
    físico — con ella, `eas build --platform ios` + distribución ad-hoc o TestFlight.
    Mientras tanto, el desarrollo y las pruebas en Android/web pueden seguir
    avanzando sin bloquearse.
