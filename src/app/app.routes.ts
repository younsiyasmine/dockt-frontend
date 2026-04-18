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

// Mehdi's pages
import { LoginComponent } from './pages/login/login';
import { LoginAdminComponent } from './pages/login-admin/login-admin';
import { RegisterComponent } from './pages/register/register';
import { PatientDashboard } from './pages/patient-dashboard/patient-dashboard';
import { MedecinDashboard } from './pages/medecin-dashboard/medecin-dashboard';
import { SecretaireDashboard } from './pages/secretaire-dashboard/secretaire-dashboard';
import { PatientsComponent } from './pages/patients/patients';

export const routes: Routes = [
  // Auth (public)
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'login-admin', component: LoginAdminComponent },
  { path: 'register', component: RegisterComponent },

  // Patient (protected 🔒)
  { path: 'patient-dashboard', component: PatientDashboard, canActivate: [AuthGuard] },
  { path: 'patient/dashboard', component: Dashboard, canActivate: [AuthGuard] },
  { path: 'patient/prendre-rdv', component: PrendreRdv, canActivate: [AuthGuard] },
  { path: 'patient/prendre-rdv/:id', component: PrendreRdv, canActivate: [AuthGuard] },
  { path: 'patient/mes-rendezvous', component: MesRendezvousComponent, canActivate: [AuthGuard] },
  { path: 'patient/ma-position', component: MaPosition, canActivate: [AuthGuard] },
  //MS3 with no security for now until connected with backend
  { path: 'patient/mes-ordonnances', component: MesOrdonnancesComponent },
  { path: 'patient/mes-compterendu', component: MesCompterenduComponent },

  // Médecin (protected 🔒)
  { path: 'medecin-dashboard', component: MedecinDashboard, canActivate: [AuthGuard] },
  { path: 'patients', component: PatientsComponent, canActivate: [AuthGuard] },
  { path: 'medecin/dossier/:id', component: GererDossier, canActivate: [AuthGuard] },
  { path: 'secretaire-dashboard', component: SecretaireDashboard, canActivate: [AuthGuard] },
  { path: 'mes-actes', component: ActeMedicaleComponent, canActivate: [AuthGuard] },
  { path: 'ajouter-rdv', component: AjouterRdv, canActivate: [AuthGuard] },
  { path: 'ajouter-rdv/:id', component: AjouterRdv, canActivate: [AuthGuard] },
  //MS3 with no security for now until connected with backend
  { path: 'dossier-patient', component: GererDossier },
  { path: 'dicter-ordonnance', component: DicterOrdonnance },
  { path: 'dicter-compte-rendu', component: DicterCompteRendu },
  { path: 'voir-ordonnance/:id', component: VueOrdonnance },
  { path: 'voir-compte-rendu/:id', component: VueCompteRendu },

  // Shared (protected 🔒)
  { path: 'shared/file-attente', component: FileAttente, canActivate: [AuthGuard] },
  { path: 'shared/planning', component: Planning, canActivate: [AuthGuard] },
  //MS3 with no security for now until connected with backend
  { path: 'gerer-dossier/:id', component: GererDossier },

  // Fallback
  { path: '**', redirectTo: 'login' },
];
