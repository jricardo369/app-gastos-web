import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage) },
  { path: 'registro', loadComponent: () => import('./pages/registro/registro.page').then(m => m.RegistroPage) },
  { path: 'sin-membresia', loadComponent: () => import('./pages/sin-membresia/sin-membresia.page').then(m => m.SinMembresiaPage) },
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: '' }
];
