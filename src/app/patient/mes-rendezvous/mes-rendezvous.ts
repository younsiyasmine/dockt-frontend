import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Navbar } from '../navbar/navbar'; // Vérifie le chemin relatif vers ton composant navbar

// Interface basée sur la table SQL "rdv"
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
  // AJOUT du NavbarComponent dans les imports
  imports: [CommonModule, RouterModule, Navbar],
  templateUrl: './mes-rendezvous.html',
  styleUrl: './mes-rendezvous.css',
})
export class MesRendezvousComponent {
  // La variable isProfileMenuOpen peut être supprimée si la Navbar gère son propre état
  isProfileMenuOpen = false;

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

  // --- NOUVELLES MÉTHODES ---

  goBack(): void {
    window.history.back();
  }

  modifierRdv(rdv: RendezVous): void {
    console.log('Modifier le rendez-vous ID :', rdv.id_rdv);
    // Logique de redirection ou ouverture de formulaire
  }

  annulerRdv(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) {
      console.log('Annulation du rendez-vous ID :', id);
      // Logique pour appeler ton service Spring Boot
    }
  }

  // --- LOGIQUE EXISTANTE ---

  toggleProfileMenu() {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  getStatusClass(statut: string): string {
    switch (statut) {
      case 'Confirmé':
        return 'bg-[#2ecc71]'; // Vert
      case 'En attente':
        return 'bg-yellow-500'; // Orange
      case 'Annulé':
        return 'bg-red-400'; // Rouge
      default:
        return 'bg-[#1a3a5c]';
    }
  }
}
