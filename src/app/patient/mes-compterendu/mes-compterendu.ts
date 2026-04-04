import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../navbar/navbar'; // Ensure this path is correct based on your folder structure

export interface CompteRendu {
  id_cr: number;
  date_redaction: string;
  contenu: string;
  statut: string;
  medecin?: string;
}

@Component({
  selector: 'app-mes-compterendu',
  standalone: true,
  // ADD NavbarComponent HERE
  imports: [CommonModule, RouterModule, Navbar, FormsModule],
  templateUrl: './mes-compterendu.html',
  styleUrl: './mes-compterendu.css',
})
export class MesCompterenduComponent {
  // Logic for the profile menu can be removed if it's now inside the NavbarComponent
  isProfileMenuOpen = false;

  compteRendusList: CompteRendu[] = [
    {
      id_cr: 1,
      date_redaction: '15 Février 2026',
      contenu: 'Examen de routine - Analyse de la vision et pression oculaire.',
      statut: 'Validé',
      medecin: 'Dr. Amina Benali',
    },
    {
      id_cr: 2,
      date_redaction: '10 Janvier 2026',
      contenu: 'Suivi post-opératoire - État de la rétine stable.',
      statut: 'En attente',
      medecin: 'Dr. Karim Tazi',
    },
  ];

  // --- NEW METHODS TO FIX THE ERRORS ---

  goBack(): void {
    window.history.back();
  }

  viewReport(cr: CompteRendu): void {
    console.log('Viewing report details:', cr);
    // Logic to open a modal or navigate to detail page goes here
  }

  downloadPDF(cr: CompteRendu): void {
    console.log('Generating PDF for report ID:', cr.id_cr);
    // Logic to call your PDF service goes here
  }

  // --- EXISTING METHODS ---

  getStatusClass(statut: string): string {
    switch (statut) {
      case 'Validé':
        return 'bg-green-100 text-green-700';
      case 'En attente':
        return 'bg-orange-100 text-orange-700';
      case 'Annulé':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }

  showDemandeModal = false;
  demandeRdvId = '';
  demandeMessage = '';

  // mock RDV list - replace with API later
  rendezVousList = [
    {
      id_rdv: 1,
      date_prevue: '15 Février 2026',
      heure_prevue: '10:00',
      medecin: 'Dr. Amina Benali',
    },
    { id_rdv: 2, date_prevue: '10 Janvier 2026', heure_prevue: '09:30', medecin: 'Dr. Karim Tazi' },
  ];

  envoyerDemande() {
    if (!this.demandeRdvId) return;
    console.log('Demande CR pour RDV:', this.demandeRdvId, 'Message:', this.demandeMessage);
    // API call later
    this.showDemandeModal = false;
    this.demandeRdvId = '';
    this.demandeMessage = '';
  }
}
