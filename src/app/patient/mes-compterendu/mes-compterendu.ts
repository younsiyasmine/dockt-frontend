import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../navbar/navbar';
import { CompteRenduService } from '../../core/services/compte-rendu.service';
import { RdvService } from '../../core/services/rdv.service';
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
    private cdr: ChangeDetectorRef,
    private router: Router        // ← ADD
  ) {}

  ngOnInit(): void {
    const idRdv = 1;
    this.loadCompteRendus(idRdv);
    this.loadRendezVous();
  }

  loadCompteRendus(idRdv: number): void {
    this.isLoading = true;
    this.compteRenduService.getComptesRendusParRdv(idRdv).subscribe({
      next: (data) => {
        this.compteRendusList = data;
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

  loadRendezVous(): void {
    const patientId = 1;
    this.rdvService.getRDVByPatient(patientId).subscribe({
      next: (data) => {
        this.rendezVousList = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement RDVs:', err);
      },
    });
  }

  envoyerDemande(): void {
    if (!this.demandeRdvId) return;
    const demande: CompteRendu = {
      idRdv: Number(this.demandeRdvId),
      contenu: '',
      messagePatient: this.demandeMessage,
    };
    this.compteRenduService.demanderCompteRendu(demande).subscribe({
      next: (data) => {
        this.compteRendusList.push(data);
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
      case 'VALIDE':    return 'bg-green-100 text-green-700';
      case 'EN_ATTENTE': return 'bg-orange-100 text-orange-700';
      case 'DEMANDE':   return 'bg-blue-100 text-blue-700';
      default:          return 'bg-gray-100 text-gray-700';
    }
  }

  // ← ADD: human-readable labels
  getStatusLabel(statut: string): string {
    switch (statut) {
      case 'VALIDE':    return 'Validé';
      case 'EN_ATTENTE': return 'En attente';
      case 'DEMANDE':   return 'Demandé';
      default:          return statut;
    }
  }

  viewReport(cr: CompteRendu): void {
    this.router.navigate(['/voir-compte-rendu', cr.idCr]);   // ← FIX
  }

  downloadPDF(cr: CompteRendu): void {
    this.router.navigate(['/voir-compte-rendu', cr.idCr]);   // ← same as voir for now
  }
}
