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
    │   ├── gastos/          # Gastos por categoría/Q + imprevistos (modales Gasto/Imprevisto)
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
