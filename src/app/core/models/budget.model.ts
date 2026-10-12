export type Quincena = 'Q1' | 'Q2' | 'MEN';
export type FiltroQuincena = Quincena | 'TODO';
export type GastoTipo = 'fijo' | 'manual';
export interface Categoria { id: string; nombre: string; color: string; icono?: string; }
export interface Gasto { id: string; quincena: Quincena; categoriaId: string; descripcion: string; previsto: number; pagado: boolean; importeReal?: number; fecha?: string; tipo: GastoTipo; }
export interface Imprevisto { id: string; quincena: Quincena; fecha: string; importe: number; descripcion: string; pagado: boolean; }
export interface IngresoEntry { id: string; concepto: string; monto: number; }
export interface Dinero { efectivo: number; vales: number; nomina: number; }
export interface PresupuestoQuincena { dinero: Dinero; ingresos: IngresoEntry[]; }
export interface Presupuesto { q1: PresupuestoQuincena; q2: PresupuestoQuincena; men: PresupuestoQuincena; }
export interface Deuda { id: string; nombre: string; fechaInicio: string; fechaFin: string; pagado: number; saldo: number; mensualidad: number; desc: string; pagos: number; pagados: number; estatus: string; tipo?: string; }
export interface PagoTC { id: string; fechaCompra: string; desc: string; monto: number; mensualidad: number; mensualidadPagada: number; montoTotal: number; pagado: boolean; }
export interface Deudor { id: string; nombre: string; monto: number; faltaPago: boolean; }
export interface Movimiento { id: string; fecha: string; descripcion: string; compras: number; abonos: number; }

/** Rango de ingreso mensual, en miles de pesos. */
export type RangoIngreso = '8-15' | '15-20' | '20-40';
/** Como se cobra: en dos quincenas (Q1/Q2) o un solo pago mensual (MEN). */
export type TipoPago = 'quincenas' | 'mensual';
/** Tipo de membresia de la app. */
export type TipoMembresia = 'mensual' | 'anual';

/** Lo que se elige al restablecer los datos. */
export interface ConfigApp {
  rango: RangoIngreso;
  tipoPago: TipoPago;
  membresia: TipoMembresia;
}

/** Las tres opciones de rango, en el orden en que se ofrecen. */
export const RANGOS: { id: RangoIngreso; etiqueta: string; detalle: string }[] = [
  { id: '8-15', etiqueta: '$8,000 a $15,000', detalle: 'Ingreso mensual' },
  { id: '15-20', etiqueta: '$15,000 a $20,000', detalle: 'Ingreso mensual' },
  { id: '20-40', etiqueta: '$20,000 a $40,000', detalle: 'Ingreso mensual' },
];

export const TIPOS_PAGO: { id: TipoPago; etiqueta: string; detalle: string }[] = [
  { id: 'quincenas', etiqueta: 'Dos quincenas', detalle: 'El mes se parte en Q1 y Q2' },
  { id: 'mensual', etiqueta: 'Mensual', detalle: 'Un solo bloque, el mes completo' },
];

export const MEMBRESIAS: { id: TipoMembresia; etiqueta: string; detalle: string; precio: number }[] = [
  { id: 'mensual', etiqueta: 'Mensual', detalle: 'Se renueva cada mes', precio: 99 },
  { id: 'anual', etiqueta: 'Anual', detalle: 'Se renueva cada año, más económica', precio: 990 },
];
