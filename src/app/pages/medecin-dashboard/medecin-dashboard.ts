import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth';
import { Sidebar } from '../sidebar/sidebar';
import { Topbar } from '../topbar/topbar';

@Component({
  selector: 'app-medecin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, Sidebar, Topbar],
  templateUrl: './medecin-dashboard.html',
  styleUrl: './medecin-dashboard.css',
})
export class MedecinDashboard implements OnInit {
  today: Date = new Date();

  patientsEnAttente: number = 0;
  consultationsDuJour: number = 0;
  patientsActifs: number = 0;
  rdvDuJour: any[] = [];
  role: 'MEDECIN' | 'SECRETAIRE' | null = null;

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}

  joursSemaine = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  mois = [
    'janvier',
    'février',
    'mars',
    'avril',
    'mai',
    'juin',
    'juillet',
    'août',
    'septembre',
    'octobre',
    'novembre',
    'décembre',
  ];

  get dateFormatee(): string {
    const d = new Date();
    return `${this.joursSemaine[d.getDay()]} ${d.getDate()} ${this.mois[d.getMonth()]} ${d.getFullYear()}`;
  }

  ngOnInit() {
    const auth = JSON.parse(localStorage.getItem('user') || 'null');
    this.role = auth?.role ?? null;
    this.loadStats();
  }

  loadStats() {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Patients en attente + Consultations du jour (single call)
    this.http.get<any[]>('http://localhost:8081/api/file-attente/today').subscribe({
      next: (data) => {
        this.patientsEnAttente = data.filter(rdv =>
          rdv.checkIn === true && rdv.statutConsultation === 'EN_ATTENTE'
        ).length;
        this.consultationsDuJour = data.filter(rdv =>
          rdv.statutRdv !== 'ANNULE'
        ).length;
        this.cdr.detectChanges();
      },
      error: () => {},
    });

    // Patients actifs
    this.http.get<any[]>('http://localhost:8082/api/patients').subscribe({
      next: (data) => {
        this.patientsActifs = data.length;
        this.cdr.detectChanges();
      },
      error: () => {},
    });

    // RDV du jour
    this.http.get<any[]>(`http://localhost:8081/api/rdv`).subscribe({
      next: (data) => {
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        this.rdvDuJour = data
          .filter(rdv => rdv.datePrevue === dateStr && rdv.statutRdv !== 'ANNULE')
          .sort((a, b) => a.heurePrevue.localeCompare(b.heurePrevue))
          .slice(0, 5)
          .map(rdv => ({
            ...rdv,
            statutAffiche: this.getStatutConsultation(rdv, currentTime)
          }));
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  getStatutConsultation(rdv: any, currentTime: string): { label: string; class: string } {
    if (rdv.statutConsultation === 'TERMINE')
      return { label: 'Terminé', class: 'bg-green-100 text-green-600' };
    if (rdv.statutConsultation === 'EN_CONSULTATION')
      return { label: 'En cours', class: 'bg-blue-100 text-blue-600' };
    if (rdv.statutConsultation === 'EN_ATTENTE')
      return { label: 'En attente', class: 'bg-yellow-100 text-yellow-600' };

    // statutConsultation is null — use time to guess
    const heure = rdv.heurePrevue?.substring(0, 5);
    if (heure && heure < currentTime)
      return { label: 'Terminé', class: 'bg-green-300 text-gray-500' };

    return { label: 'À venir', class: 'bg-yellow-300 text-slate-500' };
  }

}
