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
import { GererDossier } from './gerer-dossier/gerer-dossier';
import { DicterOrdonnance } from './dicter-ordonnance/dicter-ordonnance';
import { DicterCompteRendu } from './dicter-compte-rendu/dicter-compte-rendu';
import { VueOrdonnance } from './vue-ordonnance/vue-ordonnance';
import { AjouterRdv } from './ajouter-rdv/ajouter-rdv';
import { VueCompteRendu } from './vue-compte-rendu/vue-compte-rendu';
import { AuthGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  // Public route (no guard)
  { path: '', redirectTo: 'patient/dashboard', pathMatch: 'full' },

  // Patient (protected 🔒)
  { path: 'patient/dashboard', component: Dashboard, canActivate: [AuthGuard] },
  { path: 'patient/prendre-rdv', component: PrendreRdv, canActivate: [AuthGuard] },
  { path: 'patient/prendre-rdv/:id', component: PrendreRdv, canActivate: [AuthGuard] },
  { path: 'patient/mes-rendezvous', component: MesRendezvousComponent, canActivate: [AuthGuard] },
  { path: 'patient/ma-position', component: MaPosition, canActivate: [AuthGuard] },
  //MS3 with no security for now until i connectit with backend and delete the hardcoded info
  { path: 'patient/mes-ordonnances', component: MesOrdonnancesComponent },
  { path: 'patient/mes-compterendu', component: MesCompterenduComponent },

  // Shared (protected 🔒)
  { path: 'shared/file-attente', component: FileAttente, canActivate: [AuthGuard] },
  { path: 'shared/planning', component: Planning, canActivate: [AuthGuard] },
  //MS3 with no security for now until i connectit with backend and delete the hardcoded info
  { path: 'gerer-dossier/:id', component: GererDossier },

  // Médecin (protected 🔒)
  { path: 'mes-actes', component: ActeMedicaleComponent, canActivate: [AuthGuard] },
  //MS3 with no security for now until i connectit with backend and delete the hardcoded info
  { path: 'dossier-patient', component: GererDossier },
  { path: 'dicter-ordonnance', component: DicterOrdonnance },
  { path: 'dicter-compte-rendu', component: DicterCompteRendu },
  { path: 'ajouter-rdv', component: AjouterRdv, canActivate: [AuthGuard] },
  { path: 'ajouter-rdv/:id', component: AjouterRdv, canActivate: [AuthGuard] },
  { path: 'voir-ordonnance/:id', component: VueOrdonnance },
  { path: 'voir-compte-rendu/:id', component: VueCompteRendu },

  // Fallback
  { path: '**', redirectTo: '' },
];
