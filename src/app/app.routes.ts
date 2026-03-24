import { Routes } from '@angular/router';
import { OrganizacionList } from './organizacion-list/organizacion-list';
import { UsuarioList } from './usuario-list/usuario-list';
import { LoginComponent } from './login/login';
import { ForbiddenComponent } from './forbidden/forbidden';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'forbidden', component: ForbiddenComponent, canActivate: [authGuard] },
  { path: '', component: OrganizacionList, canActivate: [authGuard] },
  {
    path: 'usuarios',
    component: UsuarioList,
    canActivate: [authGuard, roleGuard('admin')],
  },
  { path: '**', redirectTo: '' },
];