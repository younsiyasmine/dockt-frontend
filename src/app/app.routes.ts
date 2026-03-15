import { Routes } from '@angular/router';
import { Dashboard } from './patient/dashboard/dashboard';
import { PrendreRdv } from './patient/prendre-rdv/prendre-rdv';

export const routes: Routes = [
  { path: '', redirectTo: 'patient/dashboard', pathMatch: 'full' },
  { path: 'patient/dashboard', component: Dashboard },
  { path: 'patient/prendre-rdv', component: PrendreRdv },
];

