import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Navbar } from '../navbar/navbar';
import { FileAttenteService } from '../../core/services/file-attente.service';
import { RdvService } from '../../core/services/rdv.service';
import { RDV, StatutConsultation } from '../../core/models/models';
import { AuthService } from '../../core/services/auth';
import { NgFor, NgIf } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-ma-position',
  standalone: true,
  imports: [RouterLink, Navbar, NgFor, NgIf],
  templateUrl: './ma-position.html',
  styleUrl: './ma-position.css',
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
export class MaPosition implements OnInit, OnDestroy {
  private get idPatient(): number {
    return this.authService.getCurrentUserId() ?? 0;
  }

  fileAttente: RDV[] = [];
  monRdv: RDV | null = null;
  maPosition: number = 0;
  totalPatients: number = 0;
  tempsAttente: number = 0;
  isLoading = true;
  errorMessage = '';
  private pollInterval: any;

  constructor(
    private fileAttenteService: FileAttenteService,
    private rdvService: RdvService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.chargerDonnees();
    this.pollInterval = setInterval(() => this.chargerDonnees(), 30000);
  }

  ngOnDestroy(): void {
    clearInterval(this.pollInterval);
  }

  chargerDonnees(): void {
    this.isLoading = true;

    this.fileAttenteService.getFileDuJour().subscribe({
      next: (queue) => {
        // filter out TERMINE on client side as safety net
        this.fileAttente = queue.filter((r) => r.statutConsultation !== StatutConsultation.TERMINE);
        this.totalPatients = this.fileAttente.length;

        const monRdvDansFile = this.fileAttente.find((r) => r.idPatient === this.idPatient);

        if (monRdvDansFile) {
          this.monRdv = monRdvDansFile;
          this.maPosition = monRdvDansFile.position ?? 0;

          this.fileAttenteService.getWaitTime(monRdvDansFile.id!).subscribe({
            next: (temps) => {
              this.tempsAttente = temps;
              this.isLoading = false;
              this.cdr.detectChanges();
            },
            error: () => {
              this.isLoading = false;
              this.cdr.detectChanges();
            },
          });
        } else {
          this.rdvService.getRDVByPatient(this.idPatient).subscribe({
            next: (rdvs) => {
              const today = new Date().toISOString().split('T')[0];
              this.monRdv = rdvs.find((r) => r.datePrevue === today) ?? null;
              this.isLoading = false;
              this.cdr.detectChanges();
            },
            error: () => {
              this.isLoading = false;
              this.cdr.detectChanges();
            },
          });
        }
      },
      error: (err) => {
        console.error('Erreur file attente:', err);
        this.errorMessage = "Impossible de charger la file d'attente.";
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  formatTempsAttente(minutes: number): string {
    if (minutes <= 0) return "C'est votre tour !";
    if (minutes < 60) return `${minutes} min`;
    const heures = Math.floor(minutes / 60);
    const reste = minutes % 60;
    return reste === 0 ? `${heures}h` : `${heures}h ${reste}min`;
  }

  getStatutLabel(rdv: RDV): string {
    switch (rdv.statutConsultation) {
      case StatutConsultation.EN_CONSULTATION:
        return 'En consultation';
      case StatutConsultation.TERMINE:
        return 'Terminé';
      default:
        return 'En attente';
    }
  }

  getStatutColor(rdv: RDV): string {
    switch (rdv.statutConsultation) {
      case StatutConsultation.EN_CONSULTATION:
        return 'text-emerald-500';
      case StatutConsultation.TERMINE:
        return 'text-gray-400';
      default:
        return 'text-yellow-500';
    }
  }

  getBadgeColor(rdv: RDV): string {
    switch (rdv.statutConsultation) {
      case StatutConsultation.EN_CONSULTATION:
        return 'bg-emerald-500';
      case StatutConsultation.TERMINE:
        return 'bg-gray-300';
      default:
        return rdv.idPatient === this.idPatient ? 'bg-emerald-500' : 'bg-yellow-400';
    }
  }

  isMonTour(rdv: RDV): boolean {
    return rdv.idPatient === this.idPatient;
  }

  formatDate(date: string): string {
    if (!date) return '';
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  formatTime(time: string): string {
    if (!time) return '';
    return time.substring(0, 5);
  }
}
