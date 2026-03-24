import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

import { UserRole } from '../models/auth.model';
import { AuthService } from '../services/auth.service';

export const roleGuard = (requiredRole: UserRole): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      return router.createUrlTree(['/login']);
    }

    if (auth.hasRole(requiredRole)) {
      return true;
    }

    return router.createUrlTree(['/forbidden']);
  };
};
