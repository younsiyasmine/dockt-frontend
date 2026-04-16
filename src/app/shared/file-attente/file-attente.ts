import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgFor, NgClass, NgIf } from '@angular/common';
import { FileAttenteService } from '../../core/services/file-attente.service';
import { RDV, StatutConsultation } from '../../core/models';
import { Router } from '@angular/router';

interface PatientAttente {
  id: number;
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
  imports: [NgFor, NgClass, NgIf],
  templateUrl: './file-attente.html',
  styleUrl: './file-attente.css',
})
export class FileAttente implements OnInit {
  patients: PatientAttente[] = [];

  constructor(
    private fileAttenteService: FileAttenteService,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadFile();
  }

  loadFile(): void {
    this.fileAttenteService.getFileDuJourAvecDetails().subscribe({
      next: (rdvs: RDV[]) => {
        this.patients = rdvs.map((rdv) => ({
          id: rdv.id!,
          nom: rdv.patient
            ? `${rdv.patient.prenom} ${rdv.patient.nom}`
            : `Patient #${rdv.idPatient}`,
          heureArrivee: rdv.heurePrevue?.substring(0, 5) ?? '--:--',
          tempsAttente: 'Calcul...', // will be updated below
          tempsNegatif: false,
          statut: this.formatStatut(rdv.statutConsultation as string),
          checkIn: rdv.checkIn ?? false,
        }));

        this.cdr.detectChanges();

        // Load wait time for each RDV
        rdvs.forEach((rdv, i) => {
          this.fileAttenteService.getWaitTime(rdv.id!).subscribe({
            next: (minutes: number) => {
              this.patients[i].tempsAttente = minutes > 0 ? `${minutes} min` : 'Immédiat';
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
      case StatutConsultation.EN_ATTENTE:
        return 'En attente';
      case StatutConsultation.EN_CONSULTATION:
        return 'En consultation';
      case StatutConsultation.TERMINEE:
        return 'Terminée';
      default:
        return 'En attente';
    }
  }

  voirDossier(patient: PatientAttente) {
    this.router.navigate(['/gerer-dossier', patient.id]);
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
