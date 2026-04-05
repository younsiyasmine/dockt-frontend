import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Nécessaire pour la zone de texte

@Component({
  selector: 'app-dicter-compte-rendu',
  imports: [CommonModule, FormsModule],
  templateUrl: './dicter-compte-rendu.html',
  styleUrl: './dicter-compte-rendu.css',
})
export class DicterCompteRendu {
  // Les émetteurs pour communiquer avec le Dossier Patient
  @Output() fermerModale = new EventEmitter<void>();

  // 👇 1. MODIFICATION ICI : On précise que l'émetteur enverra 'brouillon' ou 'valider'
  @Output() compteRenduValide = new EventEmitter<'brouillon' | 'valider'>();

  // Les variables d'état
  isRecording: boolean = false;
  texteCompteRendu: string = '';

  // Fonction pour simuler la dictée vocale de l'IA
  toggleMicrophone() {
    this.isRecording = !this.isRecording;

    if (this.isRecording) {
      // Simulation : L'IA "écoute" pendant 3 secondes puis écrit un rapport complet
      setTimeout(() => {
        if (this.isRecording) {
          const texteSimule =
            "Motif de consultation : Patiente se plaignant d'une fatigue générale depuis environ 2 semaines. Pas de fièvre signalée.\n\nExamen clinique : Tension artérielle mesurée à 12/8. L'auscultation cardio-pulmonaire est sans anomalie. Palpation abdominale souple et indolore.\n\nConclusion : Asthénie. Prescription d'un bilan sanguin complet et recommandation de repos.";

          // Ajoute le texte avec un double saut de ligne s'il y a déjà du texte
          this.texteCompteRendu += (this.texteCompteRendu ? '\n\n' : '') + texteSimule;
          this.isRecording = false;
        }
      }, 3000);
    }
  }

  // Vider la zone de texte
  effacerTexte() {
    this.texteCompteRendu = '';
  }

  // Bouton Annuler
  annuler() {
    this.fermerModale.emit();
  }

  // Le fameux bouton Brouillon !
  sauvegarderBrouillon() {
    console.log('Brouillon sauvegardé dans la base de données :', this.texteCompteRendu);
    // 👇 2. MODIFICATION ICI : On prévient le dossier que c'est un brouillon
    this.compteRenduValide.emit('brouillon');
  }

  // Bouton Valider
  valider() {
    // 👇 3. MODIFICATION ICI : On prévient le dossier que c'est une validation finale
    this.compteRenduValide.emit('valider');
  }
}
