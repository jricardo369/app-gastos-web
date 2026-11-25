# App — Control de Gastos del Hogar

App móvil híbrida con **Ionic + Angular (standalone)** para gestionar el presupuesto del hogar por **quincenas (Q1 / Q2)**: ingresos, gastos fijos/manuales, imprevistos, pagos de tarjeta, deudas, deudores y movimientos.

> Estado actual: datos locales en `localStorage` (prefijo `gastos_`) + autenticación/respaldo en la API. La app no descarga ni comparte datos: solo sube un snapshot cuando se sincroniza.

## Stack

| Tecnología | Versión | Notas |
|---|---|---|
| Angular | 22.0.1 | Componentes standalone, `@angular/build:application` |
| Ionic Angular | ^9.0.0 | UI móvil, `provideIonicAngular()`, `IonicRouteStrategy` |
| Capacitor | Core 8.5.1 / CLI 8.5.1 | `appId: io.ionic.starter`, `webDir: www` — plugins: App, Haptics, Keyboard, Status-Bar |
| Ionic Angular Toolkit | ^13.0.0 | Schematics página/componente standalone + SCSS |
| RxJS | ~7.8.0 | `BehaviorSubject` para estado reactivo |
| TypeScript | ~6.0.0 | `tsconfig.app.json` / `tsconfig.spec.json` |
| ESLint + angular-eslint | 9 / 22 | `ng lint` sobre `src/**/*.ts,html` |
| Tests | Vitest ^4 + jsdom | `ng test`, setup en `src/test-setup.ts` |
| Fuentes | Google Fonts | Comfortaa + Nunito (en `src/index.html`) |

## Requisitos

- Node.js LTS (20+ recomendado) + npm
- Ionic CLI (opcional): `npm i -g @ionic/cli`
- Para nativo: Android Studio (SDK + `local.properties` no versionado) y/o Xcode en macOS

## Instalación y arranque

```bash
npm install
npm start            # ng serve -> http://localhost:4200
ionic serve          # alternativa con livereload de Ionic
```

## Scripts (`package.json`)

| Comando | Qué hace |
|---|---|
| `npm start` | `ng serve` (dev, config `development`) |
| `npm run build` | `ng build` (prod → `www/`) |
| `npm run watch` | `ng build --watch --configuration development` |
| `npm run test` | `ng test` (Vitest) |
| `npm run lint` | `ng lint` |

## Diseño

Sistema de tokens en `src/global.scss`. Todo el color, el espaciado y los
radios salen de ahí; si una página necesita algo nuevo, primero conviene
preguntarse si aporta información o si es decorativo.

**Color solo para estado.** Tres estados y cada uno con un color:

| Estado | Color | Por qué |
|---|---|---|
| Sobra (no calza) | amarillo | es una diferencia sin cuadrar, ni buena ni mala |
| Falta (no calza) | rojo | el gasto pasó lo que hay |
| Todo en orden | verde | los números cuadran |

"Sobra" no va en verde a propósito: no es que te sobre dinero por tener más,
es que lo gastado no coincide con lo que tenés. Por eso el texto lo dice
explícito ("lo gastado no coincide") y no solo "sobra". El verde queda
reservado para el único caso que sí es una buena noticia: que cuadre.

Aparece en dos lugares, ambos con `todoBien(q)`: el veredicto del periodo
activo arriba y el indicador dentro de cada tarjeta de detalle.

**El aviso de "FALTA DINERO".** La comparación que importa es
`(ingresos − gastadoReal) − dineroTotal`, donde `dineroTotal` es efectivo +
vales + nómina, o sea el dinero que hay sobre la mesa. Sin ese término el
resultado siempre sale positivo y el aviso nunca aparece: con 12,000 gastados
contra 9,000 disponibles, `ingresos − gastadoReal` daba "+1,500 sobra" cuando
en realidad faltaban 7,500.

Aparece en dos lugares: el veredicto del periodo activo (arriba, con las tres
cifras que lo sostienen a la vista) y el indicador por quincena dentro de cada
tarjeta de detalle. Ambas usan `todoBien(q)`, así que no pueden discrepar.

**Dos "sobras" distintas, no confundirlas.** El dashboard muestra las dos
porque contestan preguntas diferentes:

