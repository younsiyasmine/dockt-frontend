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
        animate('400ms ease-in', style({
          opacity: 0,
          transform: 'translateY(-20px)',
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
    this.pollInterval = setInterval(() => this.loadFile(), 30000);
  }

  ngOnDestroy(): void {
    clearInterval(this.pollInterval);
  }

  formatTemps(minutes: number): string {
    if (minutes <= 0) return 'Immédiat';
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }

  loadFile(): void {
    this.fileAttenteService.getFileDuJourAvecDetails().subscribe({
      next: (rdvs: RDV[]) => {
        console.log('RDVs:', rdvs.map((r) => ({ id: r.id, statutConsultation: r.statutConsultation })));

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
        }));

        this.cdr.detectChanges();

        rdvs.forEach((rdv, i) => {
          // Fetch missing patient name from MS1
          if (!rdv.patient && rdv.idPatient) {
            this.http
              .get<PatientResponse>(`http://localhost:8082/api/patients/${rdv.idPatient}`)
              .subscribe({
                next: (p) => {
                  this.patients[i].nom = `${p.prenom} ${p.nom}`;
                  this.cdr.detectChanges();
                },
                error: () => {},
              });
          }

          // Fetch wait time
          this.fileAttenteService.getWaitTime(rdv.id!).subscribe({
            next: (minutes: number) => {
              this.patients[i].tempsAttente = this.formatTemps(minutes);
              this.patients[i].tempsNegatif = minutes <= 0;
              this.cdr.detectChanges();
            },
            error: () => {
              this.patients[i].tempsAttente = '--';
            },
          });
        });
      },
      error: (err) => console.error('Erreur chargement file attente:', err),
    });
  }

  formatStatut(statut: string | undefined): string {
    switch (statut) {
      case StatutConsultation.EN_ATTENTE: return 'En attente';
      case StatutConsultation.EN_CONSULTATION: return 'En consultation';
      case StatutConsultation.TERMINE: return 'Terminée';
      default: return 'En attente';
    }
  }

  voirDossier(patient: PatientAttente) {
    this.router.navigate(['/gerer-dossier', patient.idPatient], {
      queryParams: { rdvId: patient.id, source: 'fileAttente' },
    });
  }

  toggleCheckIn(patient: PatientAttente): void {
    this.fileAttenteService.checkIn(patient.id).subscribe({
      next: () => {
        patient.checkIn = true;
        patient.statut = 'En attente';
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erreur check-in:', err),
    });
  }
}
