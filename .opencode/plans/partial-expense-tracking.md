# Plan: Seguimiento parcial de gastos (gastado vs previsto)

## Objetivo
Permitir registrar cuánto se ha gastado de un gasto previsto sin crear gastos nuevos ni cambiar el monto previsto. Mostrar "gastado/previsto" en la lista, contar el gastado en los totales y marcar automáticamente como pagado cuando el gastado alcance el previsto. Mantener el checkbox para marcar todo como pagado de golpe.

## Cambios de modelo
- `Gasto.importeReal?: number` ya existe y no se usa. Se reutiliza como "monto gastado hasta ahora". No se requiere migración; los gastos sin el campo se tratan como 0.

## Servicio (BudgetService)
1. `toggleGasto(id)`: si el gastado actual < previsto, poner `importeReal = previsto` (pagado); si ya está pagado, poner `importeReal = 0` (no pagado). Recalcular `pagado = importeReal >= previsto`.
2. `updateGasto(id, patch)`: al aplicar el patch, si incluye `importeReal` o `previsto`, recalcular `pagado = (importeReal || 0) >= (previsto || 0)`.
3. `addGasto(g)`: calcular `pagado` a partir de `importeReal` si viene.
4. `resumenQuincena(q)`: `reales` de gastos = suma de `importeReal || 0` (en lugar de sumar `previsto` solo de los pagados). Los imprevistos siguen sumando solo los pagados.
5. `realesCat(q, catId)`: suma de `importeReal` de los gastos de esa categoría.

## Modal de gasto (GastoModalComponent)
- Agregar input `importeReal` (Gastado $) y `originalImporteReal`.
- Mostrar pista: "Cuánto llevas gastado de este gasto. Al llegar al previsto se marca pagado."
- Incluir `importeReal` en el dismiss (Number o undefined).
- Diff "antes" para importeReal.

## Página de gastos (GastosPage)
- Pasar `importeReal` al modal en edición y guardar el valor devuelto en `addGasto`/`updateGasto`.
- En la fila de la lista mostrar `gastado/previsto` cuando 0 < gastado < previsto; si gastado >= previsto mostrar solo el previsto con estilo pagado (verde + check).

## UI/UX (ui-ux-pro-max)
- Mantener ritmo 4/8dp, objetivos táctiles ≥44pt, contraste ≥4.5:1.
- El campo "Gastado" como input numérico con placeholder 0 y hint no intrusivo.
- En la lista, el monto muestra progreso inline "400 / 700" sin romper el layout; el check sigue siendo el control principal para marcar todo.

## Verificación
- `npm run lint` / `npm run typecheck` si existen.
- Probar manualmente: gasto 700, gastado 400 → falta 300 en "Falta por pagar"; checkbox marca 700 y pagado; desmarcar vuelve a 0.

## Archivos a modificar
- src/app/core/services/budget.service.ts
- src/app/pages/gastos/gastos.page.ts
