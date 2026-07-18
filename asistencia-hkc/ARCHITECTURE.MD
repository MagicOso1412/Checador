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

### Flujo real de Campo (completo)

1. `asistencia/index.tsx` — identificación de trabajador: lista real desde
   `trabajadorStore` (SQLite) con búsqueda por nombre/número de empleado. Selección
   manual porque el reconocimiento facial es Sprint 5; el resto del flujo no debería
   tener que cambiar cuando eso llegue.
2. `asistencia/capturar.tsx` (ruta nueva) — cámara real (`CameraCapture`), guarda la
   foto en `registroAsistenciaStore`.
3. `asistencia/confirmar.tsx` — pide GPS real al entrar (best-effort, no bloquea si
   falla), muestra trabajador/foto/proyecto reales y el selector de tipo de movimiento;
   "Confirmar" llama a `registroAsistenciaStore.registrar()` (persiste en SQLite vía
   `RegistrarAsistenciaUseCase`) y navega a éxito. "Cancelar" limpia el borrador.
4. `asistencia/exito.tsx` — muestra el registro real guardado; al volver (botón o
   auto-cierre) limpia el borrador y regresa a `/proyecto` (pantalla de espera).

El modo Kiosco (`kiosco/*`) sigue siendo una simulación visual (detección aleatoria, sin
persistir nada) — **decisión deliberada, no pendiente por descuido**: el roadmap ya
asigna "Modo kiosco completamente automático" a Sprint 5 (reconocimiento facial), así
que construir aquí una segunda copia manual del flujo de identificación solo para
retirarla en un par de sprints no es buen uso del tiempo. Cuando llegue Sprint 5, Kiosco
reutilizará las mismas piezas (`CameraCapture`, `locationService`,
`RegistrarAsistenciaUseCase`) con detección automática en vez de selección manual.

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

- **Modo Kiosco** (dispositivo fijo en un punto de acceso): `mode-select` →
  `/kiosco` abre la cámara/reconocimiento directamente, sin paso de selección de
  proyecto. El proyecto de un kiosco es una propiedad del dispositivo (se configurará
  en `device-setup` / administración en un sprint futuro), no algo que el usuario
  elija en cada registro.
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
`movementType` y `operationMode`. `src/lib/mock-data.ts` sigue existiendo solo para
`MOCK_EMPLOYEE` y `MOVEMENT_TYPES` (reconocimiento facial y registro de asistencia
reales todavía no están implementados — ver Roadmap).

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