| | Fórmula | Pregunta que responde |
|---|---|---|
| Veredicto (`todoBienGlobal`) | `(ingresos − gastadoReal) − dineroTotal` | ¿el gasto **real** ya pasó lo que tengo? |
| Saldo previsto (`sobranteGlobal`) | `dineroTotal − previstos` | si gasto lo **planeado**, ¿me sobra? |

Son el bloque "Sobra / Falta dinero" y la tarjeta "Saldo previsto". Uno mira
lo ya gastado, el otro lo que se planeó gastar.

La tarjeta "Saldo previsto" es solo el monto, sin desglose, y sigue al
selector de periodo: en "Todo el mes" muestra la suma de Q1+Q2, en una
quincena muestra solo esa. El color marca el estado:

| Estado | Cuándo | Color |
|---|---|---|
| Normal | sobra más del 5% de lo que tenés a mano | sin tinte |
| Cerca de cero | sobra menos del 5%, o es exactamente 0 | amarillo |
| Negativo | no alcanza para lo planeado | rojo |

El umbral es relativo al dinero en mano y no un monto fijo, porque $200 de
holgura es mucho si tenés $2,000 y nada si tenés $50,000.

**Cuatro niveles de texto.** `--text-strong` (títulos y cifras que importan),
`--text-body` (texto normal), `--text-muted` (etiquetas secundarias),
`--text-faint` (hints). La jerarquía sale del tamaño y el peso, no de las
MAYÚSCULAS.

**Las cifras siempre en Nunito con `tabular-nums`.** Comfortaa queda solo para
títulos. Las columnas de dinero alinean y se comparan de un vistazo.

**Filas en vez de tablas.** Las tablas de Cuentas y Movimientos usaban
`grid-template-columns` con anchos fijos en píxeles: en un teléfono de 360px
sumaban más del ancho disponible y se desbordaban con scroll horizontal.
Ahora cada registro es una fila flexible con el monto a la derecha, que se
acomoda a cualquier ancho sin cortar contenido.

**Orden de lectura en cada pantalla:** total o veredicto → detalle → acciones.

En el dashboard el orden es: selector de periodo, **veredicto**, **saldo
previsto**, **detalle por quincena**, **cuentas pendientes** (cuentas por pagar
y me deben) y gastos por categoría.

Cada cifra aparece una sola vez. Hubo una tarjeta "Uso del presupuesto" con el
porcentaje de gasto contra lo previsto, pero el detalle de cada quincena ya
muestra previsto, gastado real, barra y porcentaje, así que la tarjeta solo
repetía lo mismo en dos niveles y se quitó. El mismo criterio se aplicó con
la fila "Disponible", que mostraba un número que el indicador de la quincena
ya daba.

Si al agregar algo hay que preguntarse "esto ya está en otra tarjeta", es
redundante: conviene calcularlo en el lugar donde se lee.

Las cuentas pendientes van después del detalle a propósito: el detalle es el
dinero de la quincena en curso, mientras que cuentas por pagar y me deben son
obligaciones que viven fuera del ciclo quincenal. Si estuvieran arriba
compitían con el veredicto, que es lo que responde "¿cómo voy?".

Pestañas: `Inicio`, `Ingresos`, `Gastos`, `Cuentas`, `Movs`. Dentro de Cuentas,
el selector del header alterna entre `Deudas` y `Me deben`; las etiquetas
cortas entran en pantallas angostas.

**Ingresos en su propia pestaña.** El tab `Ingresos` muestra el total del
periodo y permite cargar, editar y borrar los ingresos de cada quincena. El
dashboard sigue leyendo esos mismos datos para sus cálculos; solo dejó de
mostrar la sección de edición.

Ojo con `[hidden]` en Angular: el `display:none` que el navegador aplica al
atributo es de menor prioridad que cualquier `display` de autor, así que un
`.grid2{display:grid}` lo pisa y el elemento queda visible igual. Por eso
`global.scss` fuerza `[hidden]{display:none!important}`. Si se agrega otra
sección que se oculta con `[hidden]`, esa regla ya está.

**Editar gastos.** Cada fila de "Gastos previstos" abre el modal con
descripción, categoría y monto ya cargados. El mismo modal sirve para alta y
edición, según un `isEdit`, y devuelve `update: true` para que la página llame a
`updateGasto` en vez de `addGasto`. El check de pagado y el botón de borrar
detienen la propagación para que no disparen el modal.

En modo edición el modal recibe aparte los valores originales
(`originalDescripcion`, `originalPrevisto`, `originalCategoriaId`) y muestra:

