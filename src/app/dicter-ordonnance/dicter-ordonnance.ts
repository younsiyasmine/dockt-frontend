import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dicter-ordonnance',
  imports: [CommonModule, FormsModule],
  templateUrl: './dicter-ordonnance.html',
  styleUrl: './dicter-ordonnance.css',
})
export class DicterOrdonnance {
  // 1. L'émetteur pour ANNULER
  @Output() fermerModale = new EventEmitter<void>();

  // 2. L'émetteur pour VALIDER (NOUVEAU ! 🚀)
  @Output() ordonnanceValidee = new EventEmitter<void>();

  isRecording: boolean = false;
  texteOrdonnance: string = '';

  simulationTimeout: any;

  // Fonction appelée par le bouton "Annuler"
  annuler() {
    this.fermerModale.emit();
  }

  // Fonction appelée par le bouton "Valider l'ordonnance" (NOUVEAU ! 🚀)
  valider() {
    this.ordonnanceValidee.emit();
  }

  toggleMicrophone() {
    this.isRecording = !this.isRecording;

    if (this.isRecording) {
      this.simulationTimeout = setTimeout(() => {
        this.texteOrdonnance +=
          (this.texteOrdonnance ? '\n' : '') +
          'Paracétamol 1000mg, 1 comprimé matin, midi et soir pendant 5 jours.';

        setTimeout(() => (this.isRecording = false), 1000);
      }, 2000);
    } else {
      clearTimeout(this.simulationTimeout);
    }
  }

  effacerTexte() {
    this.texteOrdonnance = '';
  }
}
