import { Component } from '@angular/core';
import { NgFor, NgClass } from '@angular/common';

interface PatientAttente {
  nom: string;
  heureArrivee: string;
  tempsAttente: string;
  tempsNegatif: boolean;
  statut: 'en attente' | 'en consultation';
  checkIn: boolean;
}

@Component({
  selector: 'app-file-attente',
  standalone: true,
  imports: [NgFor, NgClass],
  templateUrl: './file-attente.html',
  styleUrl: './file-attente.css',
})
export class FileAttente {
  patients: PatientAttente[] = [
    {
      nom: 'Sophie Bernard',
      heureArrivee: '10:45',
      tempsAttente: '30 min',
      tempsNegatif: false,
      statut: 'en attente',
      checkIn: true,
    },
    {
      nom: 'Pierre Petit',
      heureArrivee: '13:50',
      tempsAttente: '-155 min',
      tempsNegatif: true,
      statut: 'en attente',
      checkIn: false,
    },
  ];

  voirDossier(patient: PatientAttente) {
    console.log('Voir dossier:', patient.nom);
  }

  toggleCheckIn(patient: PatientAttente) {
    patient.checkIn = !patient.checkIn;
  }
}
