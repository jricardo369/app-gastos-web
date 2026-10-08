# App — Control de Gastos del Hogar

App móvil híbrida con **Ionic + Angular (standalone)** para gestionar el presupuesto del hogar por **quincenas (Q1 / Q2)**: ingresos, gastos fijos/manuales, imprevistos, pagos de tarjeta, deudas, deudores y movimientos.

> Estado actual: **MODO LOCAL** (sin backend). Todo se guarda en `localStorage` con prefijo `gastos_`. El código para backend REST (`http://localhost:8080/api/v1`) existe pero está desactivado.

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

**Filas en vez de tablas.** Las tablas de Deudas y Movimientos usaban
`grid-template-columns` con anchos fijos en píxeles: en un teléfono de 360px
sumaban más del ancho disponible y se desbordaban con scroll horizontal.
Ahora cada registro es una fila flexible con el monto a la derecha, que se
acomoda a cualquier ancho sin cortar contenido.

**Orden de lectura en cada pantalla:** total o veredicto → detalle → acciones.

En el dashboard el orden es: selector de periodo, **veredicto**, **saldo
previsto**, **detalle por quincena**, **cuentas pendientes** (cuentas por pagar
y me deben), gastos por categoría e ingresos (cerrada).

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

Pestañas: `Inicio`, `Gastos`, `Deudas`, `Me deben`, `Movs`. Las etiquetas
cortas entran en pantallas angostas; "Cuentas por Pagar" no entraba.

**Secciones que se abren con un clic.** Ingresos arranca oculta. Es la única
sección que es solo de edición: no aporta nada a la lectura del estado
financiero y se usa de vez en cuando, así que no tiene por qué competir por
espacio con las cifras. El encabezado dice "tocar para cargar o editar" para
que se entienda que hay algo adentro. Cuando está abierta, cada quincena
conserva su propio colapso.

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

Ojo con los seeds: los gastos de ejemplo (Gas, Detergentes, Papel baño…) viven
en `seedGastos()` en `budget.service.ts`, pero en cuanto se carga la app se
copian a `localStorage`. Editar el seed **no** cambia lo que ya está guardado;
para eso está la edición en pantalla.

## Estructura

```
src/
├── main.ts                  # bootstrapApplication: IonicRouteStrategy + Router (PreloadAllModules)
├── index.html               # base href, viewport móvil, favicon, fonts
├── global.scss / theme/variables.scss
├── assets/                  # icon/favicon.png, shapes.svg
├── environments/
│   ├── environment.ts       # production: false
│   └── environment.prod.ts  # production: true (fileReplacements en angular.json)
└── app/
    ├── app.component.ts/html/scss  # <ion-app><ion-router-outlet>
    ├── app.routes.ts        # /login (pública) + '' -> tabs (con authGuard) + ** redirect
    ├── tabs/
    │   ├── tabs.page.*      # IonTabs + TabBar (5 tabs + logout)
    │   └── tabs.routes.ts   # hijos: dashboard, gastos, deudas, deudores, movimientos
    ├── pages/
    │   ├── login/           # LoginPage (email demo@hogar.com, validación local mín. 4 chars)
    │   ├── dashboard/       # Resumen quincenal + ingresos (modal IngresoModalComponent)
    │   ├── gastos/          # Gastos por categoría/Q + imprevistos (modales Gasto/Imprevisto, alta y edición)
    │   ├── deudas/          # Pagos TC a meses (modal TcModalComponent)
    │   ├── deudores/        # Quién me debe / a quién debo (modal DeudorSimpleModal)
    │   └── movimientos/     # Compras vs abonos + config corte/pago (modal MovModalComponent)
    ├── core/
    │   ├── guards/auth.guard.ts      # hoy: return true (acceso directo)
    │   ├── models/budget.model.ts    # Quincena, Gasto, Imprevisto, Presupuesto, Deuda, PagoTC, Deudor, Movimiento...
    │   └── services/
    │       ├── storage.service.ts    # wrapper localStorage prefijo gastos_ (+ fallback memoria)
    │       ├── auth.service.ts       # login local o REST, token local-xxx, user$ observable
    │       └── budget.service.ts     # estado + CRUD + seeds + migraciones + resumenQuincena()
    ├── tab1|tab2|tab3/      # páginas de plantilla Ionic (no usadas en tabs.routes)
    └── explore-container/   # componente de plantilla Ionic
```

Config raíz: `angular.json` (output `www/`, budgets 2MB warn/5MB err, lint, test), `ionic.config.json` (`type: angular-standalone` + integración Capacitor), `capacitor.config.ts`, `tsconfig*.json`, `eslint.config.js`, `.browserslistrc`, `.editorconfig`.

