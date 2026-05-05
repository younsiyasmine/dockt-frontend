import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../navbar/navbar';
import { CompteRenduService } from '../../core/services/compte-rendu.service';
import { RdvService } from '../../core/services/rdv.service';
import { AuthService } from '../../core/services/auth';
import { CompteRendu, RDV } from '../../core/models/models';

@Component({
  selector: 'app-mes-compterendu',
  standalone: true,
  imports: [CommonModule, RouterModule, Navbar, FormsModule],
  templateUrl: './mes-compterendu.html',
  styleUrl: './mes-compterendu.css',
})
export class MesCompterenduComponent implements OnInit {
  compteRendusList: CompteRendu[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';

  showDemandeModal = false;
  demandeRdvId = '';
  demandeMessage = '';
  rendezVousList: RDV[] = [];

  constructor(
    private compteRenduService: CompteRenduService,
    private rdvService: RdvService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const patientId = this.authService.getCurrentUserId();

    if (!patientId) {
      this.errorMessage = 'Session expirée. Veuillez vous reconnecter.';
      this.isLoading = false;
      return;
    }

    this.loadCompteRendus(patientId);
    this.loadRendezVous(patientId);
  }

  loadCompteRendus(patientId: number): void {
    this.isLoading = true;
    this.compteRenduService.getComptesRendusParPatient(patientId).subscribe({
      next: (data) => {
        this.compteRendusList = this.sortCompteRendus(data);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement comptes rendus:', err);
        this.errorMessage = 'Impossible de charger les comptes rendus.';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private sortCompteRendus(list: CompteRendu[]): CompteRendu[] {
    const order: Record<string, number> = { 'DEMANDE': 0, 'EN_ATTENTE': 1, 'VALIDE': 2 };

    return list.sort((a, b) => {
      const statusDiff = (order[a.statut || ''] ?? 99) - (order[b.statut || ''] ?? 99);
      if (statusDiff !== 0) return statusDiff;

      // Both VALIDE → newest first
      if (a.statut === 'VALIDE' && b.statut === 'VALIDE') {
        return new Date(b.dateRedaction || '').getTime() - new Date(a.dateRedaction || '').getTime();
      }

      return 0;
    });
  }

  loadRendezVous(patientId: number): void {
    this.rdvService.getRDVByPatient(patientId).subscribe({
      next: (data) => {
        this.rendezVousList = data
          .filter(rdv => rdv.statutRdv === 'PASSE')
          .sort((a, b) => {
            const dateA = new Date(a.datePrevue + 'T' + a.heurePrevue);
            const dateB = new Date(b.datePrevue + 'T' + b.heurePrevue);
            return dateA.getTime() - dateB.getTime(); // oldest first
          });
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement RDVs:', err);
      },
    });
  }

  rdvDejaDemande(rdvId: number | undefined): boolean {
    if (!rdvId) return false;
    return this.compteRendusList.some((cr) => cr.idRdv === rdvId);
  }

  envoyerDemande(): void {
    if (!this.demandeRdvId) return;

    const rdvIdNum = Number(this.demandeRdvId);

    const demande: CompteRendu = {
      idRdv: rdvIdNum,
      contenu: '',
      messagePatient: this.demandeMessage,
    };

    this.compteRenduService.demanderCompteRendu(demande).subscribe({
      next: (data) => {
        this.compteRendusList = this.sortCompteRendus([...this.compteRendusList, data]);
        this.showDemandeModal = false;
        this.demandeRdvId = '';
        this.demandeMessage = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur envoi demande:', err);
      },
    });
  }

  getStatusClass(statut: string): string {
    switch (statut) {
      case 'VALIDE':     return 'bg-green-100 text-green-700';
      case 'EN_ATTENTE': return 'bg-orange-100 text-orange-700';
      case 'DEMANDE':    return 'bg-blue-100 text-blue-700';
      default:           return 'bg-gray-100 text-gray-700';
    }
  }

  getStatusLabel(statut: string): string {
    switch (statut) {
      case 'VALIDE':     return 'Validé';
      case 'EN_ATTENTE': return 'En attente';
      case 'DEMANDE':    return 'Demandé';
      default:           return statut;
    }
  }

  viewReport(cr: CompteRendu): void {
    this.router.navigate(['/voir-compte-rendu', cr.idCr]);
  }

  downloadPDF(cr: CompteRendu): void {
    this.router.navigate(['/voir-compte-rendu', cr.idCr]);
  }
}
