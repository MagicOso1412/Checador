# HKC Attendance

## Objetivo

Desarrollar una aplicación móvil multiplataforma para el registro de asistencia de trabajadores en proyectos de construcción, con funcionamiento offline y sincronización diferida.

---

## Principios de diseño

- Offline First.
- Arquitectura por capas.
- Componentes reutilizables.
- Sincronización eventual.
- Evidencia fotográfica.
- Geolocalización.
- Escalabilidad para reconocimiento facial.
- IDs siempre UUID (`utils/uuid.ts` → `generateId()`, implementado con `expo-crypto`'s
  `randomUUID()` — no con el paquete `uuid` de npm, que requiere un polyfill global de
  `crypto.getRandomValues` frágil de mantener en Hermes), nunca autoincrementales.
- Sin soluciones rápidas que hipotequen la arquitectura: cuando hay una mejor decisión, se
  implementa desde ahora aunque tome más tiempo (p. ej. migraciones versionadas en vez de
  `CREATE TABLE IF NOT EXISTS` sueltos).

---

## Tecnologías

- React Native
- Expo
- Expo Router
- SQLite (expo-sqlite)
- Expo Camera
- Expo Location
- Expo FileSystem (`/legacy`, por compatibilidad con SDK 56)
- TypeScript
- Zustand (estado global, desde Sprint 2)

---

## Capas del proyecto

- `domain/` — entidades, enums, value objects e interfaces de repositorio. No depende de
  nada fuera de sí misma (ni de React Native, ni de SQLite).
- `application/` — casos de uso (`useCases/`) y DTOs. Orquestan el dominio; dependen de
  interfaces de `domain/`, nunca de implementaciones concretas.
- `infrastructure/` — implementaciones concretas de los repositorios (SQLite por ahora,
  eventualmente API REST para sincronización).
- `app/` (UI, expo-router) — nunca accede a SQLite directamente. Siempre pasa por un Use
  Case, típicamente a través de un store de Zustand.

---

## Base de datos (SQLite)

### Migraciones versionadas

`src/database/migrations/` contiene una migración por archivo (`001_create_trabajadores.ts`,
`002_create_proyectos.ts`, …), cada una con la forma:

```ts
{ version: number; name: string; up: (db: SQLiteDatabase) => Promise<void> }
```

`src/database/migrationRunner.ts` mantiene una tabla `schema_migrations` (versión, nombre,
fecha) y en cada arranque aplica **solo** las migraciones cuya versión todavía no está ahí,
en orden, cada una dentro de su propia transacción. Así cada migración corre exactamente
una vez por instalación, sin importar cuántas veces se abra la app ni en qué orden se
agreguen features nuevas.

**Regla para agregar una migración nueva:** crear `NNN_descripcion.ts` con el siguiente
número de versión consecutivo, agregarla al arreglo en `migrations/index.ts`, y nunca
modificar una migración ya publicada — si el esquema cambió, se agrega una migración nueva.

### Seeds

`src/database/seeds/` sigue el mismo patrón: un archivo por entidad
(`seedTrabajadores.ts`, `seedProyectos.ts`) más un `index.ts` (`runSeeds`) que los corre
todos. Cada seed es idempotente (revisa `COUNT(*)` antes de insertar), pensado solo para
desarrollo — cuando exista un CRUD real de trabajadores/proyectos (Sprint 3), estos seeds
deberían dejar de correr en builds de producción.

### Arranque de la app

`src/hooks/use-database-ready.ts` corre `runMigrations()` y luego `runSeeds()` una vez,
antes de montar la navegación. `src/app/_layout.tsx` muestra una pantalla de carga
mientras tanto (`DatabaseBootScreen`) y solo renderiza el `<Stack>` de expo-router cuando
la base de datos está lista. Esto evita que una pantalla intente leer una tabla que
todavía no existe.

### Nota sobre archivos "legacy" (`migrations.ts`, `seeds.ts`)

