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
- SQLite
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
- `application/useCases/RegistrarAsistenciaUseCase.ts` — ahora sí persiste (antes solo
  hacía `console.log`): genera `id` (`generateId()`) y `fechaHora`, arma la entidad y
  llama al repositorio.
- `utils/tipoRegistro.ts` — traduce las etiquetas de movimiento en español que usa la UI
  (`MOVEMENT_TYPES` de `lib/mock-data.ts`) al enum `TipoRegistro` del dominio.

### Estado real vs. pendiente en el flujo de Campo

`asistencia/confirmar.tsx` ya persiste un registro real en SQLite al presionar
"Confirmar", usando `proyectoSeleccionado` (real, del `proyectoStore`) — pero el
reconocimiento facial todavía no existe (Sprint 5), así que **el "trabajador
identificado" es el primer trabajador activo de SQLite** (`trabajadorStore`), no una
identificación real. De la misma forma, `fotoUri` es un placeholder
(`"pending://captura-de-camara-no-integrada"`) y las coordenadas GPS son constantes fijas
en el código: la integración de cámara (`CameraCapture.tsx`/`cameraService.ts`, ya
implementados pero no conectados a ninguna pantalla) y de geolocalización real siguen
pendientes. `asistencia/exito.tsx` muestra el mismo trabajador placeholder por
consistencia. El modo Kiosco no persiste nada todavía (no tiene un proyecto asociado en
este flujo — ver sección de UI más abajo).

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
  `/asistencia` (cámara). Desde ahí, `/proyecto` (el hub de Campo) sigue existiendo
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

## Cámara y archivos

`src/components/CameraCapture.tsx` + `src/services/cameraService.ts` +
`src/services/fileService.ts` ya capturan y guardan fotos localmente con
`expo-file-system/legacy`. Todavía no está integrado en ninguna pantalla de `app/`
(pendiente conectar cuando se implemente la pantalla real de captura).

---

## Roadmap

### Sprint 1 — Infraestructura base ✅
- Proyecto Expo, SQLite, cámara, arquitectura inicial.

### Sprint 2 — Proyectos y asistencia (en curso)
- ✅ Migraciones versionadas + seeds reorganizados.
- ✅ Módulo de Proyectos completo (dominio, infraestructura, use case, Zustand).
- ✅ Flujo de navegación Kiosco/Campo definido y conectado a `proyectoStore` real.
- ✅ Módulo de Trabajadores (dominio, infraestructura, use case, Zustand — solo lectura).
- ✅ Registro de asistencia en SQLite (`RegistrarAsistenciaUseCase` +
  `SQLiteAsistenciaRepository` completos, migración `003_create_asistencias`).
- ⬜ Identificación real de trabajador (reconocimiento facial es Sprint 5; mientras
  tanto se usa un placeholder — ver "Módulo de Asistencias").
- ⬜ Captura real de foto conectada a `asistencia/confirmar.tsx` (servicios ya existen,
  falta integrarlos).
- ⬜ GPS real.
- ⬜ Historial local con datos reales.

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
