import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { StorageService } from './storage.service';
import { Categoria, Gasto, Imprevisto, Presupuesto, PresupuestoQuincena, IngresoEntry, Dinero, Quincena, FiltroQuincena, PagoTC, Deuda, Deudor, Movimiento, ConfigApp, RangoIngreso, TipoPago, TipoMembresia } from '../models/budget.model';

const CATEGORIAS: Categoria[] = [
  { id: 'hogar', nombre: 'Hogar', color: '#a8a4ff' },
  { id: 'escuelas', nombre: 'Escuelas', color: '#ffe18f' },
  { id: 'carro', nombre: 'Carro', color: '#b8a6e8' },
  { id: 'ejercicio', nombre: 'Ejercicio', color: '#7ec8ff' },
  { id: 'credito', nombre: 'Trj crédito', color: '#8ecae6' },
  { id: 'lamarina', nombre: 'La Marina', color: '#7fdb7f' },
  { id: 'adic', nombre: 'Adic.', color: '#ff9aa2' },
  { id: 'impv', nombre: 'Impv.', color: '#ffb07c' },
  { id: 'ahorro', nombre: 'Ahorro', color: '#a8e6a3' },
  { id: 'ropa', nombre: 'Ropa', color: '#d9a0ff' },
];

const DEFAULT_PRESUPUESTO: Presupuesto = {
  q1: { dinero: { efectivo: 13500, vales: 1345, nomina: 0 }, ingresos: [{ id: 'nomina', concepto: 'Nomina', monto: 13500 }, { id: 'vales', concepto: 'Vales', monto: 1345 }] },
  q2: { dinero: { efectivo: 13500, vales: 1345, nomina: 0 }, ingresos: [{ id: 'nomina', concepto: 'Nomina', monto: 13500 }, { id: 'vales', concepto: 'Vales', monto: 1345 }] },
  men: { dinero: { efectivo: 27000, vales: 1345, nomina: 0 }, ingresos: [{ id: 'nomina', concepto: 'Nomina', monto: 27000 }, { id: 'vales', concepto: 'Vales', monto: 1345 }] },
};

/**
 * Gastos de ejemplo, separados por quincena.
 *
 * Para editarlo: cambiá el numero dentro del bloque de la quincena que
 * corresponda y recargá. Q1 y Q2 son bloques independientes, asi que un
 * gasto puede existir en una y no en la otra.
 *
 * Solo se usa cuando no hay nada en localStorage. En cuanto se guarda algo,
 * la app deja de leer esto y usa los datos del dispositivo.
 *
 * Campos: categoriaId, descripcion, previsto, pagado, tipo.
 * Las categorias validas estan en CATEGORIAS mas abajo.
 */
const GASTOS_Q1: Omit<Gasto, 'id' | 'quincena'>[] = [
  { categoriaId: 'hogar', descripcion: 'Gasolina', previsto: 700, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Gasolina', previsto: 700, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Aseo', previsto: 250, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Aseo', previsto: 250, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Comida P1', previsto: 1600, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Comida P1', previsto: 1600, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Com. fin sem.', previsto: 500, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Com. fin sem.', previsto: 500, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Luz', previsto: 250, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Papel baño', previsto: 70, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Pasta y jabon', previsto: 50, pagado: false, tipo: 'fijo' },
  { categoriaId: 'ahorro', descripcion: 'Ahorro', previsto: 0, pagado: false, tipo: 'fijo' },
  { categoriaId: 'escuelas', descripcion: 'Colegiatura Sofi', previsto: 1233, pagado: false, tipo: 'fijo' },
  { categoriaId: 'escuelas', descripcion: 'Colegiatura Rich', previsto: 1233, pagado: false, tipo: 'fijo' },
  { categoriaId: 'carro', descripcion: 'Seguro carro', previsto: 0, pagado: false, tipo: 'fijo' },
  { categoriaId: 'ejercicio', descripcion: 'Ejercicio JR', previsto: 400, pagado: false, tipo: 'fijo' },
  { categoriaId: 'ejercicio', descripcion: 'Ejercicio Sofi', previsto: 500, pagado: false, tipo: 'fijo' },
  { categoriaId: 'ejercicio', descripcion: 'Ejercicio Richi', previsto: 200, pagado: false, tipo: 'fijo' },
  { categoriaId: 'ejercicio', descripcion: 'Creatina', previsto: 100, pagado: false, tipo: 'fijo' },
  { categoriaId: 'credito', descripcion: 'Pago TC', previsto: 1500, pagado: false, tipo: 'fijo' },
  { categoriaId: 'lamarina', descripcion: 'Pago la Marina', previsto: 0, pagado: false, tipo: 'fijo' },
  { categoriaId: 'adic', descripcion: 'Ale', previsto: 600, pagado: false, tipo: 'fijo' },
  { categoriaId: 'adic', descripcion: 'Pago papá', previsto: 0, pagado: false, tipo: 'fijo' },
  { categoriaId: 'adic', descripcion: 'Alianza', previsto: 0, pagado: false, tipo: 'fijo' },
];