Antes de este cambio existían `src/database/migrations.ts` y `src/database/seeds.ts`
como archivos sueltos (no versionados). El entorno donde se hizo esta migración no
permite borrar archivos, así que **no se pudieron eliminar**; en su lugar quedaron como
shims marcados `@deprecated` que re-exportan desde la nueva ubicación. Importante: como
esos archivos comparten nombre con las carpetas nuevas (`migrations.ts` vs `migrations/`,
`seeds.ts` vs `seeds/`), cualquier import con el specifier corto (`from "./migrations"`,
`from "./seeds"`) resuelve al archivo viejo, no a la carpeta. Por eso el código nuevo
siempre importa explícitamente `from "./migrations/index"` / `from "./seeds/index"`.
**Pendiente:** en un entorno donde sí se puedan borrar archivos, eliminar `migrations.ts`
y `seeds.ts`, y volver a usar el specifier corto normalmente.

---

## Módulo de Proyectos (Sprint 2)

Primer módulo completo end-to-end siguiendo el patrón de capas:

- `domain/entities/Proyecto.ts` — ya existía (`id`, `nombre`, `activo`).
- `domain/repositories/IProyectoRepository.ts` — `obtenerTodos()` / `obtenerActivos()`.
- `infrastructure/repositories/SQLiteProyectoRepository.ts` — implementación con
  `expo-sqlite`, mapea `activo` (INTEGER 0/1) a `boolean`.
- `application/useCases/ObtenerProyectosUseCase.ts` — devuelve solo los proyectos
  activos; es lo único que la UI debe llamar (indirectamente, vía el store).
- `store/proyectoStore.ts` (Zustand) — estado global `proyectos`, `proyectoSeleccionado`,
  `cargando`, `error`, y las acciones `cargarProyectos()` / `seleccionarProyecto()`.
  Vive solo en memoria por ahora (no persiste entre reinicios de la app); si se necesita
  que el dispositivo "recuerde" el proyecto entre reinicios, agregar el middleware
  `persist` de Zustand con un adapter async, no reinventar esa lógica a mano.

## Módulo de Trabajadores (Sprint 2)

Mismo patrón que Proyectos:

- `domain/entities/Trabajador.ts` — ya existía (`id`, `numeroEmpleado`, `nombre`,
  `apellidoPaterno`, `apellidoMaterno`, `activo`, getter `nombreCompleto`).
- `domain/repositories/ITrabajadorRepository.ts` — `obtenerTodos()` / `obtenerActivos()` /
  `buscarPorNumeroEmpleado()` (esta última pensada para una futura identificación manual
  por número de empleado, antes de que exista reconocimiento facial).
- `infrastructure/repositories/SQLiteTrabajadorRepository.ts` — implementación con
  `expo-sqlite` sobre la tabla `trabajadores` (ya creada por la migración 001).
- `application/useCases/ObtenerTrabajadoresUseCase.ts` — devuelve solo los trabajadores
  activos.
- `store/trabajadorStore.ts` (Zustand) — `trabajadores`, `cargando`, `error`,
  `cargarTrabajadores()`. Por ahora es solo lectura; no hay CRUD de trabajadores en la UI
  todavía (pendiente Sprint 3).

Los archivos del patrón anterior (`repositories/trabajadorRepository.ts`,
`services/trabajadorServide.ts`, `types/trabajador.ts`) quedaron marcados `@deprecated`
(no se pudieron eliminar en este entorno; se confirmó que nada más los importa).

## Módulo de Asistencias (Sprint 2)

- Migración `003_create_asistencias.ts` — tabla `asistencias` con `trabajador_id` y
  `proyecto_id` como llaves foráneas (`db.ts` activa `PRAGMA foreign_keys = ON` por
  conexión, ya que SQLite no las aplica por defecto), más índices por
  `(trabajador_id, fecha_hora)` y `(proyecto_id, fecha_hora)` pensando en el historial.
