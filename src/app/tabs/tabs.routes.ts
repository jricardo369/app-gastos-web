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
        path: 'gastos',
        loadComponent: () => import('../pages/gastos/gastos.page').then(m => m.GastosPage),
      },
      {
        path: 'deudas',
        loadComponent: () => import('../pages/deudas/deudas.page').then(m => m.DeudasPage),
      },
      {
        path: 'deudores',
        loadComponent: () => import('../pages/deudores/deudores.page').then(m => m.DeudoresPage),
      },
      {
        path: 'movimientos',
        loadComponent: () => import('../pages/movimientos/movimientos.page').then(m => m.MovimientosPage),
      },
      { path: '', redirectTo: '/tabs/dashboard', pathMatch: 'full' },
    ],
  },
  { path: '', redirectTo: '/tabs/dashboard', pathMatch: 'full' },
];
