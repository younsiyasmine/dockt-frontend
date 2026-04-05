import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-vue-ordonnance',
  imports: [CommonModule],
  templateUrl: './vue-ordonnance.html',
  styleUrl: './vue-ordonnance.css',
})
export class VueOrdonnance {
  // L'émetteur pour le bouton retour vers le dossier
  @Output() retourDossier = new EventEmitter<void>();

  // La fonction qui crie "Je veux rentrer !"
  retour() {
    this.retourDossier.emit();
  }

  // 💡 BIENTÔT : Cette variable sera vide au départ.
  // Elle sera remplie dynamiquement via une requête HTTP vers votre Backend !
  ordonnance = {
    // Viendra de la table `medecin`
    medecin: {
      nom: 'Dr. Sophie Laurent',
      specialite: 'Médecin Généraliste',
      adresse_cabinet: '15 Avenue Mohammed VI, Oujda', // <-- Voici la vraie adresse dynamique !
      telephone: '05 36 00 00 00',
    },

    // Viendra de la table `patient`
    patient: {
      nom: 'Marie Dubois',
      age: '41 ans', // (Généralement calculé dynamiquement par le backend à partir de `date_naissance`)
    },

    // Viendra de la table `ordonnance`
    date_emmission: '03 Avril 2026',
    ville: 'Oujda',
    contenu_texte:
      'Paracétamol 1000mg : 1 comprimé matin, midi et soir pendant 5 jours.\n\nAmoxicilline 500mg : 1 gélule matin et soir pendant 6 jours.',
    identifiantUnique: 'ORD-2026-0403-A1', // Un ID généré pour la traçabilité
  };

  // Fonction pour lancer l'impression native du navigateur
  imprimerDoc() {
    window.print();
  }
}
