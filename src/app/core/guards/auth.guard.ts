import { CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  // MODO LOCAL: acceso directo sin validar sesión
  // Para reactivar backend, comenta el return true y descomenta lo de abajo.
  return true;
  // const auth = inject(AuthService);
  // const router = inject(Router);
  // if (auth.isAuthenticated()) return true;
  // router.navigateByUrl('/login');
  // return false;
};