## Funcionalidad por página

- **Login** (`pages/login`): formulario email/password. En modo local acepta cualquier email con password ≥ 4. Guarda `gastos_auth_user` + `gastos_auth_token`.
- **Dashboard** (`pages/dashboard`): selector Q1/Q2/TODO, totales de dinero (efectivo/vales/nómina), lista de ingresos por quincena, resumen (previstos, reales, sobrante, pendiente), alta/edición de ingresos por modal.
- **Gastos** (`pages/gastos`): gastos fijos y manuales agrupados por 10 categorías (hogar, escuelas, carro, ejercicio, crédito, la marina, adic., impv., ahorro, ropa), toggle pagado, CRUD + imprevistos con fecha.
- **Deudas** (`pages/deudas`): pagos de tarjeta a meses (fecha compra, monto, mensualidad total/pagadas, montoTotal), marcar pagado, CRUD.
- **Deudores** (`pages/deudores`): dos listas — `deudores` simple (nombre/monto/faltaPago) y `deudoresLista` detallada (fechas, desc, pagos/pagados, estatus).
- **Movimientos** (`pages/movimientos`): libro compras/abonos con fecha, config `movConfig` (fechaCorte 13, fechaPago 6, ppngi 1280).

## Core: modelos y servicios

**Modelos** (`core/models/budget.model.ts`): `Quincena='Q1'|'Q2'`, `FiltroQuincena`, `Categoria`, `Gasto`, `Imprevisto`, `IngresoEntry`, `Dinero`, `Presupuesto {q1,q2}`, `Deuda`, `PagoTC`, `Deudor`, `Movimiento`.

**StorageService**: `get/set/remove` con prefijo `gastos_`, JSON + fallback en memoria fuera del navegador.

**BudgetService** (`useRest=false`):
- Observables: `presupuesto$, gastos$, imprevistos$, pagosTC$, deudas$, deudores$, deudoresLista$, movimientos$, movConfig$, quincenaActual$`.
- Seeds al primer arranque: presupuesto Q1/Q2 ($13,500 nómina + $1,345 vales), ~34 gastos fijos por quincena, 10 pagos TC ejemplo, movimientos ejemplo, 1 deudor ejemplo.
- Migraciones automáticas de formato viejo de `presupuesto` y `pagosTC`.
- Métodos: CRUD completo de ingresos, gastos, imprevistos, pagosTC, deudas, deudores, movimientos + `resumenQuincena(q)` y `breakdownCategoria(q)`.

**AuthService** (`useRest=false`, `restBaseUrl=http://localhost:8080/api/v1`):
- Local: `login()` valida y genera token `local-xxx`. REST (si se activa): `POST /auth/login` → `{ data: { token, usuario } }`.
- Helpers: `isAuthenticated()`, `currentUser()`, `getToken()`, `getUserId()`, `logout()`, `authHeaders()`, `authFetch()`.

**authGuard**: hoy retorna `true` siempre. Para reactivar backend, descomentar la validación con `AuthService` + redirect a `/login` (ver comentarios en el archivo).

## Rutas

```
/login                        -> LoginPage (pública)
/tabs/dashboard               -> DashboardPage (default)
/tabs/gastos                  -> GastosPage
/tabs/deudas                  -> DeudasPage
/tabs/deudores                -> DeudoresPage
/tabs/movimientos             -> MovimientosPage
**                            -> redirect ''
```

`main.ts` usa `withPreloading(PreloadAllModules)` + `withComponentInputBinding()`.

## Datos locales (keys `gastos_*`)

`auth_user, auth_token, presupuesto, gastos, imprevistos, pagosTC, deudas, deudores, deudoresLista, movimientos, movConfig, quincenaActual`. Borrar `localStorage` restaura los seeds.

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

1. Todo funciona sin backend: entra a `/login` con cualquier email y clave de 4+ caracteres (o directo a `/tabs/dashboard` porque el guard está abierto).
2. Los montos seed ($13,500, vales, gastos ejemplo) son datos de prueba en `budget.service.ts` (`DEFAULT_PRESUPUESTO`, `seedGastos()`, `DEFAULT_PAGOS_TC`, `DEFAULT_MOVIMIENTOS`).
3. Para conectar backend real: pon `useRest=true` en `AuthService` y `BudgetService` + ajusta `restBaseUrl`, y reactiva `auth.guard.ts`.
4. `tab1/tab2/tab3` y `explore-container` son plantilla del starter Ionic — se pueden borrar si no se usan.