- bajo cada campo, el valor anterior tachado, solo si ese campo cambió;
- un bloque "Vas a cambiar" con el antes tachado y el después en negrita;
- el botón deshabilitado y con texto "Sin cambios" si no se editó nada.

La comparación ignora espacios sobrantes y no distingue `"80"` de `80`, así que
abrir el modal y guardarlo sin tocar nada no marca cambios.

Antes solo se podía agregar y borrar: `updateGasto` existía en el servicio pero
nadie lo llamaba.

Ojo con los seeds: los gastos de ejemplo viven en `GASTOS_Q1` y `GASTOS_Q2` en
`budget.service.ts`, dos listas independientes, una por quincena. Se editan
cambiando el número dentro del bloque que corresponda. Pero en cuanto se carga
la app se copian a `localStorage`, así que **cambiar el seed no cambia lo que ya
está guardado**; para eso está la edición en pantalla.

Antes había una sola lista que el loop copiaba a las dos quincenas, con lo que
todo gasto era parte de Q1 y de Q2. Además tenía duplicados exactos (Gasolina,
Aseo, Com. fin sem. y Terapeuta aparecían dos veces), que el loop multiplicaba:
cada uno se contabilizaba doble.

## Estructura

```
src/
├── main.ts                  # bootstrapApplication: IonicRouteStrategy + Router (PreloadAllModules)
├── index.html               # base href, viewport móvil, favicon, fonts
├── global.scss / theme/variables.scss
├── assets/                  # icon/favicon.png, shapes.svg
├── environments/
│   ├── environment.ts       # apiUrl: http://localhost:8080/seg-gastos/api/v1
│   └── environment.prod.ts  # apiUrl de producción (fileReplacements en angular.json)
└── app/
    ├── app.component.ts/html/scss  # <ion-app><ion-router-outlet>
    ├── app.routes.ts        # /login, /registro, /sin-membresia + '' -> tabs (con authGuard)
    ├── tabs/
    │   ├── tabs.page.*      # IonTabs + TabBar (5 tabs)
    │   └── tabs.routes.ts   # hijos: dashboard, ingresos, gastos, cuentas, movimientos
    ├── pages/
    │   ├── login/           # LoginPage (usuario/password contra la API)
    │   ├── registro/        # Registro con plan MONTH/YEAR
    │   ├── sin-membresia/   # Acceso bloqueado sin membresía activa
    │   ├── dashboard/       # Resumen quincenal + sync/cierre de periodo
    │   ├── ingresos/        # Ingresos por quincena (alta, edición y borrado)
    │   ├── gastos/          # Gastos por categoría/Q + imprevistos (modales Gasto/Imprevisto, alta y edición)
    │   ├── cuentas/         # Deudas y Me deben en una pantalla (selector en el header)
    │   ├── movimientos/     # Compras vs abonos + config corte/pago (modal MovModalComponent)
    │   └── perfil/          # Usuario, membresía real y sincronización manual
    ├── core/
    │   ├── guards/auth.guard.ts      # exige sesión + membresía activa
    │   ├── models/budget.model.ts    # Quincena, Gasto, Imprevisto, Presupuesto, Deuda, PagoTC, Deudor, Movimiento...
    │   └── services/
    │       ├── storage.service.ts    # wrapper localStorage prefijo gastos_ (+ fallback memoria)
    │       ├── auth.service.ts       # login/registro/me, JWT, membresía, authFetch()
    │       ├── backup.service.ts     # POST /respaldos con snapshot local
    │       └── budget.service.ts     # estado + CRUD + seeds + migraciones + snapshot()
    ├── tab1|tab2|tab3/      # páginas de plantilla Ionic (no usadas en tabs.routes)
    └── explore-container/   # componente de plantilla Ionic
```

Config raíz: `angular.json` (output `www/`, budgets 2MB warn/5MB err, lint, test), `ionic.config.json` (`type: angular-standalone` + integración Capacitor), `capacitor.config.ts`, `tsconfig*.json`, `eslint.config.js`, `.browserslistrc`, `.editorconfig`.

## Funcionalidad por página

