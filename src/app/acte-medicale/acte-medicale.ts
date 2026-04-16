import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActeMedicaleService } from '../core/services/acte-medicale.service';
import { ActeMedicale } from '../core/models';

@Component({
  selector: 'app-acte-medicale',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './acte-medicale.html',
  styleUrls: ['./acte-medicale.css'],
})
export class ActeMedicaleComponent implements OnInit {
  actes: ActeMedicale[] = [];
  openedMenuId: number | null = null;
  acteSelectionne: ActeMedicale | null = null;

  showDeleteModal = false;
  showEditModal = false;
  showAddModal = false;

  isLoading = false;
  errorMessage = '';

  showToast = false;
  toastAction: 'add' | 'edit' | 'delete' = 'add';

  nouvelActe: ActeMedicale = { libelleActe: '', dureeEstime: 1 };

  constructor(
    private acteMedicaleService: ActeMedicaleService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.chargerActes();
  }

  chargerActes(): void {
    this.isLoading = true;
    this.acteMedicaleService.getAllActes().subscribe({
      next: (data) => {
        this.actes = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement actes:', err);
        this.errorMessage = 'Impossible de charger les actes médicaux.';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  // --- ADD ---
  openAddModal(): void {
    this.nouvelActe = { libelleActe: '', dureeEstime: 1 };
    this.showAddModal = true;
    this.openedMenuId = null;
  }

  confirmAdd(): void {
    if (!this.nouvelActe.libelleActe || this.nouvelActe.dureeEstime < 1) return;

    this.acteMedicaleService.addActe(this.nouvelActe).subscribe({
      next: (added) => {
        this.actes = [...this.actes, added];
        this.showAddModal = false;
        this.showSuccessToast('add');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur ajout acte:', err);
        this.errorMessage = "Erreur lors de l'ajout.";
        this.cdr.detectChanges();
      },
    });
  }

  // --- EDIT ---
  openEditModal(acte: ActeMedicale): void {
    this.acteSelectionne = { ...acte };
    this.showEditModal = true;
    this.openedMenuId = null;
  }

  saveEdit(): void {
    if (!this.acteSelectionne?.id_acte || this.acteSelectionne.dureeEstime < 1) return;

    this.acteMedicaleService
      .updateActe(this.acteSelectionne.id_acte, this.acteSelectionne)
      .subscribe({
        next: (updated) => {
          this.actes = this.actes.map((a) => (a.id_acte === updated.id_acte ? updated : a));
          this.showEditModal = false;
          this.showSuccessToast('edit');
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Erreur modification acte:', err);
          this.errorMessage = 'Erreur lors de la modification.';
          this.cdr.detectChanges();
        },
      });
  }

  // --- DELETE ---
  openDeleteModal(acte: ActeMedicale): void {
    this.acteSelectionne = { ...acte };
    this.showDeleteModal = true;
    this.openedMenuId = null;
  }

  confirmDelete(): void {
    if (!this.acteSelectionne?.id_acte) return;

    this.acteMedicaleService.deleteActe(this.acteSelectionne.id_acte).subscribe({
      next: () => {
        this.actes = this.actes.filter((a) => a.id_acte !== this.acteSelectionne!.id_acte);
        this.showDeleteModal = false;
        this.acteSelectionne = null;
        this.showSuccessToast('delete');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur suppression acte:', err);
        this.errorMessage = 'Erreur lors de la suppression.';
        this.cdr.detectChanges();
      },
    });
  }

  toggleMenu(id: number | undefined, event: Event): void {
    event.stopPropagation();
    this.openedMenuId = this.openedMenuId === id ? null : (id ?? null);
  }

  closeAllMenus(): void {
    this.openedMenuId = null;
  }

  showSuccessToast(action: 'add' | 'edit' | 'delete') {
    this.toastAction = action;
    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
      this.cdr.detectChanges();
    }, 2500);
  }
}
