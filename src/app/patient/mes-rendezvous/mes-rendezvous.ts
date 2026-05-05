import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { Navbar } from '../navbar/navbar';
import { RdvService } from '../../core/services/rdv.service';
import { RDV, StatutRDV } from '../../core/models/models';
import { AuthService } from '../../core/services/auth';
import { HttpClient } from '@angular/common/http';
import { PatientResponse } from '../../core/models/auth.model';

@Component({
  selector: 'app-mes-rendezvous',
  standalone: true,
  imports: [RouterModule, Navbar, CommonModule],
  templateUrl: './mes-rendezvous.html',
  styleUrl: './mes-rendezvous.css',
})
export class MesRendezvousComponent implements OnInit {
  showCancelModal = false;
  selectedRdv: RDV | null = null;
  isLoading = false;
  errorMessage = '';
  rendezVousList: RDV[] = [];
  private get idPatient(): number {
    return this.authService.getCurrentUserId() ?? 0;
  }
  showToast = false;
  toastMessage = '';

  patientNames: { [id: number]: string } = {};
  medecinName = ''; // loading placeholder


  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private rdvService: RdvService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.chargerMesRdv();
    this.chargerNomMedecin();

    this.route.queryParams.subscribe((params) => {
      if (params['success']) {
        this.toastMessage = params['success'];
        this.showToast = true;
        setTimeout(() => {
          this.showToast = false;
          this.cdr.detectChanges();
        }, 3000);
      }
    });
  }

  // Two-group sort:
  // Group 1 (top): CONFIRME + MODIFIE_CONFIRME → sorted by date ASC (soonest first)
  // Group 2 (bottom): ANNULE + PASSE → sorted by date DESC (most recent first)
  private trierParDateAsc(): void {
    const activeStatuts = [StatutRDV.CONFIRME, StatutRDV.MODIFIE_CONFIRME];

    const getDate = (rdv: RDV) =>
      new Date(`${rdv.datePrevue}T${rdv.heurePrevue ?? '00:00'}`).getTime();

    this.rendezVousList.sort((a, b) => {
      const aActive = activeStatuts.includes(a.statutRdv as StatutRDV);
      const bActive = activeStatuts.includes(b.statutRdv as StatutRDV);

      // Different groups: active always goes above inactive
      if (aActive !== bActive) return aActive ? -1 : 1;

      // Same group
      if (aActive) {
        // Active group: soonest first (ASC)
        return getDate(a) - getDate(b);
      } else {
        // Inactive group: most recent first (DESC)
        return getDate(b) - getDate(a);
      }
    });
  }

  private chargerNomPatients(rdvs: RDV[]): void {
    const ids = [...new Set(rdvs.map((r) => r.idPatient).filter(Boolean))] as number[];
    ids.forEach((id) => {
      this.http.get<PatientResponse>(`http://localhost:8082/api/patients/${id}`).subscribe({
        next: (p) => {
          this.patientNames[id] = `${p.prenom} ${p.nom}`;
          this.cdr.detectChanges();
        },
        error: () => {
          this.patientNames[id] = `Patient #${id}`;
          this.cdr.detectChanges();
        },
      });
    });
  }

  private chargerNomMedecin(): void {
    this.http.get<any>('http://localhost:8082/api/medecins/1').subscribe({
      next: (m) => {
        this.medecinName = `Dr. ${m.nom} ${m.prenom}`;
        this.cdr.detectChanges();
      },
      error: () => {
        this.medecinName = 'Dr. inconnu';
        this.cdr.detectChanges();
      },
    });
  }

  chargerMesRdv(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.rdvService.getRDVByPatient(this.idPatient).subscribe({
      next: (data) => {
        this.rendezVousList = data;
        this.trierParDateAsc();
        this.chargerNomPatients(data); // ← add this line
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement RDV :', err);
        this.errorMessage = 'Impossible de charger vos rendez-vous.';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  // FIX 1 & 2: shared 24h guard — mirrors backend logic exactly (date-based, not hour-based)
  // Backend blocks if datePrevue < tomorrow, so we do the same here for consistent UX
  private verifier24h(rdv: RDV): boolean {
    const now = new Date(); // actual current time, no resetting hours
    const [year, month, day] = (rdv.datePrevue as string).split('-').map(Number);
    const dateRdv = new Date(
      year,
      month - 1,
      day,
      ...((rdv.heurePrevue ?? '00:00').split(':').map(Number) as [number, number]),
    );

    const diff = dateRdv.getTime() - now.getTime();
    const heures = diff / (1000 * 60 * 60);

    if (heures < 24) {
      this.errorMessage = 'Action impossible : le rendez-vous est dans moins de 24 heures.';
      return false;
    }

    this.errorMessage = '';
    return true;
  }

  // FIX 2: modifier now has the same 24h guard as annuler
  modifierRdv(rdv: RDV): void {
    if (!this.verifier24h(rdv)) return;
    this.router.navigate(['/patient/prendre-rdv', rdv.id]);
  }

  openCancelModal(rdv: RDV): void {
    if (!this.verifier24h(rdv)) return;
    this.selectedRdv = rdv;
    this.showCancelModal = true;
  }

  confirmCancel(): void {
    if (!this.selectedRdv?.id) return;

    // FIX 3: no libererCreneau() needed — ANNULE status already frees the slot
    // because creerRDV() only blocks on CONFIRME status
    this.rdvService.mettreAJourStatut(this.selectedRdv.id, StatutRDV.ANNULE).subscribe({
      next: () => {
        this.rendezVousList = this.rendezVousList.map((r) =>
          r.id === this.selectedRdv!.id ? { ...r, statutRdv: StatutRDV.ANNULE } : r,
        );
        this.trierParDateAsc(); // FIX 4: re-sort after mutation

        this.showCancelModal = false;
        this.selectedRdv = null;
        this.toastMessage = 'Rendez-vous annulé avec succès !';
        this.showToast = true;
        setTimeout(() => {
          this.showToast = false;
          this.cdr.detectChanges();
        }, 3000);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur annulation RDV :', err);
        this.errorMessage = "Erreur lors de l'annulation.";
        this.showCancelModal = false;
        this.cdr.detectChanges();
      },
    });
  }

  getStatusClass(statut: string | undefined): string {
    switch (statut) {
      case StatutRDV.CONFIRME:
        return 'bg-[#2ecc71]';
      case StatutRDV.ANNULE:
        return 'bg-red-400';
      case StatutRDV.MODIFIE_CONFIRME:
        return 'bg-blue-400';
      case StatutRDV.PASSE:
        return 'bg-yellow-500';
      default:
        return 'bg-gray-400';
    }
  }

  getStatusLabel(statut: string | undefined): string {
    switch (statut) {
      case StatutRDV.CONFIRME:
        return 'Confirmé';
      case StatutRDV.ANNULE:
        return 'Annulé';
      case StatutRDV.MODIFIE_CONFIRME:
        return 'Modifié Confirmé';
      case StatutRDV.PASSE:
        return 'Passé';
      default:
        return 'En attente';
    }
  }

  formatDate(date: string): string {
    if (!date) return '';
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  formatTime(time: string): string {
    if (!time) return '';
    return time.substring(0, 5);
  }
}