- **Login** (`pages/login`): usuario/password reales contra `POST /auth/login`; guarda JWT, usuario y membresía. Si la membresía no está activa, va a `/sin-membresia`.
- **Registro** (`pages/registro`): alta con usuario, nombre, correo, contraseña (6+) y plan mensual/anual.
- **Dashboard** (`pages/dashboard`): selector Q1/Q2/TODO, totales, resumen, saldo previsto, detalle por quincena, cuentas pendientes, gastos por categoría y bolsillo editable; botones de sincronizar y cerrar periodo (ambos suben snapshot).
- **Ingresos** (`pages/ingresos`): selector Q1/Q2/TODO, total del periodo y CRUD de ingresos por quincena. Comparte el estado `presupuesto` con el dashboard, que sigue usándolo para sus cálculos.
- **Gastos** (`pages/gastos`): gastos fijos y manuales agrupados por 10 categorías (hogar, escuelas, carro, ejercicio, crédito, la marina, adic., impv., ahorro, ropa), toggle pagado, CRUD + imprevistos con fecha.
- **Cuentas** (`pages/cuentas`): selector en el header entre **Deudas** (deudas generales y pagos de tarjeta a meses) y **Me deben** (`deudoresLista` con fechas, desc, pagos/pagados y vencimientos). CRUD e historial en ambas vistas.
- **Movimientos** (`pages/movimientos`): libro compras/abonos con fecha, config `movConfig` (fechaCorte 13, fechaPago 6, ppngi 1280).
- **Perfil** (`pages/perfil`): usuario, membresía real, último respaldo y sincronización manual.
- **Sin membresía** (`pages/sin-membresia`): bloquea la app pero conserva los datos locales.

## Core: modelos y servicios

**Modelos** (`core/models/budget.model.ts`): `Quincena`, `FiltroQuincena`, `Categoria`, `Gasto`, `Imprevisto`, `IngresoEntry`, `Dinero`, `Presupuesto`, `Deuda`, `PagoTC`, `Deudor`, `Movimiento`, `BackupSnapshot`, `PeriodosCerrados`.

**StorageService**: `get/set/remove` con prefijo `gastos_`, JSON + fallback en memoria fuera del navegador.

**BudgetService**:
- Observables: `presupuesto$`, `gastos$`, `imprevistos$`, `pagosTC$`, `deudas$`, `deudores$`, `deudoresLista$`, `movimientos$`, `movConfig$`, `quincenaActual$`.
- Seeds al primer arranque: presupuesto Q1/Q2 ($13,500 nómina + $1,345 vales), ~34 gastos fijos por quincena, 10 pagos TC ejemplo, movimientos ejemplo, 1 deudor ejemplo.
- Migraciones automáticas de formato viejo de `presupuesto` y `pagosTC`.
- CRUD completo + `resumenQuincena(q)`, `breakdownCategoria(q)`, `snapshot()` y `marcarPeriodoCerrado(clave)`.

**AuthService**:
- `login()` → `POST /auth/login`; `register()` → `POST /auth/register`; `refreshSession()` → `GET /auth/me`.
- Guarda JWT y membresía; `getToken()`, `currentUser()`, `membresiaActual()`, `tieneMembresia()`, `logout()`, `authFetch()`.
- 401 cierra la sesión; 403 marca membresía inactiva.

**BackupService**: `sincronizar()` arma `{ schemaVersion: 1, payload: JSON.stringify(snapshot()) }` y hace `POST /respaldos`. No descarga datos.

**authGuard**: exige `tieneMembresia()`; redirige a `/login` o `/sin-membresia`. `main.ts` valida la sesión antes de arrancar con `APP_INITIALIZER`.

## Rutas

```
/login                        -> LoginPage (pública)
/registro                     -> RegistroPage (pública)
/sin-membresia                -> SinMembresiaPage (pública, requiere sesión)
/tabs/dashboard               -> DashboardPage (default, con guard)
/tabs/ingresos                -> IngresosPage
/tabs/gastos                  -> GastosPage
/tabs/perfil                  -> PerfilPage
/tabs/cuentas                 -> CuentasPage (selector: ?tab=deudas|deudores)
/tabs/deudas                  -> redirect a /tabs/cuentas?tab=deudas
/tabs/deudores                -> redirect a /tabs/cuentas?tab=deudores
/tabs/movimientos             -> MovimientosPage
**                            -> redirect ''
```

`main.ts` usa `withPreloading(PreloadAllModules)` + `withComponentInputBinding()`.

## Datos locales (keys `gastos_*`)

`auth_user, auth_token, auth_membresia, auth_membresia_activa, presupuesto, gastos, imprevistos, pagosTC, config, deudas, deudores, deudoresLista, movimientos, movConfig, quincenaActual, periodosCerrados, ultimo_respaldo`. Borrar `localStorage` restaura los seeds y cierra la sesión.

