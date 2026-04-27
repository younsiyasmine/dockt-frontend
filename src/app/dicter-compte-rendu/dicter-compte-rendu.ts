import { Component, Output, EventEmitter, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CompteRenduService } from '../core/services/compte-rendu.service';
import { CompteRendu } from '../core/models/models';

@Component({
  selector: 'app-dicter-compte-rendu',
  imports: [CommonModule, FormsModule],
  templateUrl: './dicter-compte-rendu.html',
  styleUrl: './dicter-compte-rendu.css',
})
export class DicterCompteRendu implements OnInit {
  @Output() fermerModale = new EventEmitter<void>();
  @Output() compteRenduValide = new EventEmitter<{ action: 'brouillon' | 'valider'; cr: CompteRendu }>();
  @Input() idRdv: number = 0;
  @Input() patientNom: string = '';
  @Input() crExistant: CompteRendu | null = null;

  isRecording: boolean = false;
  texteCompteRendu: string = '';
  isSaving: boolean = false;

  constructor(private compteRenduService: CompteRenduService) {}

  ngOnInit() {
    if (this.crExistant) {
      this.texteCompteRendu = this.crExistant.contenu;
    }
  }

  toggleMicrophone() {
    this.isRecording = !this.isRecording;
    if (this.isRecording) {
      setTimeout(() => {
        if (this.isRecording) {
          const texteSimule =
            "Motif de consultation : Patiente se plaignant d'une fatigue générale depuis environ 2 semaines. Pas de fièvre signalée.\n\nExamen clinique : Tension artérielle mesurée à 12/8. L'auscultation cardio-pulmonaire est sans anomalie. Palpation abdominale souple et indolore.\n\nConclusion : Asthénie. Prescription d'un bilan sanguin complet et recommandation de repos.";
          this.texteCompteRendu += (this.texteCompteRendu ? '\n\n' : '') + texteSimule;
          this.isRecording = false;
        }
      }, 3000);
    }
  }

  effacerTexte() {
    this.texteCompteRendu = '';
  }

  annuler() {
    this.fermerModale.emit();
  }

  sauvegarderBrouillon() {
    if (!this.texteCompteRendu.trim()) return;
    this.isSaving = true;

    const cr: CompteRendu = {
      contenu: this.texteCompteRendu,
      idRdv: this.crExistant?.idRdv ?? this.idRdv,
    };

    const call = this.crExistant
      ? this.compteRenduService.mettreAJourBrouillon(this.crExistant.idCr!, cr)
      : this.compteRenduService.sauvegarderBrouillon(cr);

    call.subscribe({
      next: (saved) => {
        this.isSaving = false;
        this.compteRenduValide.emit({ action: 'brouillon', cr: saved });
      },
      error: (err) => {
        console.error('Erreur sauvegarde brouillon:', err);
        this.isSaving = false;
      },
    });
  }

  valider() {
    if (!this.texteCompteRendu.trim()) return;
    this.isSaving = true;

    const cr: CompteRendu = {
      contenu: this.texteCompteRendu,
      idRdv: this.crExistant?.idRdv ?? this.idRdv,
    };

    const call = this.crExistant
      ? this.compteRenduService.validerCompteRenduExistant(this.crExistant.idCr!, cr)
      : this.compteRenduService.validerCompteRendu(cr);

    call.subscribe({
      next: (saved) => {
        this.isSaving = false;
        this.compteRenduValide.emit({ action: 'valider', cr: saved });
      },
      error: (err) => {
        console.error('Erreur validation CR:', err);
        this.isSaving = false;
      },
    });
  }
}
