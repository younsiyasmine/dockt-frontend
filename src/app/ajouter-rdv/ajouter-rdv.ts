import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RdvService } from '../core/services/rdv.service';
import { RDV, StatutRDV } from '../core/models';

@Component({
  selector: 'app-ajouter-rdv',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './ajouter-rdv.html',
  styleUrl: './ajouter-rdv.css',
})
export class AjouterRdv implements OnInit {

  // ⚠️ Replace with real auth later
  private readonly ID_SECRETAIRE = 1;

  // --- Patient ---
  nomPatient = '';
  idPatient: number | null = null;

  // --- UI State ---
  isLoading = false;
  errorMessage = '';
  showToast = false;

  // --- Slots ---
  listeCreneaux: { heure: string; disponible: boolean }[] = [];
  heureSelectionnee = '';
  private allRdvs: RDV[] = [];

  // --- Calendar ---
  afficherCalendrier = false;
  dateSelectionnee = '';
  private dateISO = ''; // "YYYY-MM-DD" for backend

  moisNoms = ['Janvier','Février','Mars','Avril','Mai','Juin',
    'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  moisActuel = new Date().getMonth();
  anneeActuelle = new Date().getFullYear();
  joursCalendrier: number[] = [];
  joursVides: number[] = [];

  constructor(
    private rdvService: RdvService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.genererJoursMois();

    // Pre-load all RDVs to compute slot availability
    this.rdvService.listerTousLesRDV().subscribe({
      next: (rdvs) => { this.allRdvs = rdvs; },
      error: (err) => console.error('Erreur chargement RDVs:', err)
    });
  }

  // --- Calendar ---
  toggleCalendrier(): void {
    this.afficherCalendrier = !this.afficherCalendrier;
  }

  genererJoursMois(): void {
    const nbJours = new Date(this.anneeActuelle, this.moisActuel + 1, 0).getDate();
    this.joursCalendrier = Array.from({ length: nbJours }, (_, i) => i + 1);
    let premierJour = new Date(this.anneeActuelle, this.moisActuel, 1).getDay();
    let decalage = premierJour === 0 ? 6 : premierJour - 1;
    this.joursVides = Array(decalage).fill(0);
  }

  changerMois(delta: number): void {
    this.moisActuel += delta;
    if (this.moisActuel > 11) { this.moisActuel = 0; this.anneeActuelle++; }
    else if (this.moisActuel < 0) { this.moisActuel = 11; this.anneeActuelle--; }
    this.genererJoursMois();
  }

  choisirDate(jour: number): void {
    const month = String(this.moisActuel + 1).padStart(2, '0');
    const day = String(jour).padStart(2, '0');
    this.dateISO = `${this.anneeActuelle}-${month}-${day}`;
    this.dateSelectionnee = `${jour} ${this.moisNoms[this.moisActuel]} ${this.anneeActuelle}`;
    this.afficherCalendrier = false;
    this.heureSelectionnee = '';
    this.genererCreneaux();
  }

  genererCreneaux(): void {
    const ALL_SLOTS = [
      '09:00','09:30','10:00','10:30','11:00','11:30',
      '14:00','14:30','15:00','15:30','16:00','16:30',
      '17:00','17:30','18:00','18:30'
    ];

    const takenTimes = this.allRdvs
      .filter(r => r.datePrevue === this.dateISO)
      .map(r => r.heurePrevue?.substring(0, 5) ?? '');

    this.listeCreneaux = ALL_SLOTS.map(heure => ({
      heure,
      disponible: !takenTimes.includes(heure)
    }));
  }

  // --- Submit ---
  ajouterRdv(): void {
    if (!this.nomPatient.trim()) {
      this.errorMessage = 'Veuillez entrer le nom du patient.';
      return;
    }
    if (!this.dateISO) {
      this.errorMessage = 'Veuillez choisir une date.';
      return;
    }
    if (!this.heureSelectionnee) {
      this.errorMessage = 'Veuillez choisir une heure.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // ⚠️ idPatient hardcoded to 1 until user microservice is connected
    // When user MS is ready: search patient by nomPatient → get idPatient
    const rdv: RDV = {
      datePrevue: this.dateISO,
      heurePrevue: this.heureSelectionnee + ':00',
      statutRdv: StatutRDV.CONFIRME,
      idPatient: this.idPatient ?? 1,
      idSecretaire: this.ID_SECRETAIRE,
    };

    this.rdvService.ajouterRDV(rdv).subscribe({
      next: () => {
        this.isLoading = false;
        this.showToast = true;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.showToast = false;
          this.router.navigate(['/shared/planning']);
        }, 2500);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message ?? 'Une erreur est survenue.';
        this.cdr.detectChanges();
      }
    });
  }
}
