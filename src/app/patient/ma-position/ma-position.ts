import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Navbar } from '../navbar/navbar';
import { FileAttenteService } from '../../core/services/file-attente.service';
import { RdvService } from '../../core/services/rdv.service';
import { RDV, StatutConsultation } from '../../core/models/models';

@Component({
  selector: 'app-ma-position',
  standalone: true,
  imports: [RouterLink, Navbar],
  templateUrl: './ma-position.html',
  styleUrl: './ma-position.css',
})
export class MaPosition implements OnInit {

  // ⚠️ Replace with real auth later
  private idPatient = 5;

  fileAttente: RDV[] = [];      // full queue today
  monRdv: RDV | null = null;    // patient's RDV today
  maPosition: number = 0;
  totalPatients: number = 0;
  tempsAttente: number = 0;
  isLoading = true;
  errorMessage = '';

  constructor(
    private fileAttenteService: FileAttenteService,
    private rdvService: RdvService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.chargerDonnees();
  }

  chargerDonnees(): void {
    this.isLoading = true;

    // 1. Load today's full queue
    this.fileAttenteService.getFileDuJour().subscribe({
      next: (queue) => {
        this.fileAttente = queue;
        this.totalPatients = queue.length;

        // 2. Find this patient's RDV in the queue
        const monRdvDansFile = queue.find(r => r.idPatient === this.idPatient);

        if (monRdvDansFile) {
          this.monRdv = monRdvDansFile;
          this.maPosition = monRdvDansFile.position ?? 0;

          // 3. Load estimated wait time
          this.fileAttenteService.getWaitTime(monRdvDansFile.id!).subscribe({
            next: (temps) => {
              this.tempsAttente = temps;
              this.isLoading = false;
              this.cdr.detectChanges();
            },
            error: () => {
              this.isLoading = false;
              this.cdr.detectChanges();
            }
          });
        } else {
          // Patient has no RDV today — load from rdv service as fallback
          this.rdvService.getRDVByPatient(this.idPatient).subscribe({
            next: (rdvs) => {
              const today = new Date().toISOString().split('T')[0];
              this.monRdv = rdvs.find(r => r.datePrevue === today) ?? null;
              this.isLoading = false;
              this.cdr.detectChanges();
            },
            error: () => {
              this.isLoading = false;
              this.cdr.detectChanges();
            }
          });
        }
      },
      error: (err) => {
        console.error('Erreur file attente:', err);
        this.errorMessage = 'Impossible de charger la file d\'attente.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  formatTempsAttente(minutes: number): string {
    if (minutes < 60) return `${minutes} min`;
    const heures = Math.floor(minutes / 60);
    const reste = minutes % 60;
    return reste === 0 ? `${heures}h` : `${heures}h ${reste}min`;
  }

  getStatutLabel(rdv: RDV): string {
    switch (rdv.statutConsultation) {
      case StatutConsultation.EN_CONSULTATION: return 'En consultation';
      case StatutConsultation.TERMINEE: return 'Terminé';
      default: return 'En attente';
    }
  }

  getStatutColor(rdv: RDV): string {
    switch (rdv.statutConsultation) {
      case StatutConsultation.EN_CONSULTATION: return 'text-emerald-500';
      case StatutConsultation.TERMINEE: return 'text-gray-400';
      default: return 'text-yellow-500';
    }
  }

  getBadgeColor(rdv: RDV): string {
    switch (rdv.statutConsultation) {
      case StatutConsultation.EN_CONSULTATION: return 'bg-emerald-500';
      case StatutConsultation.TERMINEE: return 'bg-gray-300';
      default: return rdv.idPatient === this.idPatient ? 'bg-emerald-500' : 'bg-yellow-400';
    }
  }

  isMonTour(rdv: RDV): boolean {
    return rdv.idPatient === this.idPatient;
  }

  formatDate(date: string): string {
    if (!date) return '';
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  formatTime(time: string): string {
    if (!time) return '';
    return time.substring(0, 5);
  }
}
