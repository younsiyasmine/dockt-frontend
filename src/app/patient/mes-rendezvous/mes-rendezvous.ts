import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router'; // 1. Added Router import
import { Navbar } from '../navbar/navbar';

export interface RendezVous {
  id_rdv: number;
  date_prevue: string;
  heure_prevue: string;
  statut: string;
  medecin?: string;
}

@Component({
  selector: 'app-mes-rendezvous',
  standalone: true,
  imports: [CommonModule, RouterModule, Navbar],
  templateUrl: './mes-rendezvous.html',
  styleUrl: './mes-rendezvous.css',
})
export class MesRendezvousComponent {
  // --- UI State ---
  isProfileMenuOpen = false;
  showCancelModal = false;
  selectedRdv: RendezVous | null = null;

  // 2. Inject Router in the constructor
  constructor(private router: Router) {}

  rendezVousList: RendezVous[] = [
    {
      id_rdv: 1,
      date_prevue: '15 Février 2026',
      heure_prevue: '10:00',
      medecin: 'Dr. Amina Benali',
      statut: 'Confirmé',
    },
    {
      id_rdv: 2,
      date_prevue: '20 Mars 2026',
      heure_prevue: '14:30',
      medecin: 'Dr. Karim Tazi',
      statut: 'En attente',
    },
  ];

  goBack(): void {
    window.history.back();
  }

  // 3. Updated this function to navigate to the route we created
  modifierRdv(rdv: RendezVous): void {
    console.log('Redirection vers modification pour ID :', rdv.id_rdv);

    // Navigates to /patient/prendre-rdv/1 or /patient/prendre-rdv/2
    this.router.navigate(['/patient/prendre-rdv', rdv.id_rdv]);
  }

  // --- MODAL LOGIC (KEEPING YOUR WORK) ---

  openCancelModal(rdv: RendezVous): void {
    this.selectedRdv = rdv;
    this.showCancelModal = true;
  }

  confirmCancel(): void {
    if (this.selectedRdv) {
      console.log('Annulation confirmée pour le RDV ID :', this.selectedRdv.id_rdv);
      this.showCancelModal = false;
      this.selectedRdv = null;
    }
  }

  toggleProfileMenu() {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  getStatusClass(statut: string): string {
    switch (statut) {
      case 'Confirmé':
        return 'bg-[#2ecc71]';
      case 'En attente':
        return 'bg-yellow-500';
      case 'Annulé':
        return 'bg-red-400';
      default:
        return 'bg-[#1a3a5c]';
    }
  }
}
