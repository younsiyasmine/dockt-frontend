import { Component, Output, EventEmitter, Input } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrdonnanceService } from '../core/services/ordonnance.service';
import { Ordonnance } from '../core/models/models';

@Component({
  selector: 'app-dicter-ordonnance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dicter-ordonnance.html',
  styleUrl: './dicter-ordonnance.css',
})
export class DicterOrdonnance {
  @Output() fermerModale = new EventEmitter<void>();
  @Output() ordonnanceValidee = new EventEmitter<void>();
  @Input() idRdv: number = 1; // hardcoded for now, real value from MS2 later

  isRecording = false;
  texteOrdonnance = '';
  typeOrdonnance = 'Médicament';
  isSaving = false;
  simulationTimeout: any;

  constructor(
    private ordonnanceService: OrdonnanceService,
    private router: Router,
  ) {}

  annuler() {
    this.fermerModale.emit();
  }

  valider() {
    if (!this.texteOrdonnance.trim()) return;

    this.isSaving = true;
    const ordonnance: Ordonnance = {
      contenuTexte: this.texteOrdonnance,
      type: this.typeOrdonnance,
      idRdv: this.idRdv,
    };

    this.ordonnanceService.sauvegarderOrdonnance(ordonnance).subscribe({
      next: (data) => {
        console.log('Ordonnance sauvegardée:', data);
        this.isSaving = false;
        this.ordonnanceValidee.emit();
        // navigate to the new ordonnance
        this.router.navigate(['/voir-ordonnance', data.idOrdonnance]);
      },
      error: (err) => {
        console.error('Erreur sauvegarde ordonnance:', err);
        this.isSaving = false;
      },
    });
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
