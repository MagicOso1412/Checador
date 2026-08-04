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
      client.ts     — funciones fetch (login, obtenerAsistencias, descargarCsv/Excel) + ApiError
    lib/
      estadisticas.ts  — resumen en memoria sobre los registros ya cargados
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

## Resumen y exportación a Excel (Sprint 6)

- `lib/estadisticas.ts` — `calcularResumen()` cuenta totales, trabajadores/proyectos
  únicos y desglose por tipo de movimiento, sobre `registros` (todo el rango de
  fechas ya filtrado por el backend), no sobre `filtrados` (el subconjunto de la
  búsqueda local de la tabla) — la búsqueda es para encontrar una fila, no para
  redefinir de qué habla el resumen. `DashboardPage.tsx` lo pinta como una fila de
  chips arriba de la tabla, mismo lenguaje visual que el "Resumen" del historial en
  la app móvil.
- **Excel**: se agregó `GET /api/asistencias/export.xlsx` en `hkc-backend` (mismas
  columnas y mismo filtro que `export.csv`, ver `hkc-backend/BACKEND_ARCHITECTURE.md`
  y `hkc-backend/src/lib/excel.ts`). El portal solo agrega
  `descargarAsistenciasExcel()` en `api/client.ts` (mismo patrón `Blob` + link
  temporal que ya usaba el CSV) y un segundo botón en `DashboardPage.tsx`. No se
  generó el `.xlsx` en el navegador a propósito: el backend ya es la fuente de
  verdad para reportes (mismo query, mismo límite de filas) y así CSV/Excel nunca
  pueden divergir entre sí por un bug de un solo lado. El archivo generado tiene
  encabezado real en negritas con relleno de color (ver la nota de `exceljs` en
  `hkc-backend/BACKEND_ARCHITECTURE.md`) — verificado el usuario descargando ambos
  formatos desde un backend real.
- **Aviso de resultados truncados**: `GET /api/asistencias` recorta a
  `LIMITE_POR_DEFECTO` (500) o `LIMITE_MAXIMO` (5000) filas por consulta (ver
  `hkc-backend/src/db/asistenciasQueries.ts`). Cuando el resultado llega
  exactamente a ese límite, el backend devuelve `limitado: true` y
  `DashboardPage.tsx` pinta un banner ("puede haber más registros sin mostrar,
  acota el rango de fechas") — sin esto, un usuario podía asumir en silencio que
  la lista/resumen/exportación cubrían todo el rango pedido cuando en realidad
  estaban recortados.
- **PDF** (mencionado en el roadmap original de Sprint 6) se dejó fuera de esta
  iteración: no hay todavía un caso de uso concreto para PDF que CSV/Excel no
  cubran (RH pidió "descargar o visualizar", no un documento con membrete) — se
  retoma si surge un requisito real (por ejemplo, un recibo o constancia
  individual, donde sí importa el formato impreso).

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

Funcional: login, lista filtrable, resumen, descarga CSV y Excel (con formato
real). **Verificado end-to-end contra un backend real** — el usuario probó login,
captura desde el móvil, sincronización y descarga de CSV/Excel de punta a punta
contra `hkc-backend` corriendo en local. La validación por tipos (`tsc --noEmit`,
limpio en ambos proyectos) se mantiene como chequeo previo a cada cambio; `vite
build` transforma los módulos sin errores, aunque en el sandbox de desarrollo no
llega a terminar por una limitación del entorno (no puede vaciar un `dist/`
existente, `EPERM: operation not permitted, unlink` — no es un error del código).

Pendiente: nada más falta para lo pedido (login, ver, descargar). Mejoras futuras
razonables: paginación si el volumen de registros crece mucho, gráficas/resumen
agregado (si RH lo pide), refresco de sesión sin tener que loguearse cada 8 horas.
