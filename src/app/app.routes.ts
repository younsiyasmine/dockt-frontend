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
import { authGuard } from './core/guards/auth-guard';

// Mehdi's pages
import { LoginComponent } from './pages/login/login';
import { LoginAdminComponent } from './pages/login-admin/login-admin';
import { RegisterComponent } from './pages/register/register';
import { ProfilComponent } from './pages/profil/profil';

import { MedecinDashboard } from './pages/medecin-dashboard/medecin-dashboard';
import { PatientsComponent } from './pages/patients/patients';
import { Parametres } from './pages/parametres/parametres';

// Marwa tab1 & tab 2
import { TabletteCheckinComponent } from './tablette-checkin/tablette-checkin';
import { TabletteConsultationComponent } from './tablette-consultation/tablette-consultation';

export const routes: Routes = [
  // Auth (public)
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'login-admin', component: LoginAdminComponent },
  { path: 'register', component: RegisterComponent },

  // Patient (protected 🔒)
  { path: 'patient/dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'profil', component: ProfilComponent, canActivate: [authGuard] },
  { path: 'patient/prendre-rdv', component: PrendreRdv, canActivate: [authGuard] },
  { path: 'patient/prendre-rdv/:id', component: PrendreRdv, canActivate: [authGuard] },
  { path: 'patient/mes-rendezvous', component: MesRendezvousComponent, canActivate: [authGuard] },
  { path: 'patient/ma-position', component: MaPosition, canActivate: [authGuard] },
  { path: 'patient/mes-ordonnances', component: MesOrdonnancesComponent },
  { path: 'patient/mes-compterendu', component: MesCompterenduComponent },

  // Médecin (protected 🔒)
  { path: 'medecin-dashboard', component: MedecinDashboard, canActivate: [authGuard] },
  { path: 'patients', component: PatientsComponent, canActivate: [authGuard] },
  { path: 'medecin/dossier/:id', component: GererDossier, canActivate: [authGuard] },
  { path: 'mes-actes', component: ActeMedicaleComponent, canActivate: [authGuard] },
  { path: 'ajouter-rdv', component: AjouterRdv, canActivate: [authGuard] },
  { path: 'ajouter-rdv/:id', component: AjouterRdv, canActivate: [authGuard] },
  { path: 'dossier-patient', component: GererDossier },
  { path: 'dicter-ordonnance', component: DicterOrdonnance },
  { path: 'dicter-compte-rendu', component: DicterCompteRendu },
  { path: 'voir-ordonnance/:id', component: VueOrdonnance },
  { path: 'voir-compte-rendu/:id', component: VueCompteRendu },

  // Shared (protected 🔒)
  { path: 'shared/file-attente', component: FileAttente, canActivate: [authGuard] },
  { path: 'shared/planning', component: Planning, canActivate: [authGuard] },
  { path: 'parametres', component: Parametres },
  { path: 'gerer-dossier/:id', component: GererDossier },

  // 👇 TABLETTES (AJOUTÉES ICI - AVANT LE FALLBACK)
  { path: 'tablette-checkin', component: TabletteCheckinComponent },
  { path: 'tablette-consultation', component: TabletteConsultationComponent },

  // Fallback (DOIT RESTER À LA FIN)
  { path: '**', redirectTo: 'login' },
];
