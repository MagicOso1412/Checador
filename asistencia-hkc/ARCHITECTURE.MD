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
- `domain/repositories/IProyectoRepository.ts` — `obtenerTodos()` / `obtenerActivos()`
  originalmente (ampliada en Sprint 3 con el CRUD completo, ver "Módulo de
  administración de Proyectos" más abajo).
- `infrastructure/repositories/SQLiteProyectoRepository.ts` — implementación con
  `expo-sqlite`, mapea `activo` (INTEGER 0/1) a `boolean`.
- `application/useCases/ObtenerProyectosUseCase.ts` — devuelve solo los proyectos
  activos; es lo único que la UI debe llamar (indirectamente, vía el store).
- `store/proyectoStore.ts` (Zustand) — estado global `proyectos`, `proyectoSeleccionado`,
  `cargando`, `error`, y las acciones `cargarProyectos()` / `seleccionarProyecto()`. El
  proyecto seleccionado se persiste en SQLite (`configuracion_dispositivo`) para Modo
  Kiosco — ver "Kiosco vs. Campo: conectividad y proyecto asignado" más abajo para el
  detalle completo.

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

### Bug corregido: cancelar durante "Guardando…" dejaba la app en un estado inconsistente

Reportado por el usuario en Modo Kiosco: al confirmar una asistencia, mientras el botón
mostraba "Guardando…", tocar el botón de regresar/cancelar hacía que la app "se quedara
pensando" y había que cerrarla y volver a abrirla.

**Causa real (`app/asistencia/confirmar.tsx`):** `handleConfirmar` llama
`await registrar(...)` (escribe en SQLite) y, cuando termina, hace
`router.push(exitoRoute)`. Pero el botón "Cancelar" (arriba y también en el pie de la
pantalla) no tenía ningún guard contra `registrando` — se podía tocar mientras el guardado
seguía en vuelo. Al tocarlo: `limpiar()` borraba `trabajadorSeleccionado`/`fotoUri` del
store **mientras** el `await registrar(...)` de `handleConfirmar` seguía corriendo, y
`router.replace(homeRoute)` navegaba de vuelta a la espera. Cuando el guardado en vuelo
terminaba (éxito o error), su `router.push(exitoRoute)` se disparaba de todos modos,
empujando la pantalla de éxito/error sobre una navegación que el usuario ya había
abandonado — dejando el router en un estado que no reflejaba ninguna interacción reciente
del usuario.

**Corrección:** en vez de intentar reconciliar el estado después de la carrera, se
eliminó la carrera: mientras `registrando` es `true`, no hay forma de salir de la
pantalla.
- Los dos botones "Cancelar" ahora están `disabled={registrando}` (y `handleCancelar`
  también lo verifica de entrada, por si acaso).
- Se agregó un listener de `BackHandler` (botón/gesto de regreso de Android) que absorbe
  el evento (devuelve `true`) mientras `registrando` es `true`.
- `<Stack.Screen options={{ gestureEnabled: !registrando }} />` bloquea también el gesto
  de "deslizar para regresar" (iOS y Android) durante el guardado.

### Bug corregido: LogBox de warnings de GPS/cámara bloqueando la UI en Kiosco

Segundo reporte del usuario, mismo síntoma ("se muere la app"), en la misma pantalla
(`asistencia/confirmar.tsx`, alcanzada tras identificar al trabajador), esta vez al
tocar "regresar" en un dispositivo Kiosco sin GPS disponible. El mensaje visible era el
`console.warn` de `locationService.ts`: `"no se pudo obtener ubicación"`.

**Causa real:** ese warning no es un bug — es el comportamiento documentado a propósito
("nunca lanza, GPS apagado no debe bloquear el registro"). El problema es que
`console.warn` dispara el overlay de LogBox de React Native en builds de
desarrollo/Expo Go, y como el GPS nunca está disponible en el dispositivo de prueba,
ese overlay aparece **cada vez** que se llega a esta pantalla — interceptando toques y,
en hardware limitado, dejando la UI bloqueada hasta forzar el cierre de la app.

**Corrección:** `app/_layout.tsx` llama `LogBox.ignoreLogs([...])` para los mensajes
puntuales de `locationService.ts` y `cameraService.ts` que ya sabemos esperados y
manejados (no se dejó de usar `console.warn` — sigue siendo útil verlo en la terminal
de Metro; solo se le pidió a LogBox que no dibuje el overlay para estos casos
específicos).

**Nota honesta:** esta corrección resultó necesaria pero no suficiente — el usuario
siguió reportando congelamientos después de aplicarla, en pruebas con un teléfono real
(sin el limitante de "GPS siempre apagado" del entorno anterior). La causa real,
encontrada después, era otra: ver la siguiente sección.

### Navegación del flujo de asistencia: por qué cada paso usa `replace`, no `push`

**El bug real** (dos reportes del usuario, probados ya en un teléfono real): (1) en
Kiosco, después de registrar una asistencia y tocar "regresar", la app se congelaba;
(2) en Campo, después de registrar una asistencia y volver a tocar "Registrar
Asistencia" para la siguiente persona, la pantalla de identificar trabajador no
respondía a ningún toque (ni elegir a alguien, ni "regresar").

**Causa real:** cada paso del wizard de asistencia (`asistencia/capturar.tsx` →
`asistencia/index.tsx` → `asistencia/confirmar.tsx` → pantalla de éxito) usaba
`router.push()` para avanzar. Eso apila una entrada nueva en el histórico de
navegación por cada paso — y como el registro de asistencia es *masivo* (muchas
personas seguidas, cada una recorriendo el wizard completo otra vez), el histórico
crecía sin límite en cada vuelta del loop. Dos consecuencias, una por cada reporte:

1. **Kiosco — pantallas viejas reviviendo con estado ya borrado.** Al terminar un
   registro, la pantalla de éxito hacía `limpiar()` (borra `trabajadorSeleccionado`/
   `fotoUri` del store) y `router.replace()` — pero solo reemplazaba la propia pantalla
   de éxito, dejando todos los pasos anteriores (capturar, identificar, confirmar) del
   intento ya terminado todavía enterrados en el histórico. Si el usuario tocaba
   "regresar" después, `router.back()` resucitaba una de esas pantallas viejas con
   estado ya vacío — por ejemplo, `confirmar.tsx` volvía a pedir GPS desde cero sobre
   una pantalla que el usuario ya había abandonado, dejando la navegación en un estado
   que no correspondía a ninguna acción reciente del usuario.
2. **Campo — rutas duplicadas en el histórico.** Cada vuelta completa del loop volvía
   a apilar un `/asistencia` nuevo encima de uno viejo que seguía ahí abajo sin
   resolver. Con la misma ruta apareciendo más de una vez en el histórico, el
   navegador (React Navigation, debajo de expo-router) se confunde sobre cuál instancia
   tiene el foco real — la pantalla se ve normal, pero los toques no llegan a donde
   deberían.

**Corrección — una regla de navegación para todo el wizard:** cada paso *dentro* del
wizard usa `router.replace()`, nunca `push()`. La única excepción es la entrada al
wizard desde el hub (`kiosco/index.tsx` → `/asistencia/capturar`, o
`proyecto/index.tsx` → `/asistencia`), que sigue siendo `push()` a propósito — así
"regresar" desde el primer paso vuelve al hub. Con esa única entrada por `push` y todo
lo demás por `replace`, el histórico queda garantizado en, como máximo, dos niveles —
`[hub, paso-actual]` — sin importar cuántas vueltas del loop se hayan dado:

```
[kiosco] --push--> [kiosco, capturar] --replace--> [kiosco, identificar]
         --replace--> [kiosco, confirmar] --replace--> [kiosco, éxito]
         --replace--> [kiosco, capturar]  ← siguiente persona, misma profundidad
```

Por la misma razón, `handleCancelar` (en `confirmar.tsx`) y los nuevos enlaces de
"terminar"/"salir a espera" (ver siguiente sección) usan `router.back()` en vez de
`router.replace(hub)` — con el histórico ya acotado a `[hub, paso-actual]`, `back()`
regresa exactamente al hub original sin crear una segunda entrada duplicada de esa
misma ruta (que sería reintroducir el mismo bug).

**Si se agrega un paso nuevo a este wizard en el futuro:** debe usar `replace()` para
avanzar, igual que los demás — usar `push()` ahí reintroduce este bug.

### Registro más rápido para uso masivo (pedido explícito del usuario)

El usuario pidió explícitamente que registrar asistencias seguidas (entrada, comida,
salida, de muchas personas) no requiera tocar un botón para "volver a la cámara" cada
vez — es el caso de uso central de la app. Aprovechando la corrección de navegación de
arriba (que ya deja el loop en un estado predecible), se ajustaron las pantallas de
éxito:

- `kiosco/exito.tsx` — al terminar el conteo (3s), regresa **directo a la cámara**
  (`/asistencia/capturar`), no a la pantalla de espera `/kiosco`. Ya no hace falta
  tocar "Iniciar reconocimiento" por cada persona. Se agregó un enlace secundario
  discreto ("Salir a pantalla de espera") para que el operador pueda terminar el loop
  cuando quiera (fin de turno, etc.) — sin eso, no había forma de volver a `/kiosco`
  sin forzar la navegación.
- `asistencia/exito.tsx` (Campo) — el botón principal pasó de "Nuevo registro" (volvía
  al hub `/proyecto`) a "Registrar siguiente" (va directo a identificar al próximo
  trabajador, `/asistencia`). Se agregó un enlace secundario ("Terminar y volver al
  inicio") para cuando el supervisor ya terminó su ronda de registros.

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

## Módulo de administración de Trabajadores (Sprint 3)

Primer CRUD real de la app (hasta ahora todo era solo lectura + seeds):

- `domain/repositories/ITrabajadorRepository.ts` — se agregaron `crear()`, `actualizar()`,
  `eliminar()` y `buscarPorId()` a los métodos de solo lectura que ya existían.
  `eliminar()` es **baja lógica** (`activo = false`), nunca `DELETE`: un trabajador puede
  tener asistencias históricas (`asistencias.trabajador_id`) que deben conservarse, y
  además la FK (`PRAGMA foreign_keys = ON`) rechazaría el `DELETE` si ya tiene registros.
- `infrastructure/repositories/SQLiteTrabajadorRepository.ts` — implementa los métodos
  nuevos.
- Migración `005_add_unique_numero_empleado.ts` — índice `UNIQUE` sobre
  `trabajadores.numero_empleado` a nivel de base de datos, además de la validación de
  aplicación. La migración 001 original no lo tenía y no se puede modificar, así que se
  agregó como migración nueva (regla del proyecto: nunca tocar una migración publicada).
- Use cases: `CrearTrabajadorUseCase` y `ActualizarTrabajadorUseCase` validan con el
  value object `NumeroEmpleado` y verifican unicidad contra el repositorio antes de
  guardar (la validación de negocio vive aquí, no en la UI ni en el repositorio).
  `EliminarTrabajadorUseCase` (baja lógica), `ObtenerTrabajadorPorIdUseCase` y
  `ListarTodosLosTrabajadoresUseCase` (activos + inactivos, para el admin — distinto de
  `ObtenerTrabajadoresUseCase`, que sigue siendo solo activos para el flujo de
  identificación de asistencia) completan el módulo.
- `store/trabajadoresAdminStore.ts` — store separado de `store/trabajadorStore.ts` a
  propósito: son responsabilidades distintas (uno es "leer activos para identificar a
  alguien en una asistencia", el otro es "CRUD completo para administración") aunque
  ambos lean la misma tabla; mezclarlos en un solo store hubiera acoplado dos pantallas
  sin relación entre sí.
- UI: `app/trabajadores/index.tsx` (lista con búsqueda, estado activo/inactivo, botón
  "+") y `app/trabajadores/form.tsx` (un solo formulario para alta y edición, según si
  la ruta trae `id`; incluye alternar activo/inactivo y dar de baja con confirmación
  nativa `Alert.alert`). Enlazadas desde `admin.tsx` ("Gestionar trabajadores"). Se
  pusieron como rutas de nivel superior (`app/trabajadores/`, no `app/admin/trabajadores/`)
  para no repetir el problema de colisión archivo/carpeta ya documentado con
  `migrations.ts`/`seeds.ts` (`admin.tsx` ya existe como archivo suelto, así que una
  carpeta `admin/` con el mismo nombre sería otra colisión evitable).

## Módulo de administración de Proyectos (Sprint 3)

Mismo patrón que el CRUD de Trabajadores (ver sección anterior), aplicado a `Proyecto`:

- `domain/repositories/IProyectoRepository.ts` — se agregaron `crear()`, `actualizar()`,
  `eliminar()` y `buscarPorId()`/`buscarPorNombre()` a los métodos de solo lectura que ya
  existían desde Sprint 2 (`obtenerTodos()`/`obtenerActivos()`). `eliminar()` es **baja
  lógica** (`activo = false`), nunca `DELETE`, por el mismo motivo que
  `ITrabajadorRepository.eliminar()`: un proyecto puede tener asistencias asociadas
  (`asistencias.proyecto_id`) que deben conservarse, y la FK (`PRAGMA foreign_keys = ON`)
  rechazaría el `DELETE` si ya tiene registros.
- `infrastructure/repositories/SQLiteProyectoRepository.ts` — implementa los métodos
  nuevos.
- Migración `006_add_unique_proyecto_nombre.ts` — índice `UNIQUE` sobre
  `proyectos.nombre` a nivel de base de datos, además de la validación de aplicación
  (mismo motivo que la migración 005 para `numero_empleado`: la migración 002 original no
  lo tenía y no se puede modificar).
- Use cases: `CrearProyectoUseCase` y `ActualizarProyectoUseCase` validan que `nombre` no
  esté vacío y verifican unicidad contra el repositorio antes de guardar. A diferencia de
  Trabajador, Proyecto no tiene un Value Object dedicado (su única regla es "nombre no
  vacío"), así que la validación vive inline en el use case, igual que se validaba
  `nombre`/`apellidoPaterno` en Trabajador antes de introducir `NumeroEmpleado`.
  `EliminarProyectoUseCase` (baja lógica), `ObtenerProyectoPorIdUseCase` y
  `ListarTodosLosProyectosUseCase` (activos + inactivos, para el admin — distinto de
  `ObtenerProyectosUseCase`, que sigue siendo solo activos para la selección de proyecto
  en Campo/Kiosco) completan el módulo.
- `store/proyectosAdminStore.ts` — store separado de `store/proyectoStore.ts` a
  propósito, mismo motivo que `trabajadoresAdminStore` vs. `trabajadorStore`: uno es
  "leer/seleccionar el proyecto activo del dispositivo" (con persistencia en
  `configuracion_dispositivo`), el otro es "CRUD completo para administración".
- UI: `app/proyectos/index.tsx` (lista con búsqueda, estado activo/inactivo, botón "+") y
  `app/proyectos/form.tsx` (un solo formulario para alta y edición, según si la ruta trae
  `id`; incluye alternar activo/inactivo y dar de baja con confirmación nativa
  `Alert.alert`). Enlazadas desde `admin.tsx` ("Gestionar proyectos"). Rutas de nivel
  superior (`app/proyectos/`, plural) para no chocar con la carpeta singular ya existente
  `app/proyecto/` (selección de proyecto activo en Campo/Kiosco) — mismo motivo que
  `trabajadores/` (plural) vs. el flujo de identificación de asistencia.

## Configuración conectada a datos reales (Sprint 3)

`admin.tsx` y `configuracion/index.tsx` mostraban valores de ejemplo escritos a mano
("Dispositivo-07", "v1.0.0", "api.hkc-asistencia.mx", "2.1 GB / 16 GB", "Hoy 14:32") y las
preferencias de `configuracion/index.tsx` vivían en `useState` local, así que se perdían
en cada reinicio de la app. Se resolvió así:

- `infrastructure/device/deviceInfo.ts` — `obtenerNombreDispositivo()` (`expo-device`,
  ya era dependencia del proyecto) y `obtenerVersionApp()` (`expo-constants`, lee
  `expoConfig.version`, la misma fuente que `app.json`). Reemplazan el nombre de
  dispositivo y la versión hardcodeados.
- `infrastructure/camera/cameraService.ts` y `infrastructure/location/locationService.ts`
  — se agregó `verificarPermisoCamara()`/`verificarPermisoUbicacion()`, que **consultan**
  el estado del permiso sin pedirlo (a diferencia de `useCameraPermissions()` de
  `CameraCapture.tsx` y `obtenerUbicacionActual()`, que sí lo solicitan). `admin.tsx` los
  usa para mostrar el estado real de GPS/Cámara en vez de un "Activo ✓" fijo.
- `store/configuracionStore.ts` (Zustand) — persiste en `configuracion_dispositivo`
  (SQLite, mismo mecanismo que `proyectoStore` para el proyecto asignado en Kiosco):
  modo oscuro, idioma, servidor, frecuencia de sync, calidad de imágenes y alertas de
  sync. `configuracion/index.tsx` ahora lee/escribe de este store en vez de `useState`
  local — las preferencias sobreviven un reinicio.
- **Nota sobre honestidad de los datos:** "Servidor" y "Frecuencia de sync" son
  preferencias reales que sí se guardan, pero todavía no tienen efecto porque la
  sincronización (Sprint 4) no existe — la UI lo indica explícitamente ("Conexión (Sprint
  4 — sincronización aún no implementada)"). "Almacenamiento" y "Última sync" en
  `admin.tsx` no tienen todavía una fuente de datos real (no hay API de espacio en disco
  multiplataforma confiable, ni sincronización que registre una fecha), así que se
  muestran como "No disponible"/"Pendiente (Sprint 4)" en vez de inventar un número —
  coherente con el principio del proyecto de no fingir soluciones que no existen.

### Historial local

`historial/index.tsx` usa `store/historialStore.ts` → `ObtenerHistorialUseCase`, filtrado
por el proyecto activo (`proyectoStore.proyectoSeleccionado`). Cada fila muestra foto,
trabajador, hora, tipo de movimiento y un estado "Sincronizado"/"Pendiente" derivado del
booleano `sincronizado` (todavía no hay sincronización real — Sprint 4 — así que hoy
todo queda "Pendiente" hasta que exista esa capa).

### Dashboard local (resumen del historial)

Tira de chips sobre la lista de `historial/index.tsx` (Total, Sincronizados, Pendientes,
y un contador por cada tipo de movimiento) calculada con un `useMemo` a partir de
`registros`, el mismo arreglo que ya carga `historialStore` para la lista — no agrega una
consulta ni un use case nuevo porque es una agregación de UI sobre datos ya en memoria,
no una regla de negocio. Si el volumen de registros locales creciera lo suficiente para
que este cálculo en memoria fuera un problema de rendimiento, ese sería el momento de
mover el conteo a una consulta SQL agregada (`COUNT`/`GROUP BY`) en el repositorio — no
antes, para no adelantar complejidad que hoy no hace falta.

### Exportación de asistencias a CSV

- `application/services/historialCsv.ts` — `generarCsvHistorial()`, función pura que
  transforma `HistorialAsistenciaDTO[]` a texto CSV (RFC 4180, con escape de comillas).
  Vive en `application/` porque opera sobre el DTO de esa capa, no sobre la entidad de
  dominio ni sobre nada de filesystem.
- `application/useCases/ExportarHistorialUseCase.ts` — compone `ObtenerHistorialUseCase`
  (misma fuente que ve la pantalla, join trabajador/proyecto ya resuelto) con
  `generarCsvHistorial()`. Un use case que depende de otro use case es válido aquí: evita
  duplicar la lógica de join, y ambos son orquestación de la capa `application/`.
- `infrastructure/export/exportService.ts` — `guardarCsv()`, con rama por plataforma:
  - Nativo: escribe el archivo en `documentDirectory/exports/` (nueva carpeta, mismo
    patrón que `photos/`; ver `ensureExportsDirectory()` en
    `infrastructure/storage/fileService.ts`) usando `expo-file-system/legacy`, ya
    dependencia funcionando del proyecto.
  - Web: dispara una descarga real de navegador (`Blob` + link temporal), sin
    filesystem — mismo criterio que `cameraService.ts` en web.

  **Decisión explícita: no se usó `expo-sharing`.** Hubiera permitido un share sheet
  nativo (WhatsApp, correo, etc.) en vez de solo guardar el archivo, pero es un módulo
  nativo nuevo — y agregar uno sin poder reconstruir el dev client en este entorno ya
  causó el crash de AsyncStorage documentado en "Kiosco vs. Campo: conectividad y
  proyecto asignado". Se prefirió no repetir ese riesgo: por ahora el CSV solo se guarda
  localmente (nativo) o se descarga (web), y el share sheet queda como mejora futura para
  cuando se pueda reconstruir el dev client con `expo-sharing` enlazado.
- `store/historialStore.ts` — se agregaron `exportando`/`errorExportacion` y la acción
  `exportarCsv(proyectoId?)`, que respeta el mismo filtro de proyecto que ya usa
  `cargarHistorial`. La pantalla (`historial/index.tsx`) muestra el resultado
  (`guardadoEn`) o el error con `Alert.alert`.

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

### Soporte Web

La app usa Expo Router con `bundler: "metro"` para web (no webpack), así que además de
Android/iOS también corre en navegador con `npx expo start --web` / `npx expo export -p web`.

`expo-sqlite` en web usa `wa-sqlite` (SQLite compilado a WebAssembly) en vez del binding
nativo. Esto requiere dos cosas que Metro no trae configuradas por defecto (y sin ellas
falla con `Unable to resolve module ./wa-sqlite/wa-sqlite.wasm`):

- `metro.config.js` agrega `"wasm"` a `resolver.assetExts`, para que Metro sepa
  empaquetar el archivo `.wasm` como asset en vez de intentar parsearlo como JS.
- El servidor de desarrollo de Metro agrega las cabeceras `Cross-Origin-Embedder-Policy:
  credentialless` y `Cross-Origin-Opener-Policy: same-origin` (necesarias para que el
  navegador permita `SharedArrayBuffer`, que `wa-sqlite` usa internamente). Para cuando
  la build de producción se despliegue a un hosting real (fuera de EAS Hosting), esas
  mismas cabeceras hay que configurarlas en el servidor — EAS Hosting ya las toma solas
  desde el plugin `expo-router` en `app.json` (`headers` en su configuración).

Ver el soporte web de `expo-sqlite` como **alpha** (lo marca así la documentación
oficial de Expo): funcional para desarrollo/demo, pero vale la pena probar bien antes de
depender de él en producción.

**Importante — no todos los módulos nativos se comportan igual en web:**
`expo-camera` y `expo-location` sí tienen implementación web (permiso del navegador para
cámara/ubicación), pero con más limitaciones que en nativo (por ejemplo, sin control
fino de cámara frontal/trasera en todos los navegadores).

`expo-file-system/legacy` (`documentDirectory`, `getInfoAsync`, `makeDirectoryAsync`,
`copyAsync`) **no existe en web** — no hay un filesystem real ahí, así que llamarlo
lanza `is not available on web`. `infrastructure/camera/cameraService.ts` lo resuelve
con una rama por plataforma (`Platform.OS === "web"`): en web se salta por completo el
paso de "copiar a almacenamiento permanente", porque no hace falta — en web,
`CameraView.takePictureAsync()` ya devuelve una `data:` URI autocontenida (usa
`canvas.toDataURL()` internamente, ver `expo-camera/src/web/WebCameraUtils.ts`), lista
para usarse directamente como `uri` de un `<Image>`. `infrastructure/storage/fileService.ts`
(`ensurePhotosDirectory`) queda con un guard defensivo que lanza un error explícito si
se llama en web, en vez de fallar con el error críptico de `expo-file-system`.

**Nota:** esto significa que en web las fotos de evidencia solo viven en memoria del
navegador durante esa sesión (no persisten entre recargas de página, a diferencia de
Android/iOS donde sí quedan guardadas en el filesystem del dispositivo) — coherente con
tratar el soporte web como una vía de desarrollo/demo por ahora, no como plataforma de
producción con paridad completa.

---

## Sincronización — cola local (Sprint 4)

No existe todavía un backend real (sin URL de API ni contrato de endpoints definido), así
que Sprint 4 se abordó como: **construir toda la arquitectura cliente de sincronización,
lista para conectar, sin bloquear por la falta de servidor.** Decisión tomada
explícitamente con el usuario en vez de asumirla.

- Migración `007_add_sync_tracking_asistencias.ts` — agrega `intentos_sincronizacion`
  (INTEGER, default 0) y `ultimo_error_sincronizacion` (TEXT, nullable) a `asistencias`
  vía `ALTER TABLE ... ADD COLUMN` (seguro sobre datos existentes). `sincronizado` ya
  existía desde la migración 003.
- `domain/entities/Asistencia.ts` — se agregaron `intentosSincronizacion` y
  `ultimoErrorSincronizacion` como parámetros de constructor **con default**
  (`= 0` / `= null`), para no romper el único call site que crea asistencias nuevas
  (`RegistrarAsistenciaUseCase`, que siempre empieza en 0/null).
- `application/dto/AsistenciaSyncPayload.ts` — payload **denormalizado** (incluye
  `trabajadorNombre`/`numeroEmpleado`/`proyectoNombre`, no solo los ids) para lo que
  viaja al backend. Decisión tomada al diseñar `hkc-backend/` (ver
  `hkc-backend/BACKEND_ARCHITECTURE.md`): así el backend no necesita su propio
  catálogo sincronizado de trabajadores/proyectos solo para mostrarle algo legible a
  RH, y el registro histórico conserva el nombre real de ese momento aunque el
  trabajador se renombre o se dé de baja después. Reemplaza a
  `application/dto/AsistenciaDTO.ts` (ahora `@deprecated`, shim de compatibilidad).
- `application/gateways/ISyncGateway.ts` — puerto hacia un backend externo.
  **Corrección de capa** respecto al diseño original: se creó primero en
  `domain/gateways/`, pero al pasar a depender de `AsistenciaSyncPayload` (un DTO de
  `application/`, no la entidad pura `Asistencia`) quedó mal ubicado — un archivo de
  `domain/` no debe depender de un DTO de una capa superior. Se movió a
  `application/gateways/`, mismo criterio que `application/services/historialCsv.ts`.
  El archivo viejo (`domain/gateways/ISyncGateway.ts`) quedó como shim `@deprecated`
  (no se pudo borrar en este entorno).
- `domain/repositories/IAsistenciaRepository.ts` — se agregaron
  `obtenerPendientesDeSincronizar()` (los `sincronizado = false`, más antiguos primero),
  `marcarComoSincronizado()` (limpia también el último error) y
  `registrarIntentoFallido()` (incrementa el contador, guarda el mensaje). Implementados
  en `SQLiteAsistenciaRepository`.
- `infrastructure/sync/UnconfiguredSyncGateway.ts` — implementación **por defecto** de
  `ISyncGateway`, usada hoy por `store/syncStore.ts`. Siempre falla, con un mensaje claro
  ("No hay un servidor de sincronización configurado todavía") — a propósito: la app no
  debe fingir que algo se sincronizó cuando en realidad no viajó a ningún lado. Gracias a
  esto, toda la cola (conteos, reintentos, pantalla `/sync`) funciona de extremo a
  extremo desde ya, con errores honestos en vez de datos falsos.
- `infrastructure/sync/HttpSyncGateway.ts` — implementación real sobre `fetch`. Recibe
  `baseUrl` y `apiKey` en el constructor y hace `POST ${baseUrl}/api/asistencias` con el
  `AsistenciaSyncPayload`, autenticado (`Authorization: Bearer <apiKey>`, una key por
  dispositivo — ver `hkc-backend/BACKEND_ARCHITECTURE.md`). **Limitación conocida:**
  manda `fotoUri` tal cual (ruta local o `data:` URI), no el archivo — subir la foto en
  sí queda pendiente. **Ya conectado** (ver subsección siguiente), no solo construido.
- `application/useCases/SincronizarAsistenciasUseCase.ts` — procesa la cola
  secuencialmente (no en paralelo, más simple y no satura un backend real cuando exista).
  Depende también de `ITrabajadorRepository`/`IProyectoRepository` (mismo patrón que
  `ObtenerHistorialUseCase`) para armar el `AsistenciaSyncPayload` denormalizado antes
  de enviarlo. Acepta un callback `onProgreso(procesados, total)` para progreso en vivo,
  y un fallo en un registro no detiene a los demás.
- `application/useCases/ObtenerEstadoSincronizacionUseCase.ts` — conteo rápido
  (pendientes / con error) sin correr una sincronización, para mostrar en pantalla.
- `store/syncStore.ts` — reemplaza el mock anterior de `sync.tsx` (una barra de progreso
  con `setInterval` que no tocaba datos reales). Persiste `ultima_sincronizacion` en
  `configuracion_dispositivo` (SQLite, mismo mecanismo que el resto de la app) para que
  sobreviva reinicios. `admin.tsx` ("Última sync") y `sync.tsx` leen de aquí.
- `app/sync.tsx` — reescrita con datos reales: pendientes, con error, última
  sincronización, progreso en vivo durante una corrida, y resultado de la última corrida.

### Conexión con el backend real (URL + API key configurables)

Con `hkc-backend` ya corriendo y probado (primero en local en la máquina del usuario,
luego se desplegará en el Mac mini), se cerró el último hueco de Sprint 4: hasta esta
iteración `syncStore.ts` usaba `UnconfiguredSyncGateway` siempre, sin ninguna forma de
que un dispositivo apuntara a un servidor real desde la UI.

- `store/configuracionStore.ts` — el campo "Servidor" dejó de ser un selector cosmético
  (`Producción`/`Staging`/`Personalizado`, sin efecto real) y pasó a ser dos valores
  reales persistidos: `servidorUrl` y `servidorApiKey` (claves `servidor_url` /
  `servidor_api_key` en `configuracion_dispositivo`, exportadas desde este archivo para
  que `syncStore.ts` las use sin duplicar los nombres de clave).
- `app/configuracion/servidor.tsx` (nueva) — pantalla dedicada para capturar la URL y la
  API key que un admin genera con `npm run crear-dispositivo` en `hkc-backend`. Aparte de
  la lista general de ajustes (no un campo inline) porque una API key necesita más
  espacio y un botón de "Probar conexión" (`infrastructure/sync/verificarConexionServidor.ts`,
  un `GET /health` simple — no vive en `HttpSyncGateway` porque ese gateway solo sabe
  enviar asistencias, no es su responsabilidad chequear salud del servidor).
- `store/syncStore.ts` — ya no arma un único `SincronizarAsistenciasUseCase` con un
  gateway fijo al cargar el módulo. Ahora `construirSyncGateway()` lee `servidor_url`/
  `servidor_api_key` de SQLite **justo antes de cada sincronización** y decide entre
  `HttpSyncGateway` (si ambos están configurados) o `UnconfiguredSyncGateway` (si no) —
  así, cambiar la URL desde `/configuracion/servidor` tiene efecto inmediato en la
  siguiente sincronización, sin reiniciar la app.
- `admin.tsx` y `configuracion/index.tsx` muestran la URL real configurada (o "Sin
  configurar") en vez del valor cosmético anterior.

Con esto, Sprint 4 queda funcionalmente completo de extremo a extremo (falta solo
desplegar `hkc-backend` en el Mac mini en vez de correrlo en local — ver Roadmap).

### Por qué no hay reintentos automáticos todavía

El roadmap original menciona "reintentos automáticos". Se decidió **no** construir un
disparador automático (por ejemplo, reintentar al recuperar conexión) en esta iteración,
por dos motivos: (1) sin un backend real, un reintento automático solo repetiría el mismo
error honesto una y otra vez, sin valor observable; (2) detectar conectividad de forma
confiable requeriría un módulo nativo nuevo (`@react-native-community/netinfo` o
similar) que no es dependencia de este proyecto todavía — agregar un módulo nativo sin
poder reconstruir el dev client en este entorno ya causó el crash de AsyncStorage
documentado más arriba, y no vale la pena repetir ese riesgo por una función que hoy no
tendría nada real que reintentar. El contador `intentos_sincronizacion` y el flag
`ultimo_error_sincronizacion` ya están persistidos y listos para que, cuando exista un
backend real, se agregue ese disparador automático sin tocar el resto de la
arquitectura.

### Nota: `app/offline.tsx`

Pantalla existente con datos de ejemplo ("Registros guardados: 10", "Capacidad restante:
13.9 GB") que no está enlazada desde ninguna navegación activa de la app (no hay ningún
`router.push("/offline")` en el código). Se dejó fuera del alcance de esta iteración por
no ser parte del flujo real; si se decide usarla, debería conectarse a
`ObtenerEstadoSincronizacionUseCase` igual que `/sync`.

### Backend (`hkc-backend/`) y Portal RH (`hkc-rh-portal/`)

Dos proyectos npm separados, hermanos de `asistencia-hkc/` en el mismo repositorio.
Nacen de una conversación explícita con el usuario sobre la visión completa del
sistema: app móvil (Android/iOS, distribución interna) para registrar asistencia +
portal web para RH + un backend corriendo en el Mac mini de la empresa, accesible por
internet, del que sincronizan los teléfonos y del que lee el portal.

- **`hkc-backend/`** — Node.js + TypeScript + Express + SQLite (`better-sqlite3`),
  mismo patrón de migraciones versionadas que el cliente. Expone
  `POST /api/asistencias` (sincronización, API key de dispositivo),
  `POST /api/auth/login` y `GET /api/asistencias(/export.csv)` (lectura para RH, JWT).
  Ver `hkc-backend/BACKEND_ARCHITECTURE.md` para el diseño completo y la guía de
  despliegue en el Mac mini.
- **`hkc-rh-portal/`** — React + Vite, SPA que consume esa API. Login, tabla
  filtrable por fecha (con búsqueda local por nombre/proyecto, ver la nota de
  denormalización) y descarga de CSV. Ver `hkc-rh-portal/PORTAL_ARCHITECTURE.md`.
  Se eligió como proyecto aparte (no como rutas web nuevas dentro de esta app Expo,
  que también compila a web) para no arrastrarle a RH todo el stack de la app móvil
  (cámara, SQLite, Campo/Kiosco) que no necesita.

Pendiente en ambos: desplegar `hkc-backend` de verdad en el Mac mini (bloqueado por
ahora — sin acceso remoto disponible en la última sesión) y apuntar `HttpSyncGateway`
del cliente + `VITE_API_URL` del portal a la URL real una vez que eso pase.

## PIN de administrador del dispositivo (Sprint 3)

Hasta esta iteración, la pantalla `/admin` mostraba la etiqueta "Acceso restringido ·
Admin" sin ningún candado real detrás — cualquiera que tocara el botón "Admin" en
`mode-select.tsx` entraba directo. Se corrigió agregando un PIN local por dispositivo.

**Por qué esto no es lo mismo que el login de RH.** `hkc-rh-portal` tiene
usuario/contraseña + JWT porque protege datos de *toda la empresa*, accedidos
remotamente, con bcrypt del lado del servidor. El PIN de `/admin-pin` protege la
configuración de *un aparato físico* (qué proyecto tiene asignado, altas/bajas de
trabajadores y proyectos, ajustes de sincronización) de que cualquiera que tenga la
tablet en la mano la toque — es un candado de operador, no un sistema de identidad de
personas. Por eso es intencionalmente más simple: un PIN numérico, sin backend, sin
expiración de sesión.

- `infrastructure/security/pinService.ts` — hashea el PIN con SHA-256 (`expo-crypto`,
  ya dependencia del proyecto) más un salt fijo de la app, y lo guarda en
  `configuracion_dispositivo` (clave `admin_pin_hash`) vía el storage SQLite existente,
  no AsyncStorage. Documentado explícitamente como criptografía proporcional a la
  amenaza real (alguien que agarra la tablet), no equivalente al bcrypt del backend —
  no debe reutilizarse para proteger nada más sensible.
- `store/adminPinStore.ts` — Zustand store delgado sobre ese servicio
  (`tienePin`, `verificarEstado()`, `configurar()`, `verificar()`, `cambiar()`). Llama
  directo a infraestructura sin una capa de use cases de por medio, mismo criterio que
  `configuracionStore`: es una responsabilidad de dispositivo, no de dominio de negocio.
- `app/admin-pin.tsx` — pantalla única con tres modos según el estado: si no hay PIN
  configurado pide crear uno (nuevo + confirmar); si ya existe, pide ese PIN; con
  `?modo=cambiar` (botón "Cambiar PIN" dentro de `admin.tsx`) pide el PIN actual más uno
  nuevo. `mode-select.tsx` navega a `/admin-pin` en vez de a `/admin` directamente; el
  propio `admin-pin.tsx` hace `router.replace("/admin")` al validar.
- **Sin recuperación de "olvidé mi PIN".** Es una limitación conocida y aceptada: el
  único recurso hoy es borrar los datos locales de la app (el PIN vive solo en SQLite
  del dispositivo, no hay respaldo en la nube). Si esto se vuelve un problema operativo
  real, la solución futura sería un PIN maestro de soporte generado por el backend, no
  algo que valga la pena construir antes de tener el backend real desplegado.

---

## Reconocimiento facial (Sprint 5)

"Escalabilidad para reconocimiento facial" fue un principio de diseño desde el día 1
(ver arriba), pero requiere módulos nativos (frame processors de cámara + un modelo de
ML corriendo en el dispositivo) que este entorno de desarrollo no puede compilar ni
probar — el mismo tipo de límite que ya causó el crash de AsyncStorage documentado en
otra sección de este archivo, y que bloqueó compilar `better-sqlite3` en `hkc-backend`
por falta de Visual Studio Build Tools. Por eso Sprint 5 se dividió explícitamente en
fases, acordadas con el usuario, para no repetir ese riesgo sin poder verificarlo:

### Fase 1 — Fotos de referencia por trabajador ✅ (sin dependencias nativas nuevas)

Construida y verificada por tipos en este entorno — usa únicamente `expo-camera`, ya
dependencia del proyecto y ya probada (es la misma que usa la captura de evidencia de
asistencia).

- Migración `008_create_fotos_referencia_facial.ts` — tabla nueva, `trabajador_id`
  con `ON DELETE CASCADE` (aunque hoy nada hace `DELETE` real de un trabajador). A
  diferencia de `trabajadores`/`proyectos`, aquí `eliminar()` **sí** es un `DELETE`
  real, no baja lógica: una foto de referencia es material reemplazable, no un
  registro de auditoría con peso histórico — no aplica el mismo motivo que obliga a
  la baja lógica de trabajadores/proyectos (preservar asistencias históricas).
- `domain/entities/FotoReferenciaFacial.ts` y
  `domain/repositories/IFotoReferenciaFacialRepository.ts` — deliberadamente **sin**
  campo de embedding todavía: agregarlo ahora sería un dato que nadie llena, se agrega
  cuando exista un motor real que lo calcule (Fase 3).
- `application/useCases/CapturarFotoReferenciaUseCase.ts` — aplica el límite de
  `MAXIMO_FOTOS_POR_TRABAJADOR` (5) como regla de negocio del use case, no de la UI ni
  del repositorio.
- `store/fotosReferenciaStore.ts` + `app/trabajadores/fotos.tsx` — pantalla de
  galería/captura, reutiliza el componente `CameraCapture` ya existente (el mismo que
  usa la captura de evidencia de asistencia — "componentes reutilizables"). Entra
  desde un botón de cámara en cada fila de `trabajadores/index.tsx`.
- `infrastructure/storage/fileService.ts` — se agregó `eliminarArchivo()` para borrar
  el archivo físico al eliminar una foto (best-effort: si falla, el registro de todos
  modos ya se quitó de la base; un archivo huérfano es una fuga de almacenamiento
  menor, no un bug de datos).
- **Pulido de Fase 1** (segunda iteración, sin agregar dependencias nativas):
  - `components/CameraCapture.tsx` — se agregó un prop opcional `overlay?: ReactNode`,
    dibujado encima del visor (nunca sobre el preview). El componente sigue sin saber
    qué es "un rostro" ni nada de dominio — solo posiciona lo que le pasen. Sirve tanto
    para esta pantalla como para cualquier futura necesidad de guía visual.
  - `app/trabajadores/fotos.tsx` — usa ese `overlay` para dibujar un óvalo guía más un
    texto que rota según cuántas fotos ya existen (`GUIAS_POSE`): "de frente", "gira a
    la izquierda", "gira a la derecha", "busca buena luz", "con lentes/gorra si
    aplica". Es **solo una guía visual para el humano**, no detección real — no hay
    forma honesta de validar "esto es un rostro bien encuadrado" sin el motor de
    reconocimiento real (fases 2-3, todavía sin librería nativa). No se debe confundir
    con detección automática.
  - `infrastructure/camera/cameraService.ts` — se agregó `esArchivoDeFotoValido()`: un
    chequeo de sanidad (el archivo existe y no pesa 0 bytes), no de contenido — cubre
    el caso raro de un glitch de cámara que deja un archivo corrupto/truncado. Se llama
    antes de guardar el registro en `fotos.tsx`; si falla, se ofrece reintentar en vez
    de guardar una foto de referencia inútil.
- **Consentimiento biométrico** (tercera iteración, requisito legal antes de poblar la
  base con datos reales): el rostro es un dato personal sensible bajo la LFPDPPP
  mexicana, así que capturar fotos de referencia ya no es posible sin que el
  trabajador acepte explícitamente un aviso primero.
  - Migración `009_create_consentimientos_biometricos.ts` — una fila por trabajador
    (`trabajador_id` como PK, relación 1 a 1), con `version_texto` y `revocado_en`
    (nullable).
  - `domain/entities/ConsentimientoBiometrico.ts` — exporta
    `VERSION_TEXTO_CONSENTIMIENTO_BIOMETRICO`; el getter `cubreVersionActual` combina
    "no fue revocado" + "corresponde a la versión vigente del texto" en un solo lugar,
    para que ningún caller olvide una de las dos condiciones. Si el texto legal cambia
    de fondo, se sube esa constante y todos los consentimientos viejos dejan de contar
    como vigentes automáticamente — se vuelve a pedir, sin tocar la tabla.
  - `constants/consentimientoBiometrico.ts` — el texto real mostrado en pantalla
    (qué se captura, para qué, dónde vive, que es voluntario y revocable, derechos
    ARCO). **`RESPONSABLE_DATOS` es un placeholder** ("HKC Construcción") — hay que
    confirmar la razón social real y un contacto real de RH antes de usar esto en
    producción; un aviso sin responsable identificable no cumple el Art. 15-16 LFPDPPP.
  - `application/useCases/{Otorgar,Obtener,Revocar}ConsentimientoBiometricoUseCase.ts`
    — `Revocar` implementa el derecho de cancelación: no solo bloquea capturas nuevas,
    también borra las fotos de referencia que ya existían (retorna la lista borrada
    para que el store limpie los archivos físicos, mismo criterio de "el use case no
    toca el filesystem" ya usado en `EliminarFotoReferenciaUseCase`).
  - `store/consentimientoBiometricoStore.ts` — store dedicado (una responsabilidad
    por store, mismo criterio que el resto del proyecto), combinado con
    `fotosReferenciaStore` y `trabajadoresAdminStore` en una sola pantalla.
  - `components/trabajadores/ConsentimientoBiometricoScreen.tsx` — pantalla de
    consentimiento. Deliberadamente **no es una ruta de Expo Router aparte**: vive
    como un estado más dentro de `trabajadores/fotos.tsx` (mismo patrón que
    `mostrandoCamara`), para no agregar otra entrada al historial de navegación —
    mismo espíritu que la nota de `push`/`replace` del wizard de asistencia más abajo:
    entre menos pantallas-ruta intermedias, menos riesgo de un back button raro.
  - `trabajadores/fotos.tsx`: el botón "+" ahora pasa primero por
    `handleAbrirCaptura()`, que revisa `consentimiento?.cubreVersionActual` antes de
    abrir la cámara. Hay también un link discreto "Revocar consentimiento biométrico"
    visible cuando el consentimiento está vigente, con confirmación (`Alert`) porque
    borra las fotos existentes.
  - `trabajadores/form.tsx`: al dar de alta un trabajador **nuevo** (no al editar),
    `handleGuardar` ya no solo hace `router.back()` — navega directo a
    `/trabajadores/fotos?id=<nuevoId>` (con `router.replace`, seguido de `back()`
    en `fotos.tsx` para volver al hub — mismo criterio de navegación del wizard de
    asistencia). Así RH puede dar de alta y capturar fotos de referencia en un solo
    flujo continuo mientras puebla la base, sin tener que volver a buscar al
    trabajador recién creado en la lista.

### Fase 2 — Detección real ✅ (requiere el dev client, no funciona en Expo Go)

Con el dev client ya generado (ver más abajo), se instaló `react-native-vision-camera`
y se implementó `detectarRostro()` de verdad.

- `application/ports/IReconocimientoFacialService.ts` — puerto con dos métodos:
  `detectarRostro()` (fase 2, valida que una foto tenga un rostro) y
  `generarEmbedding()` (fase 3, vector de características para comparar). Vive en
  `application/ports/`, no `domain/`, mismo aprendizaje ya aplicado a `ISyncGateway`:
  habla en términos de `fotoUri: string`, un detalle de infraestructura, no de una
  entidad de dominio pura.
- **Librerías instaladas**: `react-native-vision-camera@5.2.2` +
  `react-native-vision-camera-face-detector@2.0.6` (envuelve Google ML Kit) + sus peer
  dependencies `react-native-nitro-modules@0.36.5` y `react-native-nitro-image@0.15.1`.
  Investigado de nuevo en agosto 2026 porque la librería cambió mucho desde la nota
  anterior (julio 2026): VisionCamera **v5** es una reescritura completa sobre "Nitro
  Modules" (`nitro.margelo.com`), con una API distinta a v4. Dos hallazgos concretos que
  vale la pena dejar escritos para no repetir la investigación:
  - **v5 no trae config plugin de Expo** (a diferencia de v3/v4, que sí tenían uno). Los
    permisos de cámara/micrófono se declaran directo en `app.json`
    (`ios.infoPlist.NSCameraUsageDescription` / `android.permissions`) — en este
    proyecto ya venían cubiertos por el plugin de `expo-camera` (que ya declaraba
    `NSCameraUsageDescription`/`NSMicrophoneUsageDescription`/`CAMERA`/`RECORD_AUDIO`
    por defecto), así que no hizo falta tocar `app.json` para esto.
  - El paquete de detección expone dos formas de usarse: un hook (`useImageFaceDetector`,
    pensado para componentes React) y una **función factory sin React**
    (`createImageFaceDetector()`, en `factory.js` — el hook es solo ese factory
    envuelto en `useMemo`). Se usó la función factory directamente porque
    `IReconocimientoFacialService` es una clase de infraestructura inyectada en use
    cases, no un componente — no tiene sentido forzar un hook ahí. `detectFaces(uri)` es
    síncrona (llamada JSI de Nitro, no una Promise), se envuelve en `async` solo para
    cumplir la firma del puerto.
- `infrastructure/facial/VisionCameraReconocimientoFacialService.ts` — implementación
  real de `detectarRostro()`: `detector.detectFaces(fotoUri).length === 1` — exactamente
  un rostro, no "al menos uno" (una foto de referencia debe ser de una sola persona; 2+
  rostros es tan inválida como 0, no hay forma honesta de saber cuál es el trabajador).
  `generarEmbedding()` sigue delegando a `NoOpReconocimientoFacialService` (fase 3, ver
  abajo). Detector creado una sola vez a nivel de módulo (objeto nativo costoso), mismo
  criterio que `getDatabase()`.
- `trabajadores/fotos.tsx` — `handleCaptured()` ahora llama `detectarRostro()` después
  de `esArchivoDeFotoValido()` y antes de guardar; si no hay exactamente un rostro,
  ofrece reintentar (mismo patrón ya usado para archivo inválido). Si el detector mismo
  lanza un error, no bloquea la captura (perder la foto por un fallo del detector sería
  peor que guardar una foto sin esa validación extra) — se loguea con `console.warn` y
  se deja pasar.
- `infrastructure/facial/NoOpReconocimientoFacialService.ts` — sigue existiendo como
  implementación honesta para `generarEmbedding()`, y documenta las librerías evaluadas
  originalmente para reconocimiento (fase 3, sin cambios: `react-native-fast-tflite` +
  un modelo `.tflite`).
- `application/services/similitudCoseno.ts` — función pura (sin dependencias) que ya se
  puede usar y probar hoy, aunque todavía no exista quien genere embeddings reales.

### Bug corregido: `detectFaces` crasheaba con "Invalid image type" en Android

Después del segundo `eas build` (el que ya incluía `react-native-vision-camera`), el
usuario probó capturar una foto de referencia y **toda** captura fallaba con:

```
[Error: ImageFaceDetector.detectFaces(...): java.lang.IllegalArgumentException:
Invalid image type. Expected string or { uri }
  at ...HybridImageFaceDetector.resolveInputImage(HybridImageFaceDetector.kt:33)
```

**Causa (confirmada leyendo el código Kotlin generado, no adivinada):** el tipo
TypeScript `InputImage = string | number | ImageUri` (un union) se traduce por Nitrogen
(el generador de código de Nitro Modules) a una **sealed class** en Kotlin —
`InputImage.First(String)` / `.Second(Double)` / `.Third(ImageUri)` — no al valor crudo.
Pero el archivo escrito a mano `HybridImageFaceDetector.kt` (parte del paquete, no
generado) validaba el argumento con `input is String` / `input is Map<*, *>`, comparando
contra el valor *sin envolver*. Como lo que realmente llega es el wrapper `InputImage.*`,
ninguna de esas comparaciones podía ser verdadera nunca — la excepción se lanzaba
**siempre**, para cualquier entrada, no solo para el caso del proyecto. No era un error
de cómo se estaba llamando `detectFaces()` desde este código.

Confirmado que es un bug conocido y ya corregido río arriba: [issue #241](https://github.com/luicfrr/react-native-vision-camera-face-detector/issues/241)
del propio repositorio, con [PR #242](https://github.com/luicfrr/react-native-vision-camera-face-detector/pull/242)
ya mergeado a `main` (27 de julio de 2026) — pero **todavía no publicado** en ningún
release estable de npm (la versión instalada, `2.0.6`, es anterior al fix; solo existe
en un prerelease `2.0.7-0` sin publicar como `latest`).

**Solución aplicada:** se parcheó `node_modules` directamente con el mismo diff ya
mergeado upstream (Kotlin y Swift, aunque hoy solo se prueba Android) usando
[`patch-package`](https://www.npmjs.com/package/patch-package) — la forma estándar de
aplicar un fix a una dependencia de terceros sin hacer fork del paquete completo:

- `patches/react-native-vision-camera-face-detector+2.0.6.patch` — el diff real (ver
  `HybridImageFaceDetector.kt`/`.swift`: `resolveInputImage` ahora recibe `InputImage`
  tipado (no `Any?`) y desenvuelve `.First`/`.Third` antes de comparar).
- `package.json` → `"postinstall": "patch-package"` + `patch-package` como
  devDependency: el parche se reaplica automáticamente cada vez que alguien corre
  `npm install`, incluyendo en la máquina del usuario y en el build de `eas build` (que
  corre `npm install` en la nube antes de compilar) — no es un cambio manual que haya
  que repetir.
- **Quitar este parche en el futuro:** cuando `react-native-vision-camera-face-detector`
  publique una versión estable que ya incluya el fix (revisar el
  [issue #241](https://github.com/luicfrr/react-native-vision-camera-face-detector/issues/241)),
  actualizar la dependencia a esa versión y borrar el archivo `.patch` — `patch-package`
  avisa en el `postinstall` si un parche ya no aplica limpio contra una versión nueva.

**Esto es codigo nativo (Kotlin/Swift), no JS/TS — igual que instalar una librería
nativa nueva, requiere otro `eas build` antes de poder probarlo.** El segundo build que
ya corrió el usuario no tiene este parche (el bug lo descubrimos revisando ese resultado).

### Fase 3 — Reconocimiento real (embeddings) — todavía sin implementar

`generarEmbedding()` sigue delegando en `NoOpReconocimientoFacialService`. A diferencia
de la fase 2, aquí no hay un paquete "todo incluido": el patrón usado en proyectos
similares es `react-native-fast-tflite` cargando un modelo `.tflite` tipo
FaceNet/MobileFaceNet para generar un vector de características, comparado por similitud
coseno (ya implementada) contra los embeddings de las fotos de referencia. Falta, en
orden: (1) instalar `react-native-fast-tflite` (mismo flujo de esta sección — otro
`eas build` cuando se haga), (2) elegir y verificar la licencia de un modelo `.tflite`
concreto (muchos modelos "gratis" en internet son solo para uso no comercial — hay que
revisar esto con cuidado antes de empaquetar uno), (3) generar y guardar embeddings para
las fotos de referencia ya capturadas, (4) implementar el matching en el flujo de
Kiosco/Campo. Nada de esto está bloqueado por el entorno de desarrollo — es trabajo de
investigación y código que puede seguir avanzando.

### Dev client — configuración lista, falta que el usuario lo compile

Este entorno puede dejar todo el andamiaje de configuración listo, pero **no puede
generar el dev client en sí**: `eas build` corre en la nube contra la cuenta de Expo
del usuario (requiere `eas login`, credenciales que este entorno nunca debe manejar), y
aunque no lo requiriera, este sandbox no tiene SDK de Android/Xcode para compilar nada
localmente. Lo que sí se dejó listo:

- `expo-dev-client` agregado como dependencia (`~56.0.24`, misma familia de versión que
  el resto del proyecto en SDK 56) y registrado en `app.json` → `plugins`.
- `app.json` → `android.package`: `com.hkcconstruccion.asistencia` — **valor
  provisional**, mismo criterio que `RESPONSABLE_DATOS` en el consentimiento
  biométrico: revísalo antes de publicar la app de verdad en Play Store (ahí sí es
  permanente), pero no bloquea nada para un dev client de uso interno.
- `eas.json` — perfiles `development` (`developmentClient: true`, APK de distribución
  interna, para instalar directo en un teléfono sin pasar por una tienda),
  `preview` y `production` (plantilla estándar, sin usar todavía).
- Verificado sin poder ejecutar el build real: se corrió `npx expo prebuild --platform
  android` sobre una copia temporal del proyecto (nunca sobre el repo real — generar
  las carpetas `android/`/`ios/` de verdad convertiría el proyecto a workflow "bare" de
  forma permanente, y este entorno no puede borrar archivos para deshacerlo si algo
  saliera mal). El prebuild terminó sin errores y el `AndroidManifest.xml` /
  `build.gradle` generados tienen el `applicationId` y los permisos esperados
  (cámara, ubicación, almacenamiento) — buena señal de que `eas build` en la nube, que
  corre ese mismo prebuild, no debería fallar por un error de configuración.

**Lo que falta, y solo lo puede hacer el usuario en su propia máquina:**

```bash
npm install -g eas-cli   # una sola vez
eas login                # con tu cuenta de Expo
cd asistencia-hkc
eas build --profile development --platform android
```

Eso sube el proyecto, compila en la nube (10-20 min típico) y al final da un link para
descargar un `.apk`. Se instala en el teléfono como cualquier APK (permitir "fuentes
desconocidas" si Android lo pide) — reemplaza a Expo Go: a partir de ahí, `npx expo
start` sigue sirviendo para hot reload normal, pero corriendo dentro de este dev client
en vez de Expo Go. **No hace falta repetir el build por cada cambio de código JS/TS —
solo cuando cambia una dependencia nativa nueva.**

**Actualización (mismo día): el usuario ya generó e instaló un primer APK, y luego un
segundo.** El primer build fue *antes* de instalar `react-native-vision-camera` (Fase 2,
sección de arriba) — un dev client solo contiene los módulos nativos que existían al
momento de compilarlo. El segundo build ya incluía vision-camera, y con ese el usuario
pudo probar la app y encontrar el bug de `detectFaces` documentado arriba ("Bug
corregido: `detectFaces` crasheaba..."). Ese bug ya está parchado (`patch-package`), pero
el parche es código nativo Kotlin/Swift — **hace falta un tercer
`eas build --profile development --platform android`** (mismo comando de siempre) para
que el fix llegue al teléfono; el APK que el usuario tiene instalado ahora mismo sigue
teniendo el bug. Después de este tercer build, agregar `react-native-fast-tflite`
(Fase 3) va a pedir un cuarto — pero cualquier ajuste de JS/TS mientras tanto
(incluyendo tocar `VisionCameraReconocimientoFacialService.ts`, `fotos.tsx`, etc.) sí
recarga en caliente sin rebuild.

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

### Sprint 3 — Administración ✅
- ✅ CRUD de trabajadores (alta, edición, baja lógica, índice único de número de
  empleado) — ver "Módulo de administración de Trabajadores" más arriba.
- ✅ CRUD de proyectos (alta, edición, baja lógica, índice único de nombre) — ver
  "Módulo de administración de Proyectos" más arriba.
- ✅ Configuración conectada a datos reales (nombre/versión de dispositivo, estado real
  de permisos de GPS/Cámara, preferencias persistidas en SQLite) — ver "Configuración
  conectada a datos reales" más arriba.
- ✅ Exportación de asistencias a CSV (nativo: guarda en `documentDirectory/exports/`;
  web: descarga de navegador) — ver "Exportación de asistencias a CSV" más arriba.
- ✅ Dashboard local — resumen (total, sincronizados/pendientes, por tipo de movimiento)
  sobre el historial — ver "Dashboard local" más arriba.
- ✅ PIN de administrador del dispositivo — ver "PIN de administrador del dispositivo"
  más arriba.

### Sprint 4 — Sincronización ✅ (funcional de extremo a extremo)
- ✅ Cola de sincronización local completa: dominio (`ISyncGateway`, columnas de
  seguimiento en `asistencias`), infraestructura (`UnconfiguredSyncGateway` +
  `HttpSyncGateway`), use cases (`SincronizarAsistenciasUseCase`,
  `ObtenerEstadoSincronizacionUseCase`), store y pantalla `/sync` reales — ver
  "Sincronización — cola local" más arriba.
- ✅ API REST real: `hkc-backend` construido, probado en local (login RH, sincronización
  de asistencias, lectura desde el portal) y conectable desde la app vía
  `/configuracion/servidor` (URL + API key) — ver "Conexión con el backend real" más
  arriba. Pendiente solo el despliegue en el Mac mini (Roadmap de despliegue, bloqueado
  por acceso remoto — ver `hkc-backend/BACKEND_ARCHITECTURE.md`).
- ⬜ Resolución de conflictos (no aplica hasta que haya un servidor con el que
  conciliar datos).
- ⬜ Reintentos automáticos (disparador por reconexión) — ver "Por qué no hay
  reintentos automáticos todavía" más arriba; requiere backend real + un módulo de
  detección de conectividad que hoy no es dependencia del proyecto.

### Sprint 5 — Reconocimiento facial (Fase 1 ✅, fases 2-3 requieren build nativa)
- ✅ Captura y gestión de múltiples fotografías por trabajador (hasta 5) — ver
  "Reconocimiento facial" más arriba.
- ✅ Consentimiento biométrico obligatorio antes de capturar fotos (LFPDPPP) +
  derecho de revocación (borra las fotos existentes) — ver "Consentimiento
  biométrico" más arriba. Base ya lista para empezar a poblar datos reales de
  trabajadores.
- ✅ Arquitectura lista para el motor real: puerto `IReconocimientoFacialService`,
  `NoOpReconocimientoFacialService` (honesto, mismo criterio que
  `UnconfiguredSyncGateway`), función pura de similitud coseno.
- ✅ Dev client generado e instalado por el usuario en un teléfono real (dos builds:
  primero sin vision-camera, luego con vision-camera).
- ✅ Detección real de rostro (`react-native-vision-camera` +
  `react-native-vision-camera-face-detector`) integrada en la captura de fotos de
  referencia — ver "Fase 2" más arriba.
- ✅ Bug encontrado al probar en el segundo build (`detectFaces` crasheaba siempre en
  Android, bug conocido upstream) — parchado con `patch-package`, ver "Bug corregido"
  más arriba. **Pendiente un tercer `eas build`** para que el fix llegue al teléfono.
- ⬜ Generación de embeddings y reconocimiento automático en modo Kiosco (Fase 3) —
  falta instalar `react-native-fast-tflite` y elegir/verificar la licencia de un modelo
  `.tflite` de embeddings faciales. No bloqueado por el entorno de desarrollo, es el
  siguiente paso natural de investigación + código.

### Sprint 6 — Reportes ✅
- ✅ Dashboard para RH: resumen (total, trabajadores/proyectos únicos, por tipo de
  movimiento) sobre el rango de fechas filtrado — `hkc-rh-portal/src/lib/estadisticas.ts`.
- ✅ Exportación a Excel — `GET /api/asistencias/export.xlsx` en `hkc-backend` +
  botón "Descargar Excel" en el portal, mismo filtro y columnas que el CSV
  existente. Ver `hkc-backend/BACKEND_ARCHITECTURE.md` y
  `hkc-rh-portal/PORTAL_ARCHITECTURE.md`.
- ✅ Formato real del Excel — el usuario pidió que se viera "más bonito"; se
  cambió de `xlsx` (SheetJS) a `exceljs` porque `xlsx` no soporta escribir
  estilos de celda (verificado empíricamente). El `.xlsx` generado ahora tiene
  encabezado en negritas con relleno azul y columnas auto-ajustadas. Ver la nota
  de dependencias en `hkc-backend/BACKEND_ARCHITECTURE.md`.
- ✅ Aviso de resultados truncados — `GET /api/asistencias` devuelve
  `limitado: true` cuando el resultado llega al límite máximo de filas de la
  consulta (500 por defecto, 5000 máximo), y el portal muestra un banner
  pidiendo acotar el rango de fechas. Antes un usuario podía asumir en silencio
  que la lista/resumen/exportación cubrían todo el rango pedido cuando en
  realidad estaban recortados.
- ⬜ Exportación a PDF — deliberadamente fuera de alcance por ahora: no hay un caso
  de uso concreto todavía (CSV/Excel ya cubren "ver o descargar"); se retoma si
  surge un requisito de documento con formato fijo (ej. constancia individual).
- ✅ Verificación end-to-end contra un backend real corriendo — probado por el usuario
  en un teléfono real: login del portal, captura, sincronización y descarga de
  CSV/Excel funcionando de punta a punta contra `hkc-backend` corriendo en local.
