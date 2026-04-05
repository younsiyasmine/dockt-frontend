import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DicterOrdonnance } from '../dicter-ordonnance/dicter-ordonnance';

// C'EST CETTE LIGNE QUI RÈGLE TOUT !
import { VueOrdonnance } from '../vue-ordonnance/vue-ordonnance';

// 👇 1. ON AJOUTE L'IMPORT DU COMPTE RENDU ICI
import { DicterCompteRendu } from '../dicter-compte-rendu/dicter-compte-rendu';

// 👇 2. NOUVEL IMPORT POUR L'APERÇU A4 DU COMPTE RENDU
import { VueCompteRendu } from '../vue-compte-rendu/vue-compte-rendu';

@Component({
  selector: 'app-gerer-dossier',
  // 👇 3. ON L'AJOUTE DANS LA LISTE ICI !
  imports: [CommonModule, DicterOrdonnance, VueOrdonnance, DicterCompteRendu, VueCompteRendu],
  templateUrl: './gerer-dossier.html',
  styleUrl: './gerer-dossier.css',
})
export class GererDossier {
  // --- GESTION DES ONGLETS ---
  ongletActif: string = 'infos';

  changerOnglet(onglet: string) {
    this.ongletActif = onglet;
  }

  // --- GESTION DE LA MODALE ORDONNANCE ---
  modaleOrdonnanceOuverte: boolean = false;

  ouvrirModaleOrdonnance() {
    this.modaleOrdonnanceOuverte = true;
  }

  fermerModaleOrdonnance() {
    this.modaleOrdonnanceOuverte = false;
  }

  // --- GESTION DE L'AFFICHAGE A4 (ORDONNANCE) ---
  afficherApercuA4: boolean = false;

  terminerEtAfficherOrdonnance() {
    this.modaleOrdonnanceOuverte = false; // On cache la modale
    this.afficherApercuA4 = true; // On affiche le papier A4
  }

  // --- GESTION DE LA MODALE COMPTE RENDU ---
  modaleCompteRenduOuverte: boolean = false;

  ouvrirModaleCompteRendu() {
    this.modaleCompteRenduOuverte = true;
  }

  fermerModaleCompteRendu() {
    this.modaleCompteRenduOuverte = false;
  }

  // 👇 LA FONCTION MISE À JOUR POUR OUVRIR LE A4 AUTOMATIQUEMENT
  terminerCompteRendu(action: 'brouillon' | 'valider') {
    this.modaleCompteRenduOuverte = false;

    if (action === 'valider') {
      // Au lieu de l'alerte, on ouvre la page A4 directement !
      this.afficherApercuCompteRenduA4 = true;
    } else {
      console.log('Brouillon sauvegardé !');
    }
  }

  // 👇 4. GESTION DE L'AFFICHAGE A4 (COMPTE RENDU)
  afficherApercuCompteRenduA4: boolean = false;

  ouvrirApercuCompteRendu() {
    this.afficherApercuCompteRenduA4 = true;
  }

  // --- VOS DONNÉES DE TEST ---
  patient = {
    nom: 'Dubois',
    prenom: 'Marie',
    cin: 'F123456',
    date_naissance: '12/05/1984',
    num_telephone: '06 36 00 00 00',
    sex: false,
    adresse: '15 Avenue Mohammed VI, Oujda',
    image_biometrique:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  };

  historiqueRdv = [
    {
      titre: 'Consultation de suivi',
      date_prevue: '15/03/2026',
      heure_prevue: '10:30',
      statut_consultation: 'terminé',
    },
    {
      titre: 'Bilan sanguin',
      date_prevue: '02/02/2026',
      heure_prevue: '09:00',
      statut_consultation: 'terminé',
    },
  ];

  ordonnances = [
    {
      type: 'Standard',
      date_emmission: '15/03/2026',
      contenu_texte: 'Paracétamol 1000mg, 1 boite.',
    },
  ];

  comptesRendus = [
    {
      id: 1,
      date_redaction: '03/04/2026',
      statut: 'Brouillon',
      contenu: 'Patiente vue ce jour pour... (à compléter)',
    },
    {
      id: 2,
      date_redaction: '15/03/2026',
      statut: 'Validé',
      contenu: 'Patiente présentant une légère fatigue. Prescription de bilan sanguin et repos.',
    },
  ];
}
