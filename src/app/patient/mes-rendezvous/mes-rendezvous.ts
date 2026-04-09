import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { Navbar } from '../navbar/navbar';
import { RdvService } from '../../core/services/rdv.service';
import { RDV, StatutRDV } from '../../core/models';

@Component({
  selector: 'app-mes-rendezvous',
  standalone: true,
  imports: [RouterModule, Navbar, CommonModule],
  templateUrl: './mes-rendezvous.html',
  styleUrl: './mes-rendezvous.css',
})
export class MesRendezvousComponent implements OnInit {
  showCancelModal = false;
  selectedRdv: RDV | null = null;
  isLoading = false;
  errorMessage = '';
  rendezVousList: RDV[] = [];
  private idPatient = 2;
  showToast = false;
  toastMessage = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private rdvService: RdvService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.chargerMesRdv();

    this.route.queryParams.subscribe((params) => {
      console.log('Query params:', params);
      if (params['success']) {
        this.toastMessage = params['success'];
        this.showToast = true;
        setTimeout(() => {
          this.showToast = false;
          this.cdr.detectChanges();
        }, 3000);
      }
    });
  }

  chargerMesRdv(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.rdvService.getRDVByPatient(this.idPatient).subscribe({
      next: (data) => {
        this.rendezVousList = data.reverse();
        this.isLoading = false;
        this.cdr.detectChanges(); // ← forces Angular to re-render
      },
      error: (err) => {
        console.error('Erreur chargement RDV :', err);
        this.errorMessage = 'Impossible de charger vos rendez-vous.';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  modifierRdv(rdv: RDV): void {
    this.router.navigate(['/patient/prendre-rdv', rdv.id]);
  }

  openCancelModal(rdv: RDV): void {
    const demain = new Date();
    demain.setDate(demain.getDate() + 1);
    demain.setHours(0, 0, 0, 0);

    const dateRdv = new Date(rdv.datePrevue);
    dateRdv.setHours(0, 0, 0, 0);

    if (dateRdv <= demain) {
      this.errorMessage = 'Annulation impossible : le rendez-vous est dans moins de 24 heures.';
      return; // ← don't open modal, show message instead
    }

    this.selectedRdv = rdv;
    this.showCancelModal = true;
  }

  confirmCancel(): void {
    if (!this.selectedRdv?.id) return;

    this.rdvService.mettreAJourStatut(this.selectedRdv.id, StatutRDV.ANNULE).subscribe({
      next: () => {
        this.rendezVousList = this.rendezVousList.map((r) =>
          r.id === this.selectedRdv!.id ? { ...r, statutRdv: StatutRDV.ANNULE } : r,
        );
        this.showCancelModal = false;
        this.selectedRdv = null;
        this.toastMessage = 'Rendez-vous annulé avec succès !'; // ← ADD
        this.showToast = true; // ← ADD
        setTimeout(() => {
          this.showToast = false;
          this.cdr.detectChanges();
        }, 3000);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur annulation RDV :', err);
        this.errorMessage = "Erreur lors de l'annulation.";
        this.showCancelModal = false;
        this.cdr.detectChanges();
      },
    });
  }

  getStatusClass(statut: string | undefined): string {
    switch (statut) {
      case StatutRDV.CONFIRME:
        return 'bg-[#2ecc71]';
      case StatutRDV.ANNULE:
        return 'bg-red-400';
      case StatutRDV.MODIFIE_CONFIRME:
        return 'bg-blue-400';
      case StatutRDV.PASSE:
        return 'bg-yellow-500';
      default:
        return 'bg-gray-400';
    }
  }

  getStatusLabel(statut: string | undefined): string {
    switch (statut) {
      case StatutRDV.CONFIRME:
        return 'Confirmé';
      case StatutRDV.ANNULE:
        return 'Annulé';
      case StatutRDV.MODIFIE_CONFIRME:
        return 'Modifié';
      case StatutRDV.PASSE:
        return 'Passé';
      default:
        return 'En attente';
    }
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
