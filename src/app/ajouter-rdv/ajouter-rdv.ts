import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ajouter-rdv',
  imports: [CommonModule],
  templateUrl: './ajouter-rdv.html',
  styleUrl: './ajouter-rdv.css',
})
export class AjouterRdv implements OnInit {
  // --- 1. LOGIQUE DE L'HEURE (Inchangée) ---
  listeCreneaux: { heure: string; disponible: boolean }[] = [];

  // --- 2. LOGIQUE DU NOUVEAU CALENDRIER GÉANT ---
  afficherCalendrier = false;
  dateSelectionnee: string = ''; // Ce qui s'affichera dans la case

  moisNoms = [
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre',
  ];
  moisActuel = new Date().getMonth();
  anneeActuelle = new Date().getFullYear();

  joursCalendrier: number[] = [];
  joursVides: number[] = []; // Pour décaler le 1er jour du mois sous la bonne colonne

  ngOnInit() {
    this.genererCreneaux();
    this.genererJoursMois();
  }

  genererCreneaux() {
    const creneauxTemp = [];
    for (let h = 8; h <= 23; h++) {
      const heureStr = h < 10 ? '0' + h : h.toString();
      creneauxTemp.push({ heure: `${heureStr}:00`, disponible: true });
      creneauxTemp.push({ heure: `${heureStr}:30`, disponible: true });
    }
    creneauxTemp.push({ heure: '00:00', disponible: true });
    const creneauxDejaPris = ['09:30', '14:00', '16:30'];
    this.listeCreneaux = creneauxTemp.map((creneau) => ({
      ...creneau,
      disponible: !creneauxDejaPris.includes(creneau.heure),
    }));
  }

  // --- Fonctions du Calendrier ---
  toggleCalendrier() {
    this.afficherCalendrier = !this.afficherCalendrier;
  }

  genererJoursMois() {
    // Combien de jours dans ce mois ?
    const nbJours = new Date(this.anneeActuelle, this.moisActuel + 1, 0).getDate();
    this.joursCalendrier = Array.from({ length: nbJours }, (_, i) => i + 1);

    // Quel jour de la semaine tombe le 1er du mois ? (Pour l'alignement)
    let premierJour = new Date(this.anneeActuelle, this.moisActuel, 1).getDay();
    let decalage = premierJour === 0 ? 6 : premierJour - 1; // Ajustement pour commencer le Lundi
    this.joursVides = Array(decalage).fill(0);
  }

  changerMois(delta: number) {
    this.moisActuel += delta;
    if (this.moisActuel > 11) {
      this.moisActuel = 0;
      this.anneeActuelle++;
    } else if (this.moisActuel < 0) {
      this.moisActuel = 11;
      this.anneeActuelle--;
    }
    this.genererJoursMois();
  }

  choisirDate(jour: number) {
    // Formater joliment la date
    this.dateSelectionnee = `${jour} ${this.moisNoms[this.moisActuel]} ${this.anneeActuelle}`;
    this.afficherCalendrier = false; // On ferme le pop-up après avoir cliqué !
  }
}
