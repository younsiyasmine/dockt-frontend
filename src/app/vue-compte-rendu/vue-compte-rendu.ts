import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-vue-compte-rendu',
  imports: [CommonModule],
  templateUrl: './vue-compte-rendu.html',
  styleUrl: './vue-compte-rendu.css',
})
export class VueCompteRendu {
  @Output() retourDossier = new EventEmitter<void>();

  // 💡 Plus tard, ces données viendront du Backend quand on cliquera sur un compte rendu spécifique
  compteRendu = {
    medecin: {
      nom: 'Dr. Sophie Laurent',
      specialite: 'Médecin Généraliste',
      adresse_cabinet: '15 Avenue Mohammed VI, Oujda',
      telephone: '05 36 00 00 00',
      email: 'contact@cabinet-laurent.ma',
    },
    patient: {
      nom: 'Marie Dubois',
      date_naissance: '12 Mai 1984 (41 ans)',
      sexe: 'Féminin',
    },
    document: {
      date_redaction: '15 Mars 2026',
      ville: 'Oujda',
      identifiant: 'CR-2026-0315-X9',
      // Le texte avec des sauts de ligne réels
      contenu_texte:
        "Motif de consultation :\nPatiente se plaignant d'une fatigue générale depuis environ 2 semaines. Pas de fièvre signalée, pas de perte de poids, appétit conservé. Sommeil décrit comme non réparateur.\n\nExamen clinique :\nTension artérielle mesurée à 12/8. Fréquence cardiaque à 72 bpm. \nL'auscultation cardio-pulmonaire est sans anomalie. Palpation abdominale souple et indolore. Pas d'adénopathie palpable.\n\nConclusion et Conduite à tenir :\nAsthénie d'origine à déterminer. \nPrescription d'un bilan sanguin complet (NFS, Fer sérique, TSH, Glycémie à jeun) pour écarter une anémie ou un trouble thyroïdien.\nRecommandation de repos et réévaluation avec les résultats d'analyses.",
    },
  };

  retour() {
    this.retourDossier.emit();
  }

  imprimerDoc() {
    window.print();
  }
}
