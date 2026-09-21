export type Quincena = 'Q1' | 'Q2';
export type FiltroQuincena = Quincena | 'TODO';
export type GastoTipo = 'fijo' | 'manual';
export interface Categoria { id: string; nombre: string; color: string; icono?: string; }
export interface Gasto { id: string; quincena: Quincena; categoriaId: string; descripcion: string; previsto: number; pagado: boolean; importeReal?: number; fecha?: string; tipo: GastoTipo; }
export interface Imprevisto { id: string; quincena: Quincena; fecha: string; importe: number; descripcion: string; pagado: boolean; }
export interface IngresoEntry { id: string; concepto: string; monto: number; }
export interface Dinero { efectivo: number; vales: number; nomina: number; }
export interface PresupuestoQuincena { dinero: Dinero; ingresos: IngresoEntry[]; }
export interface Presupuesto { q1: PresupuestoQuincena; q2: PresupuestoQuincena; }
export interface Deuda { id: string; nombre: string; fechaInicio: string; fechaFin: string; pagado: number; saldo: number; mensualidad: number; desc: string; pagos: number; pagados: number; estatus: string; tipo?: string; }
export interface PagoTC { id: string; fechaCompra: string; desc: string; monto: number; mensualidad: number; mensualidadPagada: number; montoTotal: number; pagado: boolean; }
export interface Deudor { id: string; nombre: string; monto: number; faltaPago: boolean; }
export interface Movimiento { id: string; fecha: string; descripcion: string; compras: number; abonos: number; }
