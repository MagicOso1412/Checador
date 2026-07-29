# HKC Attendance — Portal RH (hkc-rh-portal)

## Objetivo

Portal web para que RH vea y descargue las asistencias sincronizadas de los
trabajadores. Consume la API de `hkc-backend` (login + lectura de asistencias) —
ver `hkc-backend/BACKEND_ARCHITECTURE.md` para el contrato completo.

Es un proyecto npm separado, hermano de `asistencia-hkc/` y `hkc-backend/` en el
mismo repositorio. Se eligió así (y no como rutas nuevas dentro de la app Expo, que
también compila a web) para no arrastrar al bundle de RH todo el stack de la app
móvil (cámara, SQLite, modos Campo/Kiosco) que no le sirve a este caso de uso —
decisión tomada con el usuario.

---

## Stack

- **React 19 + TypeScript + Vite** — SPA renderizada 100% en el cliente. No hay SSR
  ni prerendering: es un portal interno detrás de login, sin necesidad de SEO ni de
  tiempo de carga inicial optimizado para visitantes anónimos.
- **react-router-dom** — dos rutas (`/login`, `/`), sin más complejidad de ruteo por
  ahora.
- Sin librería de UI ni Tailwind: el CSS (`src/index.css`) es plano y reutiliza la
  paleta de colores de `asistencia-hkc/src/constants/palette.ts` para consistencia
  de marca entre la app móvil y el portal — proporcional al tamaño de este proyecto
  (unas pocas pantallas), no se justifica un framework de estilos aparte.

---

## Estructura

```
hkc-rh-portal/
  src/
    api/
      types.ts     — copia manual de los tipos de respuesta de hkc-backend
      client.ts     — funciones fetch (login, obtenerAsistencias, descargarCsv) + ApiError
    context/
      AuthContext.tsx  — sesión (JWT + usuario) persistida en localStorage
    components/
      ProtectedRoute.tsx
    pages/
      LoginPage.tsx
      DashboardPage.tsx
    App.tsx, main.tsx, index.css, vite-env.d.ts
  index.html, vite.config.ts, tsconfig.json, package.json
```

### Nota sobre tipos compartidos

Mismo criterio que entre `asistencia-hkc` y `hkc-backend`: `src/api/types.ts` es una
copia manual del contrato de `hkc-backend` (no hay paquete de tipos compartido entre
los tres proyectos todavía). Si el contrato crece, ese es el momento de evaluar un
workspace de npm con tipos compartidos.

---

## Autenticación

`AuthContext` guarda el JWT y los datos del usuario en `localStorage` tras un login
exitoso (`POST /api/auth/login`). El token es stateless y expira a las 8 horas (ver
`hkc-backend/src/lib/jwt.ts`) — no hay refresco automático: si expira, la siguiente
llamada a la API responde `401`, `DashboardPage` lo detecta (`ApiError.status === 401`
en `api/client.ts`) y cierra la sesión, mandando de vuelta a `/login`.

---

## Filtros de asistencias: por qué el buscador es local

`GET /api/asistencias` acepta `proyectoId`/`trabajadorId` como filtros, pero el
portal **no** los usa directamente — RH no conoce esos ids internos, y el backend no
sincroniza un catálogo de trabajadores/proyectos con nombres para armar un selector
(ver la nota de denormalización en `hkc-backend/BACKEND_ARCHITECTURE.md`). En su
lugar: el portal pide por rango de fechas (`desde`/`hasta`, sí soportado por la API)
y filtra por nombre/número de empleado/proyecto **en memoria**, sobre lo ya
descargado (`DashboardPage.tsx`, `useMemo` sobre `busqueda`). Es una decisión
proporcional al volumen esperado (asistencias de una constructora, no una consulta
contra millones de filas) — si el volumen creciera mucho, ahí sí valdría la pena un
endpoint de búsqueda por texto en el backend.

---

## Dependencias — nota de seguridad

`npm audit` marca una advisory de severidad alta en `react-router` (RSC Mode CSRF
Bypass, GHSA-qwww-vcr4-c8h2). Se evaluó y **no aplica a este proyecto**: la
vulnerabilidad es específica de "RSC Mode" (React Server Components con acciones de
servidor) y de prerendering/SSR — este portal es una SPA pura, renderizada 100% en
el cliente (`createRoot` + `BrowserRouter`), sin `react-router.config.ts`, sin
loaders/actions de servidor, sin prerendering. Se evaluó bajar a la versión sugerida
por el fix automático (`7.11.0`) y resultó **peor**: esa versión tiene más
advisories abiertas (varias también de SSR/RSC, igual de inaplicables, pero más
superficie de todos modos). Se dejó en `^7.18.2` a propósito. Revisar de nuevo si
git nos algún día se agrega SSR/RSC a este proyecto (no hay planes de hacerlo).

---

## Desarrollo local

```bash
npm install
npm run dev
```

Por defecto apunta a `http://localhost:3000` (`hkc-backend` corriendo en local). Para
apuntar a un backend desplegado, define `VITE_API_URL` (ver `.env.example`).

## Build

```bash
npm run build   # tsc --noEmit + vite build → dist/
```

`dist/` es un sitio estático — se puede servir desde el mismo Mac mini (por ejemplo
con `serve` o un `Caddy`/`nginx` simple) o desde cualquier hosting estático (Vercel,
Netlify, GitHub Pages, etc.), siempre que `VITE_API_URL` en build time apunte al
backend real.

---

## Estado

Funcional: login, lista filtrable, descarga CSV. **No verificado end-to-end en un
entorno con backend corriendo** — el sandbox de desarrollo no pudo compilar el
binario nativo de `better-sqlite3` (bloqueo de red, ver `hkc-backend/README.md`), así
que la validación de este proyecto fue por tipos (`tsc --noEmit`, limpio) y build de
producción (`vite build`, exitoso), no por una prueba manual de la UI contra un
backend real. Vale la pena una prueba manual completa (login real, datos reales) en
cuanto el backend esté desplegado.

Pendiente: nada más falta para lo pedido (login, ver, descargar). Mejoras futuras
razonables: paginación si el volumen de registros crece mucho, gráficas/resumen
agregado (si RH lo pide), refresco de sesión sin tener que loguearse cada 8 horas.
