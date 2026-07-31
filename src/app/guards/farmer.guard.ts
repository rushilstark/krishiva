import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth';

export const farmerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.role() === 'farmer') {
    return true;
  }
  
  return auth.role() === 'buyer' ? router.createUrlTree(['/home']) : router.createUrlTree(['/login']);
};
