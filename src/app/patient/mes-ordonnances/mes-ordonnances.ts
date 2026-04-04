import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Navbar } from '../navbar/navbar'; // Vérifie bien ce chemin selon ton arborescence

// Interface calquée sur votre table SQL "ordonnance"
export interface Ordonnance {
  id_ordonnance: number;
  date_emmission: string;
  contenu_texte: string;
  id_rdv?: number;
  medecin?: string;
}

@Component({
  selector: 'app-mes-ordonnances',
  standalone: true,
  // AJOUT de NavbarComponent ici
  imports: [CommonModule, RouterModule, Navbar],
  templateUrl: './mes-ordonnances.html',
  styleUrl: './mes-ordonnances.css',
})
export class MesOrdonnancesComponent {
  // Cette variable peut être supprimée si la gestion du menu est 100% dans la Navbar
  isProfileMenuOpen: boolean = false;

  ordonnancesList: Ordonnance[] = [
    {
      id_ordonnance: 1,
      date_emmission: '12 Janvier 2026',
      contenu_texte: 'Collyre antibiotique - 1 goutte 3 fois par jour pendant 7 jours.',
      medecin: 'Dr. Benali',
    },
    {
      id_ordonnance: 2,
      date_emmission: '05 Décembre 2025',
      contenu_texte: 'Latanoprost - 1 goutte le soir dans chaque œil.',
      medecin: 'Dr. Alaoui',
    },
  ];

  // --- NOUVELLES MÉTHODES ---

  goBack(): void {
    window.history.back();
  }

  viewOrdonnance(ord: Ordonnance): void {
    console.log('Affichage de l’ordonnance :', ord);
    // Logique pour ouvrir un modal ou naviguer vers un détail
  }

  downloadPDF(ord: Ordonnance): void {
    console.log('Téléchargement du PDF pour l’ID :', ord.id_ordonnance);
    // Appel vers ton service de génération PDF
  }

  // --- MÉTHODES EXISTANTES ---

  toggleProfileMenu(): void {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }
}