## Deploy web (EC2, puerto 80 `/app-gastos/`)

La app se publica como tercer sitio del reverse proxy nginx en
[sitios-deploy-vjtech](https://github.com/jricardo369/sitios-deploy-vjtech):

| Ruta | Servicio | Repo |
|---|---|---|
| `/thunder-team/` | `thunder` | sitio-team-thunder |
| `/vj-tech/` | `vjtech` | landing-page-vjtech |
| `/app-gastos/` | `gastos` | app-gastos-web |

Pieces:

- `Dockerfile`: build en dos stages (`node:22-alpine` → `nginx:1.27-alpine`).
- `nginx.conf`: SPA fallback (`try_files ... /index.html`) + cache por hash.
- `.github/workflows/deploy.yml`: push a `master` → SSH al EC2 → `bash deploy.sh`.

El build usa `--base-href /app-gastos/` para que el router de Angular genere
URLs con el prefijo; el proxy recorta `/app-gastos/` antes de enviar la
petición al contenedor, así que internamente la app se sirve en la raíz.

Secrets requeridos en este repo: `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`,
`EC2_PATH` (= `sitios/sitios-deploy-vjtech` o ruta absoluta).

Build local equivalente al de producción:

```bash
npm run build -- --configuration production --base-href /app-gastos/
```

## Acceso directo en la pantalla de inicio (PWA)

La app se puede instalar como acceso directo desde el cel, sin nada nativo.

- `src/manifest.webmanifest`: nombre, colores, `display: standalone` e iconos.
- `src/assets/icon/`: 9 PNG generados con la paleta de `global.scss`
  (`#0f3a5d`):
  - `icon-192.png`, `icon-512.png`: manifest / Android
  - `icon-maskable-192.png`, `icon-maskable-512.png`: Android recorta hasta un
    20% por lado, el contenido va en la zona segura
  - `apple-touch-icon.png` (180), `-167`, `-152`: iOS, sin transparencia ni
    esquinas redondeadas porque el sistema las aplica
  - `favicon-32.png`, `favicon-16.png`: navegador
- `angular.json`: copia el manifest a la raíz del build (el scope tiene que
  cubrir la app entera, no `assets/`).

`start_url` y `scope` son relativos (`.`) porque el proxy recorta `/app-gastos/`:
resuelven a la raíz del contenedor, no a un subdirectorio inexistente.

Caché: `nginx.conf` excluye `manifest.webmanifest` y `assets/icon/*.png` de la
regla de `immutable` de 1 año, porque esos archivos tienen nombre fijo y no hash.
Si los cachearan, cambiar un ícono o el nombre de la app tardaría hasta un año
en llegar a los teléfonos que ya la visitaron. Los bundles JS/CSS sí van con
hash (`main-XXXX.js`) y ahí sí conviene el cache largo.

Cómo instalarlo:

- **Android / Chrome**: menú ⋮ → "Agregar a la pantalla de inicio".
- **iOS / Safari**: botón compartir → "Agregar a pantalla de inicio".

`display: standalone` quita la barra del navegador, así que la app se ve como
una app nativa. No se agregó service worker, así que la app sigue necesitando
conexión al cargar y no funciona offline.

## Build móvil (Capacitor)

```bash
npm run build
npx cap add android    # una vez (igual ios en macOS)
npx cap add ios
npx cap sync           # copia www/ + plugins
npx cap open android   # / ios
```

`capacitor.config.ts`: `appId io.ionic.starter` (cambiar al real), `appName app`, `webDir www`. Las carpetas `android/` e `ios/` están comentadas en `.gitignore`: versionarlas solo si personalizas código nativo.

## Notas para quien inicia

1. La API debe estar corriendo en `environment.apiUrl` para entrar. Si la membresía no está activa, la app bloquea el acceso pero conserva `localStorage`.
2. Los montos seed ($13,500, vales, gastos ejemplo) son datos de prueba en `budget.service.ts` (`DEFAULT_PRESUPUESTO`, `seedGastos()`, `DEFAULT_PAGOS_TC`, `DEFAULT_MOVIMIENTOS`).
3. Para producción, cambia `apiUrl` en `environment.prod.ts` por la URL real del API (incluye `/seg-gastos/api/v1`).
4. `tab1/tab2/tab3` y `explore-container` son plantilla del starter Ionic — se pueden borrar si no se usan.
