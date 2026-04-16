import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
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

  // properties bach y9dr modifier
  editMode = false;
  rdvId: number | null = null;

  // --- Slots ---
  listeCreneaux: { heure: string; disponible: boolean }[] = [];
  heureSelectionnee = '';
  private allRdvs: RDV[] = [];

  // --- Calendar ---
  afficherCalendrier = false;
  dateSelectionnee = '';
  private dateISO = ''; // "YYYY-MM-DD" for backend

  moisNoms = [
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre',
  ];
  moisActuel = new Date().getMonth();
  anneeActuelle = new Date().getFullYear();
  joursCalendrier: number[] = [];
  joursVides: number[] = [];

  today = new Date();
  joursPassesOuAujourdhui: Set<number> = new Set();

  constructor(
    private rdvService: RdvService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.genererJoursMois();

    // ← SET EDIT MODE IMMEDIATELY before any API call
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editMode = true;
      this.rdvId = +id;
    }

    this.rdvService.listerTousLesRDV().subscribe({
      next: (rdvs) => {
        this.allRdvs = rdvs;

        if (this.editMode && this.rdvId) {
          const rdv = rdvs.find((r) => r.id === this.rdvId);
          if (rdv) {
            this.dateISO = rdv.datePrevue as string;
            const [year, month, day] = this.dateISO.split('-').map(Number);
            this.dateSelectionnee = `${day} ${this.moisNoms[month - 1]} ${year}`;
            this.moisActuel = month - 1;
            this.anneeActuelle = year;
            this.genererJoursMois();
            this.genererCreneaux();
            this.heureSelectionnee = rdv.heurePrevue?.substring(0, 5) ?? '';
            this.idPatient = rdv.idPatient ?? null;
            if (rdv.patient) {
              this.nomPatient = `${rdv.patient.prenom} ${rdv.patient.nom}`;
            } else if (rdv.idPatient) {
              this.nomPatient = `Patient #${rdv.idPatient}`;
            }
            this.cdr.detectChanges();
          }
        }
      },
      error: (err) => console.error('Erreur chargement RDVs:', err),
    });
  }

  // --- Calendar ---
  toggleCalendrier(): void {
    this.afficherCalendrier = !this.afficherCalendrier;
  }

  genererJoursMois(): void {
    const nbJours = new Date(this.anneeActuelle, this.moisActuel + 1, 0).getDate();
    const todayMidnight = new Date(
      this.today.getFullYear(),
      this.today.getMonth(),
      this.today.getDate(),
    );

    this.joursCalendrier = Array.from({ length: nbJours }, (_, i) => i + 1);

    // Calculate which days are in the past
    this.joursPassesOuAujourdhui = new Set(
      this.joursCalendrier.filter((jour) => {
        const date = new Date(this.anneeActuelle, this.moisActuel, jour);
        return date < todayMidnight;
      }),
    );

    let premierJour = new Date(this.anneeActuelle, this.moisActuel, 1).getDay();
    let decalage = premierJour === 0 ? 6 : premierJour - 1;
    this.joursVides = Array(decalage).fill(0);
  }

  changerMois(delta: number): void {
    this.moisActuel += delta;
    if (this.moisActuel > 11) {
      this.moisActuel = 0;
      this.anneeActuelle++;
    } else if (this.moisActuel < 0) {
      this.moisActuel = 11;
      this.anneeActuelle--;
    }
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
      '09:00',
      '09:30',
      '10:00',
      '10:30',
      '11:00',
      '11:30',
      '14:00',
      '14:30',
      '15:00',
      '15:30',
      '16:00',
      '16:30',
      '17:00',
      '17:30',
      '18:00',
      '18:30',
    ];

    const takenTimes = this.allRdvs
      .filter((r) => r.datePrevue === this.dateISO)
      .map((r) => r.heurePrevue?.substring(0, 5) ?? '');

    this.listeCreneaux = ALL_SLOTS.map((heure) => ({
      heure,
      disponible: !takenTimes.includes(heure),
    }));
  }

  // --- Submit ---
  ajouterRdv(): void {
    if (!this.dateISO || !this.heureSelectionnee) {
      this.errorMessage = 'Veuillez choisir une date et une heure.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    if (this.editMode && this.rdvId) {
      const rdvModifie: Partial<RDV> = {
        datePrevue: this.dateISO,
        heurePrevue: this.heureSelectionnee + ':00',
      };

      this.rdvService.modifierRDVParSecretaire(this.rdvId, rdvModifie).subscribe({
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

          const backendMessage = err?.error?.message || '';

          if (backendMessage.includes('24')) {
            // Combine date + heure to get full datetime
            const rdvDateTime = new Date(`${this.dateISO}T${this.heureSelectionnee}:00`);
            const now = new Date();

            if (rdvDateTime < now) {
              this.errorMessage = 'Modification impossible : le rendez-vous est déjà passé.';
            } else {
              this.errorMessage =
                'Modification impossible : le rendez-vous est dans moins de 24 heures.';
            }
          } else {
            this.errorMessage = backendMessage || 'Une erreur est survenue.';
          }

          this.cdr.detectChanges();
        },
      });
    } else {
      // existing ajouterRDV logic
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
        },
      });
    }
  }

}
