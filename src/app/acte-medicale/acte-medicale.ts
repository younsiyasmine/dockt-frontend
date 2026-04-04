import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ActeMedicale {
  id_acte: number;
  libelle_acte: string;
  duree_estime: number;
}

@Component({
  selector: 'app-acte-medicale',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './acte-medicale.html',
  styleUrls: ['./acte-medicale.css'],
})
export class ActeMedicaleComponent implements OnInit {
  // Liste simulée (sera remplacée par le service Spring Boot)
  actes: ActeMedicale[] = [
    { id_acte: 101, libelle_acte: 'Consultation Générale', duree_estime: 20 },
    { id_acte: 102, libelle_acte: "Renouvellement d'ordonnance", duree_estime: 10 },
    { id_acte: 103, libelle_acte: 'Électrocardiogramme (ECG)', duree_estime: 30 },
    { id_acte: 104, libelle_acte: 'Suture (petite blessure)', duree_estime: 45 },
    { id_acte: 105, libelle_acte: 'Vaccination acte', duree_estime: 15 },
  ];

  openedMenuId: number | null = null;
  acteSelectionne: ActeMedicale | null = null;

  // Contrôle des modales
  showDeleteModal = false;
  showEditModal = false;
  showAddModal = false;

  // Modèle pour le nouvel acte
  nouvelActe: ActeMedicale = { id_acte: 0, libelle_acte: '', duree_estime: 1 };

  constructor() {}
  ngOnInit(): void {}

  // --- GESTION DE L'AJOUT ---
  openAddModal() {
    // Calcul dynamique de l'ID suivant basé sur le maximum actuel
    const maxId = this.actes.length > 0 ? Math.max(...this.actes.map((a) => a.id_acte)) : 100;
    this.nouvelActe = {
      id_acte: maxId + 1,
      libelle_acte: '',
      duree_estime: 1,
    };
    this.showAddModal = true;
    this.openedMenuId = null;
  }

  confirmAdd() {
    if (this.nouvelActe.libelle_acte && this.nouvelActe.duree_estime >= 1) {
      // Simulation de l'ajout (Le Backend générera l'ID final plus tard)
      this.actes.push({ ...this.nouvelActe });
      this.showAddModal = false;
    }
  }

  // --- GESTION DE LA MODIFICATION ---
  openEditModal(acte: ActeMedicale) {
    this.acteSelectionne = { ...acte };
    this.showEditModal = true;
    this.openedMenuId = null;
  }

  saveEdit() {
    if (this.acteSelectionne && this.acteSelectionne.duree_estime >= 1) {
      const index = this.actes.findIndex((a) => a.id_acte === this.acteSelectionne?.id_acte);
      this.actes[index] = { ...this.acteSelectionne };
      this.showEditModal = false;
    }
  }

  // --- GESTION DE LA SUPPRESSION ---
  openDeleteModal(acte: ActeMedicale) {
    this.acteSelectionne = { ...acte };
    this.showDeleteModal = true;
    this.openedMenuId = null;
  }

  confirmDelete() {
    if (this.acteSelectionne) {
      this.actes = this.actes.filter((a) => a.id_acte !== this.acteSelectionne?.id_acte);
      this.showDeleteModal = false;
    }
  }

  // Utilitaires interface
  toggleMenu(id: number, event: Event) {
    event.stopPropagation();
    this.openedMenuId = this.openedMenuId === id ? null : id;
  }

  closeAllMenus() {
    this.openedMenuId = null;
  }

}