- `domain/entities/Asistencia.ts` — se tipó `tipoRegistro` como el enum `TipoRegistro`
  (antes era `string` suelto) y `latitud`/`longitud` como `number | null` (el GPS real
  todavía no existe, ver más abajo).
- `infrastructure/repositories/SQLiteAsistenciaRepository.ts` — `guardar()` inserta el
  registro; mapea el booleano `sincronizado` del dominio al enum `EstadoSincronizacion`
  (0/1) que se guarda en la columna.
- `application/useCases/RegistrarAsistenciaUseCase.ts` — persiste (antes solo hacía
  `console.log`): genera `id` (`generateId()`) y `fechaHora`, arma la entidad y llama al
  repositorio.
- `IAsistenciaRepository.obtenerPorProyecto(proyectoId?, limite?)` — lado de lectura,
  devuelve `Asistencia[]` planas (sin nombres de trabajador/proyecto). Deliberadamente
  **no** hace el join en SQL ni devuelve un DTO: el repositorio de dominio solo conoce
  la entidad `Asistencia`, para no acoplarse a la forma que necesita una pantalla en
  particular.
- `application/dto/HistorialAsistenciaDTO.ts` + `application/useCases/ObtenerHistorialUseCase.ts`
  — el use case sí conoce `IAsistenciaRepository`, `ITrabajadorRepository` e
  `IProyectoRepository`, trae las tres listas (trabajadores/proyectos son tablas
  pequeñas y locales) y arma el join en memoria, devolviendo el DTO ya listo para
  mostrar (nombre de trabajador, nombre de proyecto, etc.). Si un `trabajador_id` o
  `proyecto_id` no se encuentra, se degrada a "desconocido" en vez de fallar.
- `utils/tipoRegistro.ts` — `mapMovementLabelToTipoRegistro` (UI → dominio) y su inverso
  `mapTipoRegistroToLabel` (dominio → UI), para traducir entre las etiquetas en español
  que usa la UI (`MOVEMENT_TYPES` de `lib/mock-data.ts`) y el enum `TipoRegistro`.

### Geolocalización

`infrastructure/location/locationService.ts` — `obtenerUbicacionActual()` con
`expo-location`. Nunca lanza: si el permiso se niega, el GPS está apagado o falla por
cualquier razón, devuelve `null` en vez de propagar el error, porque la app es
offline-first y el registro de asistencia **no debe bloquearse** por falta de GPS
(`Asistencia.latitud`/`longitud` son `number | null` justamente por esto).

### Cámara y almacenamiento de archivos

Reorganizados para seguir la estructura de capas objetivo:

- `infrastructure/storage/fileService.ts` — `ensurePhotosDirectory()` (antes en
  `services/fileService.ts`).
- `infrastructure/camera/cameraService.ts` — `savePhoto()` (antes en
  `services/cameraService.ts`), copia la foto temporal de `expo-camera` al directorio
  permanente vía `infrastructure/storage`.
- `src/services/cameraService.ts` y `src/services/fileService.ts` quedaron como shims
  `@deprecated` (mismo motivo que `migrations.ts`/`seeds.ts`: el entorno no permite
  borrar archivos).
- `components/CameraCapture.tsx` — componente reutilizable de captura (permisos, visor,
  botón de captura/repetir). No conoce trabajadores/asistencias/proyectos, solo expone
  `onCaptured(photo)`; así lo puede usar cualquier pantalla que necesite tomar una foto
  sin duplicar lógica de cámara.

### Estado de un registro en curso: `store/registroAsistenciaStore.ts`

El flujo de Campo son 4 pantallas separadas (`asistencia/index` → `asistencia/capturar`
→ `asistencia/confirmar` → `asistencia/exito`), cada una un componente de ruta distinto
en expo-router. Pasar el trabajador identificado, la foto y la ubicación GPS entre ellas
por query params sería frágil y perdería tipado, así que viven en un store de Zustand
dedicado (`trabajadorSeleccionado`, `fotoUri`, `ubicacion`) con una acción `registrar()`
que llama a `RegistrarAsistenciaUseCase` y una `limpiar()` que se llama al cancelar o al
volver a la pantalla de espera tras un registro exitoso.

