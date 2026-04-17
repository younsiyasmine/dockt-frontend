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
  { path: 'patient/mes-ordonnances', component: MesOrdonnancesComponent, canActivate: [AuthGuard] },
  { path: 'patient/mes-compterendu', component: MesCompterenduComponent, canActivate: [AuthGuard] },

  // Shared (protected 🔒)
  { path: 'shared/file-attente', component: FileAttente, canActivate: [AuthGuard] },
  { path: 'shared/planning', component: Planning, canActivate: [AuthGuard] },
  { path: 'gerer-dossier/:id', component: GererDossier, canActivate: [AuthGuard] },

  // Médecin (protected 🔒)
  { path: 'mes-actes', component: ActeMedicaleComponent, canActivate: [AuthGuard] },
  { path: 'dossier-patient', component: GererDossier, canActivate: [AuthGuard] },
  { path: 'dicter-ordonnance', component: DicterOrdonnance, canActivate: [AuthGuard] },
  { path: 'dicter-compte-rendu', component: DicterCompteRendu, canActivate: [AuthGuard] },
  { path: 'voir-ordonnance', component: VueOrdonnance, canActivate: [AuthGuard] },
  { path: 'ajouter-rdv', component: AjouterRdv, canActivate: [AuthGuard] },
  { path: 'ajouter-rdv/:id', component: AjouterRdv, canActivate: [AuthGuard] },
  { path: 'voir-compte-rendu', component: VueCompteRendu, canActivate: [AuthGuard] },

  // Fallback
  { path: '**', redirectTo: '' },
];
