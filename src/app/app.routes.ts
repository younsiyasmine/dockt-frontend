import { Routes } from '@angular/router';
import { Dashboard } from './patient/dashboard/dashboard';

export const routes: Routes = [
  { path: '', redirectTo: 'patient/dashboard', pathMatch: 'full' },
  { path: 'patient/dashboard', component: Dashboard },
];