const GASTOS_Q2: Omit<Gasto, 'id' | 'quincena'>[] = [
  { categoriaId: 'hogar', descripcion: 'Gasolina', previsto: 700, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Gasolina', previsto: 700, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Aseo', previsto: 250, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Aseo', previsto: 250, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Comida P1', previsto: 1600, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Comida P1', previsto: 1600, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Com. fin sem.', previsto: 500, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Com. fin sem.', previsto: 500, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Luz', previsto: 250, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Agua', previsto: 180, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Gas', previsto: 100, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Mnt casa', previsto: 600, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Papel baño', previsto: 70, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Detergentes', previsto: 800, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Pasta y jabon', previsto: 50, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Minoxidil y pastilla', previsto: 180, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Comida Gigi', previsto: 200, pagado: false, tipo: 'fijo' },
  { categoriaId: 'ahorro', descripcion: 'Ahorro', previsto: 0, pagado: false, tipo: 'fijo' },
  { categoriaId: 'ejercicio', descripcion: 'Ejercicio Ale', previsto: 450, pagado: false, tipo: 'fijo' },
  { categoriaId: 'ejercicio', descripcion: 'Creatina', previsto: 100, pagado: false, tipo: 'fijo' },
  { categoriaId: 'ejercicio', descripcion: 'Ejercicio Richi', previsto: 200, pagado: false, tipo: 'fijo' },
  { categoriaId: 'credito', descripcion: 'Pago TC', previsto: 2100, pagado: false, tipo: 'fijo' },
  { categoriaId: 'adic', descripcion: 'Ale', previsto: 600, pagado: false, tipo: 'fijo' },
  { categoriaId: 'adic', descripcion: 'Pago papá', previsto: 0, pagado: false, tipo: 'fijo' },
  { categoriaId: 'adic', descripcion: 'Alianza', previsto: 200, pagado: false, tipo: 'fijo' },
];

/** Arma la lista final con id estable por quincena. */
function seedGastos(): Gasto[] {
  const marcar = (items: Omit<Gasto, 'id' | 'quincena'>[], q: Quincena): Gasto[] =>
    items.map((g, i) => ({ ...g, quincena: q, id: `${q}-${i}-${g.descripcion}` }));
  return [...marcar(GASTOS_Q1, 'Q1'), ...marcar(GASTOS_Q2, 'Q2')];
}

/* ==========================================================================
   Gastos de ejemplo por rango de ingreso y por tipo de pago.

   GASTOS_Q1 / GASTOS_Q2 (los de siempre) son del rango 20-40. Los demas se
   armaron con la misma estructura y montos ajustados al rango: lo que cambia
   es el tama�o de cada bolsa, no las categorias.

   - '8-15'  -> la mitad de lo que trae el rango alto
   - '15-20' -> tres cuartos
   - '20-40' -> los juegos originales
   Cada rango existe partido en dos quincenas (Q1/Q2) y como un solo bloque
   mensual (MEN).
   ========================================================================== */

/** Rango 8-15, quincena 1. */
const GASTOS_Q1_8_15: Omit<Gasto, 'id' | 'quincena'>[] = [
  { categoriaId: 'hogar', descripcion: 'Gasolina', previsto: 350, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Gasolina', previsto: 350, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Aseo', previsto: 150, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Comida quincena', previsto: 1800, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Com. fin sem.', previsto: 400, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Luz', previsto: 250, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Papel y jabon', previsto: 90, pagado: false, tipo: 'fijo' },
  { categoriaId: 'ahorro', descripcion: 'Ahorro', previsto: 0, pagado: false, tipo: 'fijo' },
  { categoriaId: 'escuelas', descripcion: 'Colegiatura Sofi', previsto: 900, pagado: false, tipo: 'fijo' },
  { categoriaId: 'ejercicio', descripcion: 'Ejercicio JR', previsto: 300, pagado: false, tipo: 'fijo' },
  { categoriaId: 'credito', descripcion: 'Pago TC', previsto: 900, pagado: false, tipo: 'fijo' },
  { categoriaId: 'adic', descripcion: 'Gastos varios', previsto: 500, pagado: false, tipo: 'fijo' },
];

/** Rango 8-15, quincena 2. */
const GASTOS_Q2_8_15: Omit<Gasto, 'id' | 'quincena'>[] = [
  { categoriaId: 'hogar', descripcion: 'Gasolina', previsto: 350, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Aseo', previsto: 150, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Comida quincena', previsto: 1800, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Com. fin sem.', previsto: 400, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Agua', previsto: 180, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Gas', previsto: 100, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Mnt casa', previsto: 400, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Detergentes', previsto: 500, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Papel y jabon', previsto: 90, pagado: false, tipo: 'fijo' },
  { categoriaId: 'ahorro', descripcion: 'Ahorro', previsto: 0, pagado: false, tipo: 'fijo' },
  { categoriaId: 'ejercicio', descripcion: 'Ejercicio Ale', previsto: 300, pagado: false, tipo: 'fijo' },
  { categoriaId: 'credito', descripcion: 'Pago TC', previsto: 1200, pagado: false, tipo: 'fijo' },
  { categoriaId: 'adic', descripcion: 'Gastos varios', previsto: 500, pagado: false, tipo: 'fijo' },
];

/** Rango 15-20, quincena 1. */
const GASTOS_Q1_15_20: Omit<Gasto, 'id' | 'quincena'>[] = [
  { categoriaId: 'hogar', descripcion: 'Gasolina', previsto: 550, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Gasolina', previsto: 550, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Aseo', previsto: 200, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Comida P1', previsto: 1600, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Com. fin sem.', previsto: 500, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Luz', previsto: 250, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Papel y jabon', previsto: 120, pagado: false, tipo: 'fijo' },
  { categoriaId: 'ahorro', descripcion: 'Ahorro', previsto: 0, pagado: false, tipo: 'fijo' },
  { categoriaId: 'escuelas', descripcion: 'Colegiatura Sofi', previsto: 1100, pagado: false, tipo: 'fijo' },
  { categoriaId: 'escuelas', descripcion: 'Colegiatura Rich', previsto: 1100, pagado: false, tipo: 'fijo' },
  { categoriaId: 'ejercicio', descripcion: 'Ejercicio JR', previsto: 400, pagado: false, tipo: 'fijo' },
  { categoriaId: 'credito', descripcion: 'Pago TC', previsto: 1200, pagado: false, tipo: 'fijo' },
  { categoriaId: 'adic', descripcion: 'Gastos varios', previsto: 600, pagado: false, tipo: 'fijo' },
];

