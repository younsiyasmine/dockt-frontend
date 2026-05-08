import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { NgFor, NgClass, NgIf } from '@angular/common';
import { FileAttenteService } from '../../core/services/file-attente.service';
import { RDV, StatutConsultation } from '../../core/models/models';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { PatientResponse } from '../../core/models/auth.model';
import { Sidebar } from '../../pages/sidebar/sidebar';
import { Topbar } from '../../pages/topbar/topbar';
import { trigger, transition, style, animate } from '@angular/animations';

interface PatientAttente {
  id: number;
  idPatient: number;
  nom: string;
  heureArrivee: string;
  tempsAttente: string;
  tempsNegatif: boolean;
  statut: string;
  checkIn: boolean;
  leaving?: boolean;
  waitMinutes: number;
}

@Component({
  selector: 'app-file-attente',
  standalone: true,
  imports: [NgFor, NgClass, NgIf, Sidebar, Topbar],
  templateUrl: './file-attente.html',
  styleUrl: './file-attente.css',
  animations: [
    trigger('slideOut', [
      transition(':leave', [
        style({ opacity: 1, transform: 'translateY(0)', overflow: 'hidden' }),
        animate('400ms ease-in', style({
          opacity: 0,
          transform: 'translateY(-30px)',
          height: '0px',
          padding: '0px'
        }))
      ])
    ])
  ]
})
export class FileAttente implements OnInit, OnDestroy {

  patients: PatientAttente[] = [];
  private pollInterval: any;

  constructor(
    private fileAttenteService: FileAttenteService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.loadFile();

    // refresh every 30s
    this.pollInterval = setInterval(() => this.checkForUpdates(), 30000);
  }

  ngOnDestroy(): void {
    clearInterval(this.pollInterval);
  }

  // =========================
  // LOAD INITIAL DATA
  // =========================
  loadFile(): void {
    this.fileAttenteService.getFileDuJourAvecDetails().subscribe({
      next: (rdvs: RDV[]) => {

        this.patients = rdvs.map((rdv) => ({
          id: rdv.id!,
          idPatient: rdv.idPatient!,
          nom: rdv.patient
            ? `${rdv.patient.prenom} ${rdv.patient.nom}`
            : `Patient #${rdv.idPatient}`,
          heureArrivee: rdv.heurePrevue?.substring(0, 5) ?? '--:--',
          tempsAttente: 'Calcul...',
          tempsNegatif: false,
          statut: this.formatStatut(rdv.statutConsultation as string),
          checkIn: rdv.checkIn ?? false,
          leaving: false,
          waitMinutes: 0,
        }));

        this.cdr.detectChanges();

        rdvs.forEach((rdv, i) => {
          if (!rdv.patient && rdv.idPatient) {
            this.http
              .get<PatientResponse>(`http://localhost:8082/api/patients/${rdv.idPatient}`)
              .subscribe({
                next: (p) => {
                  this.patients[i].nom = `${p.prenom} ${p.nom}`;
                  this.cdr.detectChanges();
                }
              });
          }

          this.fetchAndStartCountdown(rdv.id!, i);
        });
      },
      error: (err) => console.error('Erreur chargement file attente:', err),
    });
  }

  // =========================
  // POLLING UPDATE
  // =========================
  checkForUpdates(): void {
    this.fileAttenteService.getFileDuJourAvecDetails().subscribe({
      next: (rdvs: RDV[]) => {

        const newIds = new Set(rdvs.map(r => r.id!));

        // remove finished patients
        this.patients.forEach(p => {
          if (!newIds.has(p.id) && !p.leaving) {
            p.leaving = true;

            setTimeout(() => {
              this.patients = this.patients.filter(x => x.id !== p.id);
              this.cdr.detectChanges();
            }, 400);
          }
        });

        // update existing patients
        rdvs.forEach(rdv => {
          const existing = this.patients.find(p => p.id === rdv.id);

          if (existing) {
            existing.statut = this.formatStatut(rdv.statutConsultation as string);
            existing.checkIn = rdv.checkIn ?? false;

            const index = this.patients.findIndex(p => p.id === rdv.id);
            if (index !== -1) {
              this.fetchAndStartCountdown(rdv.id!, index);
            }
          }
        });

        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erreur poll:', err),
    });
  }

  // =========================
  // BACKEND WAIT TIME ONLY
  // =========================
  fetchAndStartCountdown(rdvId: number, index: number): void {

    this.fileAttenteService.getWaitTime(rdvId).subscribe({
      next: (minutes: number) => {

        const patient = this.patients[index];
        if (!patient) return;

        patient.waitMinutes = minutes;
        patient.tempsAttente = this.formatTemps(minutes);
        patient.tempsNegatif = minutes <= 0;

        this.cdr.detectChanges();
      },
      error: () => {
        if (this.patients[index]) {
          this.patients[index].tempsAttente = '--';
        }
      },
    });
  }

  // =========================
  // FORMAT HELPERS
  // =========================
  formatTemps(minutes: number): string {
    if (minutes <= 0) return 'Immédiat';
    if (minutes < 60) return `${minutes} min`;

    const h = Math.floor(minutes / 60);
    const m = minutes % 60;

    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }

  formatStatut(statut: string | undefined): string {
    switch (statut) {
      case StatutConsultation.EN_ATTENTE: return 'En attente';
      case StatutConsultation.EN_CONSULTATION: return 'En consultation';
      case StatutConsultation.TERMINE: return 'Terminée';
      default: return 'En attente';
    }
  }

  // =========================
  // NAVIGATION
  // =========================
  voirDossier(patient: PatientAttente): void {
    this.router.navigate(['/gerer-dossier', patient.idPatient], {
      queryParams: { rdvId: patient.id, source: 'fileAttente' },
    });
  }

  trackById(index: number, patient: PatientAttente): number {
    return patient.id;
  }
}
