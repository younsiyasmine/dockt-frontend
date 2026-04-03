import { Routes } from '@angular/router';
import { Dashboard } from './patient/dashboard/dashboard';
import { PrendreRdv } from './patient/prendre-rdv/prendre-rdv';
import { MaPosition } from './patient/ma-position/ma-position';
import { FileAttente } from './shared/file-attente/file-attente';

export const routes: Routes = [
  { path: '', redirectTo: 'patient/dashboard', pathMatch: 'full' },
  { path: 'patient/dashboard', component: Dashboard },
  { path: 'patient/prendre-rdv', component: PrendreRdv },
  { path: 'patient/ma-position', component: MaPosition },
  { path: 'medecin/file-attente', component: FileAttente },
  { path: 'secretaire/file-attente', component: FileAttente },
];

