import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';  // ← RouterLink et RouterLinkActive supprimés (jamais utilisés)
import { AuthService } from '../../services/auth';
import { NotificationService } from '../../services/notification.service';
import { PatientService } from '../../services/patient.service';  // ← chemin corrigé (1 niveau)
import { Sidebar } from '../sidebar/sidebar';

// Interface pour typer explicitement et éviter les 'any' implicites
interface PatientRow {
  id: number;
  nom: string;
  initiales: string;
  dateNaissance: string;
  telephone: string;
  email: string;
  sex: string;
}

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar],  // ← RouterLink, RouterLinkActive supprimés
  templateUrl: './patients.html',
  styleUrl: './patients.css'
})
export class PatientsComponent implements OnInit {

  user: any = null;
  unreadCount: number = 0;
  patients: PatientRow[] = [];
  allPatients: PatientRow[] = [];
  searchQuery: string = '';

  totalPatients: number = 0;
  totalHommes: number = 0;
  totalFemmes: number = 0;

  loading: boolean = false;
  menuOpen = false;
  notificationsOpen = false;

  constructor(
    private authService: AuthService,
    private notifService: NotificationService,
    private patientService: PatientService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getUser();
    this.loadNotifications();
    this.loadPatients();
  }

  toggleNotifications(): void {
    this.notificationsOpen = !this.notificationsOpen;
    this.menuOpen = false;
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
    this.notificationsOpen = false;
  }

  loadNotifications(): void {
    this.notifService.getUnreadCount().subscribe({
      next: (count: number) => this.unreadCount = count,
      error: () => this.unreadCount = 0
    });
  }

// REMPLACER la méthode loadPatients() par :
  loadPatients() {
    this.loading = true;
    this.patientService.getPatients().subscribe({
      next: (data: any[]) => {
        this.allPatients = data.map((p: any) => ({
          id: p.idPatient,
          nom: `${p.prenom ?? ''} ${p.nom ?? ''}`.trim(),
          initiales: ((p.prenom?.charAt(0) ?? '') + (p.nom?.charAt(0) ?? '')).toUpperCase(),
          dateNaissance: p.dateNaissance ?? '—',
          telephone: p.numTelephone?.toString() ?? '—',
          email: p.patientLogin ?? '—',
          // sex est un boolean en BDD : true=Homme, false=Femme
          sex: p.sex === true ? 'Homme' : p.sex === false ? 'Femme' : '—'
        }));
        this.patients = [...this.allPatients];
        this.calculerStats();
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Erreur chargement patients', err);
        this.loading = false;
      }
    });
  }

  calculerStats(): void {
    this.totalPatients = this.allPatients.length;
    this.totalHommes   = this.allPatients.filter(p => p.sex === 'Homme').length;
    this.totalFemmes   = this.allPatients.filter(p => p.sex === 'Femme').length;
  }

  onSearch(): void {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) {
      this.patients = [...this.allPatients];
      return;
    }
    this.patients = this.allPatients.filter(p =>
      p.nom.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.telephone?.toString().includes(q)
    );
  }

  voirDossier(idPatient: number): void {
    this.router.navigate(['/medecin/dossier', idPatient]);
  }
}