### Flujo real de registro (compartido entre Campo y Kiosco, orden distinto)

Campo y Kiosco recorren las mismas 3 pantallas (identificar, capturar, confirmar) — pero
en **orden distinto**, y comparten la misma lógica de negocio (cámara, GPS, registro en
SQLite) sin duplicarla:

- **Campo**: `asistencia/index.tsx` (identificar trabajador, lista real de
  `trabajadorStore`) → `asistencia/capturar.tsx` (foto) → `asistencia/confirmar.tsx`.
  Se sabe quién es antes de fotografiar (un supervisor opera la tablet).
- **Kiosco**: `asistencia/capturar.tsx` (cámara directo — "reconocimiento facial", sin
  pantalla previa) → `asistencia/index.tsx` (identificar; como todavía no hay
  reconocimiento facial real, aquí se le pide al trabajador confirmar quién es, **después**
  de la foto, no antes) → `asistencia/confirmar.tsx`. Cuando llegue Sprint 5, este paso
  se autocompleta con el resultado del match facial y `asistencia/index.tsx` pasa a ser
  solo el respaldo para cuando el reconocimiento automático falla — no hace falta
  reestructurar el flujo, solo rellenar `trabajadorSeleccionado` automáticamente en vez
  de manualmente.

Ambas pantallas deciden a dónde seguir mirando qué ya existe en el borrador
(`registroAsistenciaStore`): `capturar.tsx` va a `confirmar` si ya hay trabajador
(Campo) o a `index` si no (Kiosco); `index.tsx` va a `confirmar` si ya hay foto (Kiosco)
o a `capturar` si no (Campo). Ninguna de las dos exige un orden fijo por sí misma.

`asistencia/confirmar.tsx` pide GPS real al entrar (best-effort, no bloquea si falla),
muestra trabajador/foto/proyecto reales y el selector de tipo de movimiento;
"Confirmar" llama a `registroAsistenciaStore.registrar()` (persiste en SQLite vía
`RegistrarAsistenciaUseCase`). El destino tras confirmar/cancelar depende de
`attendance-context.operationMode` (`/asistencia/exito` + `/proyecto` para Campo,
`/kiosco/exito` + `/kiosco` para Kiosco) — por eso `mode-select.tsx` ahora sí llama
`setOperationMode()` al elegir un modo, algo que antes no hacía. La pantalla de éxito
correspondiente (mismos datos reales, estilo visual de cada modo) limpia el borrador al
volver (botón o auto-cierre) y regresa a la pantalla de espera de su modo.

### Kiosco vs. Campo: conectividad y proyecto asignado

Kiosco es un dispositivo fijo que se asume **conectado a internet todo el tiempo**;
Campo es una tablet que se mueve entre obras y debe tolerar estar sin conexión. Hoy
(antes de que exista sincronización real, Sprint 4) esto no cambia cómo se guarda una
asistencia — ambos modos escriben igual en SQLite local — pero sí ya determina cómo cada
modo obtiene su proyecto:

- **Campo**: pide el proyecto explícitamente cada vez (`proyecto/seleccionar.tsx`, sin
  parámetro `next`) porque la tablet cambia de obra seguido.