/** Rango 15-20, quincena 2. */
const GASTOS_Q2_15_20: Omit<Gasto, 'id' | 'quincena'>[] = [
  { categoriaId: 'hogar', descripcion: 'Gasolina', previsto: 550, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Gasolina', previsto: 550, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Aseo', previsto: 200, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Comida P1', previsto: 1600, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Com. fin sem.', previsto: 500, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Agua', previsto: 180, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Gas', previsto: 100, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Mnt casa', previsto: 600, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Detergentes', previsto: 600, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Papel y jabon', previsto: 120, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Minoxidil y pastilla', previsto: 180, pagado: false, tipo: 'fijo' },
  { categoriaId: 'ahorro', descripcion: 'Ahorro', previsto: 0, pagado: false, tipo: 'fijo' },
  { categoriaId: 'ejercicio', descripcion: 'Ejercicio Ale', previsto: 450, pagado: false, tipo: 'fijo' },
  { categoriaId: 'credito', descripcion: 'Pago TC', previsto: 1600, pagado: false, tipo: 'fijo' },
  { categoriaId: 'adic', descripcion: 'Gastos varios', previsto: 600, pagado: false, tipo: 'fijo' },
];

/** Mensual 8-15: un solo bloque con lo de las dos quincenas sumado. */
const GASTOS_MEN_8_15: Omit<Gasto, 'id' | 'quincena'>[] = [
  { categoriaId: 'hogar', descripcion: 'Gasolina', previsto: 1200, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Aseo', previsto: 300, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Comida del mes', previsto: 3200, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Com. fin sem.', previsto: 700, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Luz', previsto: 500, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Agua', previsto: 180, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Gas', previsto: 100, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Mnt casa', previsto: 400, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Detergentes', previsto: 400, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Papel y jabon', previsto: 180, pagado: false, tipo: 'fijo' },
  { categoriaId: 'ahorro', descripcion: 'Ahorro', previsto: 0, pagado: false, tipo: 'fijo' },
  { categoriaId: 'escuelas', descripcion: 'Colegiatura Sofi', previsto: 1800, pagado: false, tipo: 'fijo' },
  { categoriaId: 'ejercicio', descripcion: 'Ejercicio', previsto: 500, pagado: false, tipo: 'fijo' },
  { categoriaId: 'credito', descripcion: 'Pago TC', previsto: 1600, pagado: false, tipo: 'fijo' },
  { categoriaId: 'adic', descripcion: 'Gastos varios', previsto: 800, pagado: false, tipo: 'fijo' },
];

/** Mensual 15-20. */
const GASTOS_MEN_15_20: Omit<Gasto, 'id' | 'quincena'>[] = [
  { categoriaId: 'hogar', descripcion: 'Gasolina', previsto: 2000, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Aseo', previsto: 400, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Comida del mes', previsto: 3000, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Com. fin sem.', previsto: 1000, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Luz', previsto: 500, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Agua', previsto: 180, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Gas', previsto: 100, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Mnt casa', previsto: 600, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Detergentes', previsto: 600, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Papel y jabon', previsto: 240, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Minoxidil y pastilla', previsto: 180, pagado: false, tipo: 'fijo' },
  { categoriaId: 'ahorro', descripcion: 'Ahorro', previsto: 0, pagado: false, tipo: 'fijo' },
  { categoriaId: 'escuelas', descripcion: 'Colegiatura Sofi', previsto: 2200, pagado: false, tipo: 'fijo' },
  { categoriaId: 'escuelas', descripcion: 'Colegiatura Rich', previsto: 2200, pagado: false, tipo: 'fijo' },
  { categoriaId: 'ejercicio', descripcion: 'Ejercicio', previsto: 1150, pagado: false, tipo: 'fijo' },
  { categoriaId: 'credito', descripcion: 'Pago TC', previsto: 2400, pagado: false, tipo: 'fijo' },
  { categoriaId: 'adic', descripcion: 'Gastos varios', previsto: 1200, pagado: false, tipo: 'fijo' },
];

/** Mensual 20-40: lo de Q1 y Q2 juntos, sin duplicar lo que solo se paga una vez. */
const GASTOS_MEN_20_40: Omit<Gasto, 'id' | 'quincena'>[] = [
  { categoriaId: 'hogar', descripcion: 'Gasolina', previsto: 2800, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Aseo', previsto: 500, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Comida P1', previsto: 3200, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Com. fin sem.', previsto: 1000, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Luz', previsto: 500, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Agua', previsto: 180, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Gas', previsto: 100, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Mnt casa', previsto: 600, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Papel y jabon', previsto: 200, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Detergentes', previsto: 800, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Minoxidil y pastilla', previsto: 180, pagado: false, tipo: 'fijo' },
  { categoriaId: 'hogar', descripcion: 'Comida Gigi', previsto: 200, pagado: false, tipo: 'fijo' },
  { categoriaId: 'ahorro', descripcion: 'Ahorro', previsto: 0, pagado: false, tipo: 'fijo' },
  { categoriaId: 'escuelas', descripcion: 'Colegiatura Sofi', previsto: 2466, pagado: false, tipo: 'fijo' },
  { categoriaId: 'escuelas', descripcion: 'Colegiatura Rich', previsto: 2466, pagado: false, tipo: 'fijo' },
  { categoriaId: 'ejercicio', descripcion: 'Ejercicio JR', previsto: 400, pagado: false, tipo: 'fijo' },
  { categoriaId: 'ejercicio', descripcion: 'Ejercicio Sofi', previsto: 500, pagado: false, tipo: 'fijo' },
  { categoriaId: 'ejercicio', descripcion: 'Ejercicio Richi', previsto: 400, pagado: false, tipo: 'fijo' },
  { categoriaId: 'credito', descripcion: 'Pago TC', previsto: 3600, pagado: false, tipo: 'fijo' },
  { categoriaId: 'adic', descripcion: 'Gastos varios', previsto: 1200, pagado: false, tipo: 'fijo' },
];

/** Los juegos de cada rango, partidos en dos quincenas. */
const GASTOS_POR_RANGO: Record<RangoIngreso, { q1: Omit<Gasto, 'id' | 'quincena'>[]; q2: Omit<Gasto, 'id' | 'quincena'>[]; men: Omit<Gasto, 'id' | 'quincena'>[] }> = {
  '8-15': { q1: GASTOS_Q1_8_15, q2: GASTOS_Q2_8_15, men: GASTOS_MEN_8_15 },
  '15-20': { q1: GASTOS_Q1_15_20, q2: GASTOS_Q2_15_20, men: GASTOS_MEN_15_20 },
  '20-40': { q1: GASTOS_Q1, q2: GASTOS_Q2, men: GASTOS_MEN_20_40 },
};

/**
 * Lo que entra por quincena (o por mes) en cada rango: sirve para los datos de
 * ejemplo de presupuesto e ingresos.
 */
const INGRESO_POR_RANGO: Record<RangoIngreso, { mes: number; vales: number }> = {
  '8-15': { mes: 12000, vales: 900 },
  '15-20': { mes: 18000, vales: 1200 },
  '20-40': { mes: 27000, vales: 1345 },
};

/** Los gastos de ejemplo que corresponden a la config elegida. */
function seedGastosConfig(cfg: ConfigApp): Gasto[] {
  const marcar = (items: Omit<Gasto, 'id' | 'quincena'>[], q: Quincena): Gasto[] =>
    items.map((g, i) => ({ ...g, quincena: q, id: `${q}-${i}-${g.descripcion}` }));
  const juegos = GASTOS_POR_RANGO[cfg.rango];
  return cfg.tipoPago === 'mensual'
    ? marcar(juegos.men, 'MEN')
    : [...marcar(juegos.q1, 'Q1'), ...marcar(juegos.q2, 'Q2')];
}

/** El presupuesto inicial (efectivo / vales / nomina + ingresos) de la config. */
function seedPresupuesto(cfg: ConfigApp): Presupuesto {
  const { mes, vales } = INGRESO_POR_RANGO[cfg.rango];
  const bloque = (efectivo: number, valesMes: number): PresupuestoQuincena => ({
    dinero: { efectivo, vales: valesMes, nomina: 0 },
    ingresos: [
      { id: 'nomina', concepto: 'Nomina', monto: efectivo },
      { id: 'vales', concepto: 'Vales', monto: valesMes },
    ],
  });
  // El periodo que no se usa queda VACIO de verdad: antes le quedaban los vales.
  const vacio: PresupuestoQuincena = { dinero: { efectivo: 0, vales: 0, nomina: 0 }, ingresos: [] };
  // En mensual, Q1 y Q2 quedan vacios: el dinero vive todo en MEN. Y al reves.
  return cfg.tipoPago === 'mensual'
    ? { q1: vacio, q2: { ...vacio, dinero: { ...vacio.dinero }, ingresos: [] }, men: bloque(mes, vales) }
    : { q1: bloque(Math.round(mes / 2), vales), q2: bloque(Math.round(mes / 2), vales), men: vacio };
}

const DEFAULT_CONFIG: ConfigApp = { rango: '20-40', tipoPago: 'quincenas', membresia: 'mensual' };


const DEFAULT_PAGOS_TC: PagoTC[] = [
  { id: '1', fechaCompra: '2025-11-22', desc: 'TV', monto: 1270, mensualidad: 12, mensualidadPagada: 9, montoTotal: 15240, pagado: false },
  { id: '2', fechaCompra: '2025-11-22', desc: 'SEGURO TV', monto: 239, mensualidad: 12, mensualidadPagada: 9, montoTotal: 2868, pagado: false },
  { id: '3', fechaCompra: '2026-03-04', desc: 'NETFLIX', monto: 119, mensualidad: 1, mensualidadPagada: 0, montoTotal: 119, pagado: false },
  { id: '4', fechaCompra: '2026-03-06', desc: 'MEGACABLE', monto: 619, mensualidad: 1, mensualidadPagada: 0, montoTotal: 619, pagado: false },
  { id: '5', fechaCompra: '2026-03-04', desc: 'DISNEY +', monto: 159, mensualidad: 1, mensualidadPagada: 0, montoTotal: 159, pagado: false },
  { id: '6', fechaCompra: '2026-03-04', desc: 'XBOX GAME-PASS', monto: 220, mensualidad: 1, mensualidadPagada: 0, montoTotal: 219, pagado: false },
  { id: '7', fechaCompra: '2026-03-04', desc: 'GITHUB COPILOT', monto: 185, mensualidad: 1, mensualidadPagada: 0, montoTotal: 185, pagado: false },
  { id: '8', fechaCompra: '2026-03-04', desc: 'NETFLIX MA', monto: 139, mensualidad: 1, mensualidadPagada: 0, montoTotal: 119, pagado: false },
  { id: '9', fechaCompra: '2026-03-30', desc: 'SPOTIFY', monto: 239, mensualidad: 1, mensualidadPagada: 0, montoTotal: 240, pagado: false },
  { id: '10', fechaCompra: '2026-03-30', desc: 'SALDO TELCEL', monto: 200, mensualidad: 1, mensualidadPagada: 0, montoTotal: 200, pagado: false },
];

const DEFAULT_MOVIMIENTOS: Movimiento[] = [
  { id: 'm1', fecha: '2026-03-08', descripcion: 'Saldo inicial', compras: 0, abonos: 0 },
  { id: 'm2', fecha: '2026-03-08', descripcion: 'Inicio', compras: 2.65, abonos: 0 },
  { id: 'm3', fecha: '2026-03-09', descripcion: 'Pago', compras: 0, abonos: 19800 },
  { id: 'm4', fecha: '2026-03-06', descripcion: 'Gasolina', compras: 300, abonos: 0 },
  { id: 'm5', fecha: '2026-03-07', descripcion: 'Ortiz Vera', compras: 147, abonos: 0 },
  { id: 'm6', fecha: '2026-03-10', descripcion: 'Xbox live', compras: 219, abonos: 0 },
];

/**
 * Todas las claves que el servicio escribe en StorageService.
 * Se usan en resetTodo() para borrar todo lo guardado y que el constructor
 * vuelva a leer los defaults. Si se agrega una clave nueva, sumarla aqui.
 */
const KEYS_PERSISTIDAS = [
  'presupuesto', 'gastos', 'imprevistos', 'pagosTC', 'config',
  'deudas', 'deudores', 'deudoresLista', 'movimientos', 'movConfig', 'quincenaActual',
] as const;

function migratePresupuesto(raw: any): Presupuesto {
  const base: Presupuesto = { q1: { dinero: { efectivo: 13500, vales: 1345, nomina: 0 }, ingresos: [] }, q2: { dinero: { efectivo: 13500, vales: 1345, nomina: 0 }, ingresos: [] }, men: { dinero: { efectivo: 0, vales: 0, nomina: 0 }, ingresos: [] } };
  if (raw?.q1?.dinero && raw?.q1?.ingresos && raw?.q2?.dinero) {
    // Lo guardado ya tiene el formato nuevo: solo se completa `men` si falta.
    return { ...base, ...raw, men: raw.men ?? base.men };
  }
  const toDinero = (q: any): Dinero => {
    if (q?.dinero) return q.dinero;
    if (q?.efectivo !== undefined || q?.vales !== undefined || q?.nomina !== undefined) {
      return { efectivo: Number(q.efectivo ?? q.nomina ?? 0), vales: Number(q.vales ?? 0), nomina: Number(q.nomina ?? 0) };
    }
    return { efectivo: 13500, vales: 1345, nomina: 0 };
  };
  const toIngresos = (q: any): IngresoEntry[] => {
    if (q?.ingresos && Array.isArray(q.ingresos)) return q.ingresos;
    const list: IngresoEntry[] = [];
    if (q?.efectivo !== undefined && q?.nomina === undefined) {
      list.push({ id: 'nomina', concepto: 'Nomina', monto: Number(q.efectivo) || 0 });
    } else if (q?.nomina !== undefined) list.push({ id: 'nomina', concepto: 'Nomina', monto: Number(q.nomina) || 0 });
    if (q?.vales !== undefined) list.push({ id: 'vales', concepto: 'Vales', monto: Number(q.vales) || 0 });
    if (list.length === 0) return [{ id: 'nomina', concepto: 'Nomina', monto: 13500 }, { id: 'vales', concepto: 'Vales', monto: 1345 }];
    return list;
  };
  return { q1: { dinero: toDinero(raw?.q1), ingresos: toIngresos(raw?.q1) }, q2: { dinero: toDinero(raw?.q2), ingresos: toIngresos(raw?.q2) }, men: { dinero: toDinero(raw?.men), ingresos: toIngresos(raw?.men) } };
}

/** Valida una config guardada: si cambian las opciones, cae en el default. */
function migrateConfig(raw: any): ConfigApp {
  const c = raw ?? {};
  const rango: RangoIngreso = ['8-15', '15-20', '20-40'].includes(c.rango) ? c.rango : DEFAULT_CONFIG.rango;
  const tipoPago: TipoPago = c.tipoPago === 'mensual' || c.tipoPago === 'quincenas' ? c.tipoPago : DEFAULT_CONFIG.tipoPago;
  const membresia: TipoMembresia = c.membresia === 'anual' ? 'anual' : 'mensual';
  return { rango, tipoPago, membresia };
}


@Injectable({ providedIn: 'root' })
export class BudgetService {
  // MODO LOCAL: todo con StorageService, sin backend
  useRest = false; restBaseUrl = 'http://localhost:8080/api/v1';
  categorias = CATEGORIAS;

  private _presupuesto$ = new BehaviorSubject<Presupuesto>(DEFAULT_PRESUPUESTO);
  private _gastos$ = new BehaviorSubject<Gasto[]>([]);
  private _imprevistos$ = new BehaviorSubject<Imprevisto[]>([]);
  private _pagosTC$ = new BehaviorSubject<PagoTC[]>(DEFAULT_PAGOS_TC);
  private _deudas$ = new BehaviorSubject<Deuda[]>([]);
  private _deudores$ = new BehaviorSubject<Deudor[]>([{ id: '1', nombre: 'Miguel An...', monto: 360, faltaPago: true }]);

  presupuesto$ = this._presupuesto$.asObservable();
  gastos$ = this._gastos$.asObservable();
  imprevistos$ = this._imprevistos$.asObservable();
  pagosTC$ = this._pagosTC$.asObservable();
  deudas$ = this._deudas$.asObservable();
  deudores$ = this._deudores$.asObservable();
  private _deudoresLista$ = new BehaviorSubject<Deuda[]>([]);
  deudoresLista$ = this._deudoresLista$.asObservable();
  private _movimientos$ = new BehaviorSubject<Movimiento[]>([]);
  movimientos$ = this._movimientos$.asObservable();
  private _movConfig$ = new BehaviorSubject<{fechaCorte:number, fechaPago:number, ppngi:number}>({fechaCorte:13, fechaPago:6, ppngi:1280});
  movConfig$ = this._movConfig$.asObservable();

  private _config$ = new BehaviorSubject<ConfigApp>(DEFAULT_CONFIG);
  config$ = this._config$.asObservable();

  private _quincenaActual$ = new BehaviorSubject<FiltroQuincena>('TODO');
  quincenaActual$!: any;
  getQuincenaActual(): FiltroQuincena { return this._quincenaActual$.value; }
  setQuincenaActual(q: FiltroQuincena) { this._quincenaActual$.next(q); this.storage.set('quincenaActual', q); }

  constructor(private storage: StorageService) {
    this._quincenaActual$ = new BehaviorSubject<FiltroQuincena>(this.storage.get<FiltroQuincena>('quincenaActual', 'TODO'));
    this.quincenaActual$ = this._quincenaActual$.asObservable();
    const cfg = migrateConfig(this.storage.get<any>('config', DEFAULT_CONFIG));
    this._config$.next(cfg);
    const raw = this.storage.get<any>('presupuesto', null);
    const migrated = raw ? migratePresupuesto(raw) : seedPresupuesto(cfg);
    if (JSON.stringify(raw) !== JSON.stringify(migrated)) this.storage.set('presupuesto', migrated);
    this._presupuesto$.next(migrated);
    const gastos = this.storage.get<Gasto[] | null>('gastos', null);
    if (gastos) this._gastos$.next(gastos); else { const s = seedGastosConfig(cfg); this._gastos$.next(s); this.persistGastos(s); }
    this._imprevistos$.next(this.storage.get<Imprevisto[]>('imprevistos', []));
    const rawPagos = this.storage.get<any[]>('pagosTC', DEFAULT_PAGOS_TC);
    const migratedPagos: PagoTC[] = rawPagos.map((p: any) => {
      if (p.mensualidadPagada !== undefined) return p as PagoTC;
      if (p.mensualidad === 9 && p.montoTotal && p.monto) {
        const total = Math.round(p.montoTotal / p.monto) || 12;
        return { ...p, mensualidad: total, mensualidadPagada: 9 } as PagoTC;
      }
      return { ...p, mensualidadPagada: 0 } as PagoTC;
    });
    if (JSON.stringify(rawPagos) !== JSON.stringify(migratedPagos)) this.storage.set('pagosTC', migratedPagos);
    this._pagosTC$.next(migratedPagos);
    this._deudas$.next(this.storage.get<Deuda[]>('deudas', []));
    this._deudores$.next(this.storage.get<Deudor[]>('deudores', [{ id: '1', nombre: 'Miguel An...', monto: 360, faltaPago: true }]));
    this._deudoresLista$.next(this.storage.get<Deuda[]>('deudoresLista', []));
    this._movimientos$.next(this.storage.get<Movimiento[]>('movimientos', DEFAULT_MOVIMIENTOS));
    this._movConfig$.next(this.storage.get<{fechaCorte:number, fechaPago:number, ppngi:number}>('movConfig', {fechaCorte:13, fechaPago:6, ppngi:1280}));
  }

  private persistGastos(v: Gasto[]) { this.storage.set('gastos', v); }
  private persistImprevistos(v: Imprevisto[]) { this.storage.set('imprevistos', v); }
  private persistPresupuesto(p: Presupuesto) {
    const bloque = (b: PresupuestoQuincena) => ({ dinero: { ...b.dinero }, ingresos: b.ingresos.map((i: IngresoEntry) => ({ ...i })) });
    const clone: Presupuesto = { q1: bloque(p.q1), q2: bloque(p.q2), men: bloque(p.men) };
    this.storage.set('presupuesto', clone); this._presupuesto$.next(clone);
  }

  /** 'Q1' | 'Q2' | 'MEN' -> la clave del presupuesto. Un solo lugar. */
  private clave(q: Quincena): 'q1' | 'q2' | 'men' { return q === 'Q1' ? 'q1' : q === 'Q2' ? 'q2' : 'men'; }
  /** Los periodos que existen segun la config: dos quincenas o el mes. */
  periodos(): Quincena[] { return this._config$.value.tipoPago === 'mensual' ? ['MEN'] : ['Q1', 'Q2']; }

  getPresupuesto(): Presupuesto { return this._presupuesto$.value; }
  getConfig(): ConfigApp { return this._config$.value; }
  /** Membresia elegida: se muestra en el perfil. */
  getMembresia(): TipoMembresia { return this._config$.value.membresia; }

  getIngresos(q: Quincena): IngresoEntry[] { return this.getPresupuesto()[this.clave(q)].ingresos; }
  getIngresoTotal(q: Quincena): number { return this.getIngresos(q).reduce((s, e) => s + (Number(e.monto) || 0), 0); }
  getDinero(q: Quincena): Dinero { return this.getPresupuesto()[this.clave(q)].dinero; }
  getDineroTotal(q: Quincena): number { const d = this.getDinero(q); return (Number(d.efectivo) || 0) + (Number(d.vales) || 0) + (Number(d.nomina) || 0); }
  getMontoByConcepto(q: Quincena, concepto: string): number { const f = this.getIngresos(q).find(e => e.concepto.toLowerCase() === concepto.toLowerCase()); return f ? f.monto : 0; }

  updatePresupuesto(p: Presupuesto) { this.persistPresupuesto(p); }
  patchDinero(q: Quincena, patch: Partial<Dinero>) {
    const cur = this.getPresupuesto();
    const target = cur[this.clave(q)].dinero;
    Object.assign(target, { efectivo: patch.efectivo !== undefined ? Number(patch.efectivo) || 0 : target.efectivo, vales: patch.vales !== undefined ? Number(patch.vales) || 0 : target.vales, nomina: patch.nomina !== undefined ? Number(patch.nomina) || 0 : target.nomina });
    this.persistPresupuesto(cur);
  }
  patchPresupuesto(q: Quincena, patch: Partial<Record<string, number>>) { this.patchDinero(q, patch as Partial<Dinero>); }

  addIngreso(q: Quincena, concepto: string, monto: number) {
    const cur = this.getPresupuesto();
    const target = cur[this.clave(q)];
    target.ingresos.push({ id: Date.now().toString(), concepto: concepto.trim() || 'Ingreso', monto: Number(monto) || 0 });
    this.persistPresupuesto(cur);
  }
  updateIngreso(q: Quincena, id: string, patch: Partial<IngresoEntry>) {
    const cur = this.getPresupuesto();
    const target = cur[this.clave(q)];
    const idx = target.ingresos.findIndex(e => e.id === id);
    if (idx >= 0) { target.ingresos[idx] = { ...target.ingresos[idx], ...patch, monto: patch.monto !== undefined ? Number(patch.monto) || 0 : target.ingresos[idx].monto }; this.persistPresupuesto(cur); }
  }
  removeIngreso(q: Quincena, id: string) {
    const cur = this.getPresupuesto();
    const target = cur[this.clave(q)];
    target.ingresos = target.ingresos.filter(e => e.id !== id);
    this.persistPresupuesto(cur);
  }

  getGastos(q?: Quincena): Gasto[] { const all = this._gastos$.value; return q ? all.filter(g => g.quincena === q) : all; }
  toggleGasto(id: string) { const next = this._gastos$.value.map(g => g.id === id ? { ...g, pagado: !g.pagado } : g); this._gastos$.next(next); this.persistGastos(next); }
  addGasto(g: Omit<Gasto, 'id'>) { const gasto: Gasto = { ...g, id: Date.now().toString() }; const next = [...this._gastos$.value, gasto]; this._gastos$.next(next); this.persistGastos(next); }
  removeGasto(id: string) { const next = this._gastos$.value.filter(g => g.id !== id); this._gastos$.next(next); this.persistGastos(next); }
  updateGasto(id: string, patch: Partial<Gasto>) { const next = this._gastos$.value.map(g => g.id === id ? { ...g, ...patch } : g); this._gastos$.next(next); this.persistGastos(next); }

  getImprevistos(q?: Quincena): Imprevisto[] { const all = this._imprevistos$.value; return q ? all.filter(i => i.quincena === q) : all; }
  addImprevisto(i: Omit<Imprevisto, 'id'>) { const imp: Imprevisto = { ...i, id: Date.now().toString() }; const next = [...this._imprevistos$.value, imp]; this._imprevistos$.next(next); this.persistImprevistos(next); }
  toggleImprevisto(id: string) { const next = this._imprevistos$.value.map(x => x.id === id ? { ...x, pagado: !x.pagado } : x); this._imprevistos$.next(next); this.persistImprevistos(next); }
  removeImprevisto(id: string) { const next = this._imprevistos$.value.filter(x => x.id !== id); this._imprevistos$.next(next); this.persistImprevistos(next); }

  getPagosTC() { return this._pagosTC$.value; }
  togglePagoTC(id: string) { const next = this._pagosTC$.value.map(p => p.id === id ? { ...p, pagado: !p.pagado } : p); this._pagosTC$.next(next); this.storage.set('pagosTC', next); }
  addPagoTC(p: Omit<PagoTC, 'id'>) { const np: PagoTC = { ...p, id: Date.now().toString() }; const next = [...this._pagosTC$.value, np]; this._pagosTC$.next(next); this.storage.set('pagosTC', next); }
  updatePagoTC(id: string, patch: Partial<PagoTC>) { const next = this._pagosTC$.value.map(p => p.id === id ? { ...p, ...patch } : p); this._pagosTC$.next(next); this.storage.set('pagosTC', next); }
  removePagoTC(id: string) { const next = this._pagosTC$.value.filter(p => p.id !== id); this._pagosTC$.next(next); this.storage.set('pagosTC', next); }

  getDeudas() { return this._deudas$.value; }
  addDeuda(d: Omit<Deuda, 'id'>) { const nd: Deuda = { ...d, id: Date.now().toString() }; const next = [...this._deudas$.value, nd]; this._deudas$.next(next); this.storage.set('deudas', next); }
  updateDeuda(id: string, patch: Partial<Deuda>) { const next = this._deudas$.value.map(d => d.id === id ? { ...d, ...patch } : d); this._deudas$.next(next); this.storage.set('deudas', next); }
  removeDeuda(id: string) { const next = this._deudas$.value.filter(d => d.id !== id); this._deudas$.next(next); this.storage.set('deudas', next); }

  getDeudores() { return this._deudores$.value; }
  addDeudor(d: Deudor) { const next = [...this._deudores$.value, d]; this._deudores$.next(next); this.storage.set('deudores', next); }
  getDeudoresLista() { return this._deudoresLista$.value; }
  addDeudorLista(d: Omit<Deuda, 'id'>) { const nd: Deuda = { ...d, id: Date.now().toString() }; const next = [...this._deudoresLista$.value, nd]; this._deudoresLista$.next(next); this.storage.set('deudoresLista', next); }
  updateDeudorLista(id: string, patch: Partial<Deuda>) { const next = this._deudoresLista$.value.map(d => d.id === id ? { ...d, ...patch } : d); this._deudoresLista$.next(next); this.storage.set('deudoresLista', next); }
  removeDeudorLista(id: string) { const next = this._deudoresLista$.value.filter(d => d.id !== id); this._deudoresLista$.next(next); this.storage.set('deudoresLista', next); }
  getMovimientos(){ return this._movimientos$.value; }
  addMovimiento(m: Omit<Movimiento,'id'>){ const n: Movimiento={...m, id: Date.now().toString()}; const next=[...this._movimientos$.value, n]; this._movimientos$.next(next); this.storage.set('movimientos', next); }
  updateMovimiento(id:string, patch:Partial<Movimiento>){ const next=this._movimientos$.value.map(x=>x.id===id?{...x,...patch}:x); this._movimientos$.next(next); this.storage.set('movimientos', next); }
  removeMovimiento(id:string){ const next=this._movimientos$.value.filter(x=>x.id!==id); this._movimientos$.next(next); this.storage.set('movimientos', next); }
  getMovConfig(){ return this._movConfig$.value; }
  setMovConfig(c:{fechaCorte:number, fechaPago:number, ppngi:number}){ this._movConfig$.next(c); this.storage.set('movConfig', c); }

  /**
   * Borra todo lo guardado y vuelve a cargar los datos de ejemplo.
   * NO HAY FORMA DE DESHACER: se pierde todo lo capturado a mano.
   *
   * Hace falta porque los seeds (GASTOS_Q1, GASTOS_Q2, DEFAULT_*) solo se leen
   * cuando no hay nada en localStorage. Editar el codigo no cambia lo que ya
   * esta guardado, asi que sin esto no hay manera de aplicar los cambios.
   *
   * @param only Gastos si es true, solo restablece los gastos y las quincenas,
   *                    dejando deudas, deudores y movimientos como estan.
   */
  resetTodo(only?: Gasto[]) {
    if (only) {
      const gastos = only;
      this._gastos$.next(gastos);
      this.persistGastos(gastos);
      return;
    }
    for (const key of KEYS_PERSISTIDAS) this.storage.remove(key);
    // Recarga la pagina para que el constructor del servicio vuelva a leer
    // todo desde los defaults, en vez de intentar reconstruirlo a mano.
    if (typeof window !== 'undefined') window.location.reload();
  }

  /**
   * Restablece con la config que se eligio en el wizard: borra lo capturado a
   * mano y carga los datos de ejemplo del rango y del tipo de pago elegidos.
   * No recarga la pagina: actualiza los observables para que se vea al toque.
   */
  resetConConfig(cfg: ConfigApp) {
    const limpio = migrateConfig(cfg);
    this.storage.set('config', limpio);
    this._config$.next(limpio);
    // Borra lo del usuario y siembra lo del rango elegido.
    for (const key of ['gastos', 'imprevistos', 'deudas', 'deudores', 'deudoresLista', 'movimientos'] as const) this.storage.remove(key);
    this._gastos$.next(seedGastosConfig(limpio)); this.persistGastos(this._gastos$.value);
    this._imprevistos$.next([]); this.persistImprevistos([]);
    this._pagosTC$.next(DEFAULT_PAGOS_TC.map(p => ({ ...p }))); this.storage.set('pagosTC', this._pagosTC$.value);
    this._deudas$.next([]); this.storage.set('deudas', []);
    this._deudores$.next([{ id: '1', nombre: 'Miguel An...', monto: 360, faltaPago: true }]); this.storage.set('deudores', this._deudores$.value);
    this._deudoresLista$.next([]); this.storage.set('deudoresLista', []);
    this._movimientos$.next(DEFAULT_MOVIMIENTOS.map(m => ({ ...m }))); this.storage.set('movimientos', this._movimientos$.value);
    this._movConfig$.next({ fechaCorte: 13, fechaPago: 6, ppngi: 1280 }); this.storage.set('movConfig', this._movConfig$.value);
    this.persistPresupuesto(seedPresupuesto(limpio));
    // El periodo activo vuelve al general: si queda en Q2 y ahora es mensual,
    // el dashboard no tendria con que comparar.
    this.setQuincenaActual('TODO');
  }

  /** Los defaults de gastos de la config actual, ya con id. */
  gastosPorDefecto(): Gasto[] { return seedGastosConfig(this._config$.value); }

  /**
   * Resumen de los datos de ejemplo de una config, sin aplicarla: sirve para
   * previsualizar en el wizard cuantos gastos y de cuanto son.
   */
  resumenPorConfig(cfg: ConfigApp): { gastos: number; previstos: number } {
    const gastos = seedGastosConfig(migrateConfig(cfg));
    return { gastos: gastos.length, previstos: gastos.reduce((s, g) => s + g.previsto, 0) };
  }

  resumenQuincena(q: Quincena) {
    const gastos = this.getGastos(q);
    const previstos = gastos.reduce((s, g) => s + g.previsto, 0);
    const reales = gastos.filter(g => g.pagado).reduce((s, g) => s + g.previsto, 0) + this.getImprevistos(q).filter(i => i.pagado).reduce((s, i) => s + i.importe, 0);
    const imprevistos = this.getImprevistos(q).reduce((s, i) => s + i.importe, 0);
    const ingreso = this.getDineroTotal(q);
    const sobrante = ingreso - previstos;
    const pendiente = previstos - reales;
    return { previstos, reales, imprevistos, ingreso, sobrante, pendiente, gastos };
  }

  breakdownCategoria(q: Quincena) {
    const gastos = this.getGastos(q);
    const map = new Map<string, number>();
    gastos.forEach(g => map.set(g.categoriaId, (map.get(g.categoriaId) || 0) + g.previsto));
    return Array.from(map.entries()).map(([id, total]) => ({
      categoria: this.categorias.find(c => c.id === id)!,
      total, previo: total
    }));
  }
}
