import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { StorageService } from './storage.service';
import { Categoria, Gasto, Imprevisto, Presupuesto, IngresoEntry, Dinero, Quincena, FiltroQuincena, PagoTC, Deuda, Deudor, Movimiento } from '../models/budget.model';

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
};

function seedGastos(): Gasto[] {
  const base: Omit<Gasto, 'id' | 'quincena'>[] = [
    { categoriaId: 'hogar', descripcion: 'Gasolina', previsto: 700, pagado: false, tipo: 'fijo' },
    { categoriaId: 'hogar', descripcion: 'Gasolina', previsto: 700, pagado: false, tipo: 'fijo' },
    { categoriaId: 'hogar', descripcion: 'Aseo', previsto: 250, pagado: false, tipo: 'fijo' },
    { categoriaId: 'hogar', descripcion: 'Aseo', previsto: 250, pagado: false, tipo: 'fijo' },
    { categoriaId: 'hogar', descripcion: 'Comida P1', previsto: 1600, pagado: false, tipo: 'fijo' },
    { categoriaId: 'hogar', descripcion: 'Comida P2', previsto: 1600, pagado: false, tipo: 'fijo' },
    { categoriaId: 'hogar', descripcion: 'Com. fin sem.', previsto: 500, pagado: false, tipo: 'fijo' },
    { categoriaId: 'hogar', descripcion: 'Com. fin sem.', previsto: 500, pagado: false, tipo: 'fijo' },
    { categoriaId: 'hogar', descripcion: 'Luz', previsto: 250, pagado: false, tipo: 'fijo' },
    { categoriaId: 'hogar', descripcion: 'Agua', previsto: 90, pagado: false, tipo: 'fijo' },
    { categoriaId: 'hogar', descripcion: 'Gas', previsto: 100, pagado: false, tipo: 'fijo' },
    { categoriaId: 'hogar', descripcion: 'Mnt casa', previsto: 300, pagado: false, tipo: 'fijo' },
    { categoriaId: 'hogar', descripcion: 'Papel baño', previsto: 70, pagado: false, tipo: 'fijo' },
    { categoriaId: 'hogar', descripcion: 'Detergentes', previsto: 80, pagado: false, tipo: 'fijo' },
    { categoriaId: 'hogar', descripcion: 'Pasta y jabon', previsto: 50, pagado: false, tipo: 'fijo' },
    { categoriaId: 'hogar', descripcion: 'Minoxit y pastilla', previsto: 180, pagado: false, tipo: 'fijo' },
    { categoriaId: 'hogar', descripcion: 'Comida Gigi', previsto: 200, pagado: false, tipo: 'fijo' },
    { categoriaId: 'ahorro', descripcion: 'Ahorro', previsto: 0, pagado: false, tipo: 'fijo' },
    { categoriaId: 'escuelas', descripcion: 'Colegiatura Sofi', previsto: 1200, pagado: false, tipo: 'fijo' },
    { categoriaId: 'escuelas', descripcion: 'Colegiatura Rich', previsto: 1200, pagado: false, tipo: 'fijo' },
    { categoriaId: 'carro', descripcion: 'Seguro carro', previsto: 0, pagado: false, tipo: 'fijo' },
    { categoriaId: 'ejercicio', descripcion: 'Ejercicio JR', previsto: 400, pagado: false, tipo: 'fijo' },
    { categoriaId: 'ejercicio', descripcion: 'Ejercicio Sofi', previsto: 500, pagado: false, tipo: 'fijo' },
    { categoriaId: 'ejercicio', descripcion: 'Creatina', previsto: 120, pagado: false, tipo: 'fijo' },
    { categoriaId: 'ejercicio', descripcion: 'Ejercicio Ale', previsto: 450, pagado: false, tipo: 'fijo' },
    { categoriaId: 'credito', descripcion: 'Pago TC', previsto: 1800, pagado: false, tipo: 'fijo' },
    { categoriaId: 'lamarina', descripcion: 'Pago la Marina', previsto: 0, pagado: false, tipo: 'fijo' },
    { categoriaId: 'adic', descripcion: 'Terapeuta', previsto: 300, pagado: false, tipo: 'fijo' },
    { categoriaId: 'adic', descripcion: 'Terapeuta', previsto: 300, pagado: false, tipo: 'fijo' },
    { categoriaId: 'adic', descripcion: 'Ale', previsto: 600, pagado: false, tipo: 'fijo' },
    { categoriaId: 'adic', descripcion: 'Pago papá', previsto: 0, pagado: false, tipo: 'fijo' },
    { categoriaId: 'adic', descripcion: 'HBO', previsto: 0, pagado: false, tipo: 'fijo' },
    { categoriaId: 'adic', descripcion: 'Adicionales', previsto: 0, pagado: false, tipo: 'fijo' },
  ];
  const out: Gasto[] = [];
  (['Q1', 'Q2'] as Quincena[]).forEach(q => {
    base.forEach((b, i) => out.push({ ...b, quincena: q, id: `${q}-${i}-${b.descripcion}` }));
  });
  return out;
}

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