- **Kiosco**: el proyecto es una propiedad del dispositivo, no algo que se repita en cada
  registro. `kiosco/index.tsx` solo redirige a `proyecto/seleccionar.tsx?next=kiosco` si
  el dispositivo todavía no tiene uno asignado; una vez elegido, `seleccionarProyecto()`
  lo guarda en la tabla `configuracion_dispositivo` (SQLite, migración
  `004_create_configuracion_dispositivo` — ver `infrastructure/storage/deviceConfigStorage.ts`)
  y `cargarProyectos()` lo restaura automáticamente en cada arranque si todavía no hay
  nada seleccionado en memoria. Kiosco no vuelve a preguntarlo entre reinicios.

  **Nota:** la primera versión de esto usaba `zustand/middleware persist` con
  `@react-native-async-storage/async-storage`, pero causó un crash
  (`Native module is null, cannot access legacy storage`) porque ese paquete es un
  módulo nativo nuevo y el dev client instalado en el dispositivo no se había
  reconstruido con él enlazado. Se reemplazó por la tabla SQLite de arriba: SQLite ya es
  una dependencia nativa que funciona en esta app (migraciones, trabajadores, proyectos,
  asistencias), así que no depende de agregar/enlazar ningún módulo nativo nuevo ni de
  reconstruir el dev client.
- Cuando llegue Sprint 4 (sincronización), el supuesto "Kiosco siempre en línea" es lo
  que justificará que sus asistencias puedan sincronizarse de inmediato en vez de quedar
  en cola como las de Campo — ese diseño todavía no está implementado, pero esta
  distinción de conectividad ya queda modelada a nivel de producto.

### Historial local

`historial/index.tsx` usa `store/historialStore.ts` → `ObtenerHistorialUseCase`, filtrado
por el proyecto activo (`proyectoStore.proyectoSeleccionado`). Cada fila muestra foto,
trabajador, hora, tipo de movimiento y un estado "Sincronizado"/"Pendiente" derivado del
booleano `sincronizado` (todavía no hay sincronización real — Sprint 4 — así que hoy
todo queda "Pendiente" hasta que exista esa capa).

---

## UI (expo-router) — flujo de navegación (decisión final)

Las pantallas de `src/app/` se portaron desde un prototipo visual (Figma Make). El
flujo de navegación se conserva tal como está en el prototipo, con dos modos elegidos
explícitamente en `mode-select.tsx`:

- **Modo Kiosco** (dispositivo fijo en un punto de acceso, siempre en línea): `mode-select` →
  `/kiosco` (pantalla de espera). Sin paso de selección de proyecto en cada registro —
  el proyecto es una propiedad del dispositivo, persistida (ver "Kiosco vs. Campo:
  conectividad y proyecto asignado" más abajo); solo se pide una vez, la primera vez que
  el dispositivo no tiene uno asignado. Desde `/kiosco`, "Iniciar reconocimiento" abre la
  cámara directo (`/asistencia/capturar`) — a propósito sin pantalla de selección de
  trabajador antes, para que se sienta como reconocimiento facial; la identificación
  manual se pide después de la foto (ver "Flujo real de registro" más abajo).
- **Modo Campo** (tablet que se mueve entre obras): `mode-select` →
  `/proyecto/seleccionar` (selección obligatoria de proyecto, con datos reales desde
  SQLite vía `proyectoStore`) → al elegir uno, navega directo con `router.replace` a
  `/asistencia` (identificar trabajador — ver "Flujo real de Campo" más abajo para el
  resto del pipeline). Desde ahí, `/proyecto` (el hub de Campo) sigue existiendo
  como pantalla "home" a la que se regresa tras confirmar/registrar, con accesos a
  "Registrar Asistencia" de nuevo, "Cambiar Proyecto" (vuelve a `/proyecto/seleccionar`),
  "Sincronizar" e "Historial local". Si se entra a `/proyecto` sin un proyecto activo en
  el store, redirige automáticamente a `/proyecto/seleccionar`.

El "proyecto seleccionado" ya no vive en datos mock: todas las pantallas de Campo
(`proyecto/index.tsx`, `proyecto/seleccionar.tsx`, `asistencia/index.tsx`,
`asistencia/confirmar.tsx`, `asistencia/exito.tsx`) y `admin.tsx` leen
`proyectoSeleccionado` desde `useProyectoStore()` (Zustand, respaldado por SQLite).
`src/context/attendance-context.tsx` se redujo a lo que sí es estado transitorio de UI:
`movementType` y `operationMode`. `src/lib/mock-data.ts` ya solo contiene lo que
todavía no tiene fuente real: `MOVEMENT_TYPES` y los estilos/etiquetas de estado del
historial (`STATUS_STYLES`/`STATUS_LABELS`) — `PROJECTS`, `HISTORY_RECORDS` y
`MOCK_EMPLOYEE` se retiraron al quedar sin uso (proyectos, historial y trabajadores ya
son datos reales de SQLite).

Como el `Proyecto` de dominio solo tiene `id`/`nombre`/`activo`, las tarjetas y
encabezados que en el prototipo mostraban campos mock (`company`, `location`,
`employees`, `pending`, contadores de sincronización) se simplificaron a mostrar solo
`nombre`, con placeholders (`—`) donde el dato real todavía no existe. Esos campos
volverán cuando se implementen los módulos correspondientes (historial real,
sincronización, geolocalización).

### Nota de compatibilidad: clases de NativeWind a evitar

Las clases `shadow-*`, `opacity-*` / `active:opacity-*`, `animate-*` y el atajo de
opacidad `color/NN` (p. ej. `bg-white/10`) de NativeWind pueden disparar
intermitentemente el error "Couldn't find a navigation context" al navegar con Expo
Router (bug conocido de la capa de CSS-interop de NativeWind). En este proyecto esos
valores se aplican siempre vía `style`, usando `src/constants/palette.ts` y
`src/constants/shadows.ts`, nunca vía className. Ver también
`src/components/attendance/pulse.tsx` para animaciones tipo `animate-ping`/`animate-pulse`
implementadas con `Animated` de React Native en su lugar.

---

## Roadmap

### Sprint 1 — Infraestructura base ✅
- Proyecto Expo, SQLite, cámara, arquitectura inicial.

### Sprint 2 — Proyectos y asistencia ✅
- ✅ Migraciones versionadas + seeds reorganizados.
- ✅ Módulo de Proyectos completo (dominio, infraestructura, use case, Zustand).
- ✅ Flujo de navegación Kiosco/Campo definido y conectado a `proyectoStore` real.
- ✅ Módulo de Trabajadores (dominio, infraestructura, use case, Zustand — solo lectura).
- ✅ Registro de asistencia en SQLite (`RegistrarAsistenciaUseCase` +
  `SQLiteAsistenciaRepository` completos, migración `003_create_asistencias`).
- ✅ Identificación de trabajador — selección manual real desde SQLite
  (`asistencia/index.tsx`); reconocimiento facial automático sigue siendo Sprint 5.
- ✅ Captura real de foto (`asistencia/capturar.tsx` + `CameraCapture` +
  `infrastructure/camera`/`infrastructure/storage`).
- ✅ GPS real (`infrastructure/location/locationService.ts`, best-effort).
- ✅ Historial local con datos reales (`ObtenerHistorialUseCase` + `historialStore`).
- ✅ Modo Kiosco conectado al mismo pipeline real (cámara, GPS, registro en SQLite) que
  Campo, con proyecto de dispositivo persistido en SQLite (`configuracion_dispositivo`).
  La cámara abre directo al tocar "Iniciar reconocimiento" (sin lista de trabajador
  antes); la identificación manual se pide después de la foto, a modo de confirmación.
  Solo queda automatizar ese paso con reconocimiento facial real — eso es Sprint 5.

### Sprint 3 — Administración
- CRUD de trabajadores (migrar de `repositories/trabajadorRepository.ts` al patrón de
  capas), CRUD de proyectos, configuración, exportación, dashboard local.

### Sprint 4 — Sincronización
- API REST, resolución de conflictos, estado de sincronización, reintentos automáticos.

### Sprint 5 — Reconocimiento facial
- Captura de múltiples fotografías por trabajador, generación de embeddings,
  reconocimiento facial offline, modo kiosco completamente automático.

### Sprint 6 — Reportes
- Dashboard para RH, reportes, exportación a Excel/PDF, estadísticas.
