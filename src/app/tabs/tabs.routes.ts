import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('../pages/dashboard/dashboard.page').then(m => m.DashboardPage),
      },
      {
        path: 'ingresos',
        loadComponent: () => import('../pages/ingresos/ingresos.page').then(m => m.IngresosPage),
      },
      {
        path: 'gastos',
        loadComponent: () => import('../pages/gastos/gastos.page').then(m => m.GastosPage),
      },
      {
        path: 'perfil',
        loadComponent: () => import('../pages/perfil/perfil.page').then(m => m.PerfilPage),
      },
      {
        path: 'cuentas',
        loadComponent: () => import('../pages/cuentas/cuentas.page').then(m => m.CuentasPage),
      },
      { path: 'deudas', redirectTo: '/tabs/cuentas?tab=deudas', pathMatch: 'full' },
      { path: 'deudores', redirectTo: '/tabs/cuentas?tab=deudores', pathMatch: 'full' },
      {
        path: 'movimientos',
        loadComponent: () => import('../pages/movimientos/movimientos.page').then(m => m.MovimientosPage),
      },
      { path: '', redirectTo: '/tabs/dashboard', pathMatch: 'full' },
    ],
  },
  { path: '', redirectTo: '/tabs/dashboard', pathMatch: 'full' },
];
