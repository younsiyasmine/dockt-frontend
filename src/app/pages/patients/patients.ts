import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { NotificationService } from '../../core/services/notification.service';
import { PatientService } from '../../core/services/patient.service';  // ← chemin corrigé (1 niveau)
import { Sidebar } from '../sidebar/sidebar';
import { Topbar } from '../topbar/topbar';
import { ChangeDetectorRef } from '@angular/core';
import { AjouterPatientComponent } from '../ajouter-patient/ajouter-patient';

// Interface pour typer explicitement et éviter les 'any' implicites
interface PatientRow {
  id: number;
  nom: string;
  initiales: string;
  cin: string;
  dateNaissance: string;
  telephone: string;
  email: string;
  sex: string;
}

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, Topbar, AjouterPatientComponent], // ← RouterLink, RouterLinkActive supprimés
  templateUrl: './patients.html',
  styleUrl: './patients.css',
})
export class PatientsComponent implements OnInit {
  user: any = null;
  unreadCount: number = 0;
  patients: PatientRow[] = [];
  allPatients: PatientRow[] = [];
  searchQuery: string = '';
  filtreSexe: string = '';

  totalPatients: number = 0;
  totalHommes: number = 0;
  totalFemmes: number = 0;

  loading: boolean = false;
  showConfirmDelete = false;
  patientToDelete: number | null = null;
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  showModal = false;
  role: 'MEDECIN' | 'SECRETAIRE' | null = null;

  constructor(
    private authService: AuthService,
    private patientService: PatientService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const auth = JSON.parse(localStorage.getItem('user') || 'null');
    this.role = auth?.role ?? null;

    this.user = this.authService.getUser();
    this.loadPatients();
  }

  // REMPLACER la méthode loadPatients() par :
  loadPatients() {
    this.loading = true;
    this.patientService.getPatients().subscribe({
      next: (data: any[]) => {
        console.log('Patients data:', data);
        this.allPatients = data.map((p: any) => {
          // Fix phone: add leading 0 if numTelephone exists
          let telephone = '—';
          if (p.numTelephone !== null && p.numTelephone !== undefined && p.numTelephone !== '') {
            telephone = '0' + p.numTelephone.toString();
          }

          // Fix email: only show patientLogin if it looks like an email (contains @)
          let email = '—';
          if (p.patientLogin && p.patientLogin.includes('@')) {
            email = p.patientLogin;
          }

          return {
            id: p.idPatient,
            nom: `${p.prenom ?? ''} ${p.nom ?? ''}`.trim(),
            initiales: ((p.prenom?.charAt(0) ?? '') + (p.nom?.charAt(0) ?? '')).toUpperCase(),
            cin: p.cin ?? '—',
            dateNaissance: p.dateNaissance ?? '—',
            telephone,
            email,
            sex:
              p.sexe === true || p.sexe === 'true'
                ? 'Homme'
                : p.sexe === false || p.sexe === 'false'
                  ? 'Femme'
                  : '—',
          };
        });
        this.allPatients.sort((a, b) => a.id - b.id);
        this.patients = [...this.allPatients];
        this.calculerStats();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Erreur chargement patients', err);
        this.loading = false;
      },
    });
  }

  onPatientAdded(patient: any) {
    this.loadPatients(); // your existing method to reload the list

    // ✅ SHOW TOAST
    this.showToastMessage('Patient ajouté avec succès ✓');
    this.showModal = false;
  }

  calculerStats(): void {
    this.totalPatients = this.allPatients.length;
    this.totalHommes = this.allPatients.filter((p) => p.sex === 'Homme').length;
    this.totalFemmes = this.allPatients.filter((p) => p.sex === 'Femme').length;
  }

  onFiltreChange(): void {
    const q = this.searchQuery.toLowerCase().trim();
    this.patients = this.allPatients.filter((p) => {
      const matchSexe = this.filtreSexe === '' || p.sex === this.filtreSexe;
      const matchSearch =
        !q ||
        p.nom.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.telephone?.toString().includes(q);
      return matchSexe && matchSearch;
    });
  }

  onSearch(): void {
    const q = this.searchQuery.toLowerCase().trim();
    this.patients = this.allPatients.filter((p) => {
      const matchSexe = this.filtreSexe === '' || p.sex === this.filtreSexe;
      const matchSearch =
        !q ||
        p.nom.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.telephone?.toString().includes(q);
      return matchSexe && matchSearch;
    });
  }

  voirDossier(idPatient: number): void {
    this.router.navigate(['/gerer-dossier', idPatient], {
      queryParams: { source: 'listPatient' }
    });
  }

  supprimerPatient(id: number): void {
    this.patientToDelete = id;
    this.showConfirmDelete = true;
  }

  annulerSuppression(): void {
    this.showConfirmDelete = false;
    this.patientToDelete = null;
  }

  confirmerSuppression(): void {
    if (this.patientToDelete === null) return;
    this.patientService.deletePatient(this.patientToDelete).subscribe({
      next: () => {
        this.allPatients = this.allPatients.filter((p) => p.id !== this.patientToDelete);
        this.patients = this.patients.filter((p) => p.id !== this.patientToDelete);
        this.calculerStats();
        this.showConfirmDelete = false;
        this.patientToDelete = null;
        this.showToastMessage('Patient supprimé avec succès ✓');
      },
      error: (err: any) => {
        console.error('Erreur suppression patient', err);
        this.showConfirmDelete = false;
        this.showToastMessage('Erreur lors de la suppression ✗', 'error');
      },
    });
  }

  private showToastMessage(message: string, type: 'success' | 'error' = 'success'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.showToast = false;
      this.cdr.detectChanges();
    }, 3000);
  }
}