function migratePresupuesto(raw: any): Presupuesto {
  if (raw?.q1?.dinero && raw?.q1?.ingresos) return raw as Presupuesto;
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
  return { q1: { dinero: toDinero(raw?.q1), ingresos: toIngresos(raw?.q1) }, q2: { dinero: toDinero(raw?.q2), ingresos: toIngresos(raw?.q2) } };
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

  private _quincenaActual$ = new BehaviorSubject<FiltroQuincena>('TODO');
  quincenaActual$!: any;
  getQuincenaActual(): FiltroQuincena { return this._quincenaActual$.value; }
  setQuincenaActual(q: FiltroQuincena) { this._quincenaActual$.next(q); this.storage.set('quincenaActual', q); }

  constructor(private storage: StorageService) {
    this._quincenaActual$ = new BehaviorSubject<FiltroQuincena>(this.storage.get<FiltroQuincena>('quincenaActual', 'TODO'));
    this.quincenaActual$ = this._quincenaActual$.asObservable();
    const raw = this.storage.get<any>('presupuesto', DEFAULT_PRESUPUESTO);
    const migrated = migratePresupuesto(raw);
    if (JSON.stringify(raw) !== JSON.stringify(migrated)) this.storage.set('presupuesto', migrated);
    this._presupuesto$.next(migrated);
    const gastos = this.storage.get<Gasto[] | null>('gastos', null);
    if (gastos) this._gastos$.next(gastos); else { const s = seedGastos(); this._gastos$.next(s); this.persistGastos(s); }
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
    const clone: Presupuesto = { q1: { dinero: { ...p.q1.dinero }, ingresos: p.q1.ingresos.map(i => ({ ...i })) }, q2: { dinero: { ...p.q2.dinero }, ingresos: p.q2.ingresos.map(i => ({ ...i })) } };
    this.storage.set('presupuesto', clone); this._presupuesto$.next(clone);
  }

  getPresupuesto(): Presupuesto { return this._presupuesto$.value; }
  getIngresos(q: Quincena): IngresoEntry[] { return q === 'Q1' ? this._presupuesto$.value.q1.ingresos : this._presupuesto$.value.q2.ingresos; }
  getIngresoTotal(q: Quincena): number { return this.getIngresos(q).reduce((s, e) => s + (Number(e.monto) || 0), 0); }
  getDinero(q: Quincena): Dinero { return q === 'Q1' ? this._presupuesto$.value.q1.dinero : this._presupuesto$.value.q2.dinero; }
  getDineroTotal(q: Quincena): number { const d = this.getDinero(q); return (Number(d.efectivo) || 0) + (Number(d.vales) || 0) + (Number(d.nomina) || 0); }
  getMontoByConcepto(q: Quincena, concepto: string): number { const f = this.getIngresos(q).find(e => e.concepto.toLowerCase() === concepto.toLowerCase()); return f ? f.monto : 0; }

  updatePresupuesto(p: Presupuesto) { this.persistPresupuesto(p); }
  patchDinero(q: Quincena, patch: Partial<Dinero>) {
    const cur = this.getPresupuesto();
    const target = q === 'Q1' ? cur.q1.dinero : cur.q2.dinero;
    Object.assign(target, { efectivo: patch.efectivo !== undefined ? Number(patch.efectivo) || 0 : target.efectivo, vales: patch.vales !== undefined ? Number(patch.vales) || 0 : target.vales, nomina: patch.nomina !== undefined ? Number(patch.nomina) || 0 : target.nomina });
    this.persistPresupuesto(cur);
  }
  patchPresupuesto(q: Quincena, patch: Partial<Record<string, number>>) { this.patchDinero(q, patch as Partial<Dinero>); }

  addIngreso(q: Quincena, concepto: string, monto: number) {
    const cur = this.getPresupuesto();
    const target = q === 'Q1' ? cur.q1 : cur.q2;
    target.ingresos.push({ id: Date.now().toString(), concepto: concepto.trim() || 'Ingreso', monto: Number(monto) || 0 });
    this.persistPresupuesto(cur);
  }
  updateIngreso(q: Quincena, id: string, patch: Partial<IngresoEntry>) {
    const cur = this.getPresupuesto();
    const target = q === 'Q1' ? cur.q1 : cur.q2;
    const idx = target.ingresos.findIndex(e => e.id === id);
    if (idx >= 0) { target.ingresos[idx] = { ...target.ingresos[idx], ...patch, monto: patch.monto !== undefined ? Number(patch.monto) || 0 : target.ingresos[idx].monto }; this.persistPresupuesto(cur); }
  }
  removeIngreso(q: Quincena, id: string) {
    const cur = this.getPresupuesto();
    const target = q === 'Q1' ? cur.q1 : cur.q2;
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
