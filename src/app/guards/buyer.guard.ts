import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth';

export const buyerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.role() === 'buyer') {
    return true;
  }
  
  // If farmer tries to access buyer route, send to their dashboard. Otherwise login.
  return auth.role() === 'farmer' ? router.createUrlTree(['/my-products']) : router.createUrlTree(['/login']);
};
