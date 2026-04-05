import { Routes } from '@angular/router';
import { Dashboard } from './patient/dashboard/dashboard';
import { PrendreRdv } from './patient/prendre-rdv/prendre-rdv';
import { MaPosition } from './patient/ma-position/ma-position';
import { FileAttente } from './shared/file-attente/file-attente';
import { Planning } from './shared/planning/planning';
import { ActeMedicaleComponent } from './acte-medicale/acte-medicale';
import { MesRendezvousComponent } from './patient/mes-rendezvous/mes-rendezvous';
import { MesOrdonnancesComponent } from './patient/mes-ordonnances/mes-ordonnances';
import { MesCompterenduComponent } from './patient/mes-compterendu/mes-compterendu';

export const routes: Routes = [
  //Patient
  { path: '', redirectTo: 'patient/dashboard', pathMatch: 'full' },
  { path: 'patient/dashboard', component: Dashboard },
  { path: 'patient/prendre-rdv', component: PrendreRdv },
  { path: 'patient/mes-rendezvous', component: MesRendezvousComponent },
  { path: 'patient/ma-position', component: MaPosition },
  { path: 'patient/mes-ordonnances', component: MesOrdonnancesComponent },
  { path: 'patient/mes-compterendu', component: MesCompterenduComponent },

  //Shared
  { path: 'medecin/file-attente', component: FileAttente },
  { path: 'secretaire/file-attente', component: FileAttente },

  // URL : http://localhost:4200/shared/planning
  { path: 'shared/planning', component: Planning },

  // URL : http://localhost:4200/mes-actes
  { path: 'mes-actes', component: ActeMedicaleComponent },

  // Redirection si l'URL est erronée
  { path: '**', redirectTo: '' },
];

