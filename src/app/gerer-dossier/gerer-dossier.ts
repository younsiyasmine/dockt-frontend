import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { DicterOrdonnance } from '../dicter-ordonnance/dicter-ordonnance';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { VueOrdonnance } from '../vue-ordonnance/vue-ordonnance';
import { DicterCompteRendu } from '../dicter-compte-rendu/dicter-compte-rendu';
import { VueCompteRendu } from '../vue-compte-rendu/vue-compte-rendu';
import { FileAttenteService } from '../core/services/file-attente.service';
import { Topbar } from '../pages/topbar/topbar';
import { Sidebar } from '../pages/sidebar/sidebar';
import { OrdonnanceService } from '../core/services/ordonnance.service';
import { CompteRenduService } from '../core/services/compte-rendu.service';
import { AuthService } from '../core/services/auth';
import { Ordonnance, CompteRendu } from '../core/models/models';

@Component({
  selector: 'app-gerer-dossier',
  imports: [
    CommonModule,
    DicterOrdonnance,
    VueOrdonnance,
    DicterCompteRendu,
    VueCompteRendu,
    Topbar,
    Sidebar,
    FormsModule,
    DatePipe,
  ],
  templateUrl: './gerer-dossier.html',
  styleUrl: './gerer-dossier.css',
})
export class GererDossier implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private fileAttenteService: FileAttenteService,
    private ordonnanceService: OrdonnanceService,
    private compteRenduService: CompteRenduService,
    private authService: AuthService,
  ) {}

  role: 'MEDECIN' | 'SECRETAIRE' | null = null;
  source: 'fileAttente' | 'listPatient' | null = null;

  patient: any = {
    nom: '',
    prenom: '',
    cin: '',
    date_naissance: '',
    num_telephone: '',
    sex: false,
    adresse: '',
    image_biometrique: null,
  };

  patientId: string | null = null;
  rdvId: number | null = null;
  crSelectionne: CompteRendu | null = null;

  modaleEditionOuverte = false;
  isUpdating = false;
  updateError = '';
  showPassword = false;

  editForm: any = {};

  showSuccessToast = false;

  checkInLoading = false;
  checkInSuccess = false;
  checkInError = '';

  historiqueRdv: any[] = [];
  ordonnances: Ordonnance[] = [];
  comptesRendus: CompteRendu[] = [];

  afficherApercuA4 = false;
  afficherApercuCompteRenduA4 = false;
  modaleOrdonnanceOuverte = false;
  modaleCompteRenduOuverte = false;
  ongletActif = 'infos';

  ngOnInit(): void {
    const auth = JSON.parse(localStorage.getItem('user') || 'null');
    this.role = auth?.role ?? null;

    this.route.queryParams.subscribe((params) => {
      this.rdvId = params['rdvId'] ? +params['rdvId'] : null;
      this.source = params['source'] ?? null;
    });

    const id = this.route.snapshot.paramMap.get('id');
    this.patientId = id;

    if (id) {
      this.http.get<any>(`http://localhost:8082/api/patients/${id}`).subscribe({
        next: (p) => {
          this.patient = {
            nom: p.nom ?? '—',
            prenom: p.prenom ?? '—',
            cin: p.cin ?? '—',
            date_naissance: p.dateNaissance ?? '—',
            num_telephone: p.numTelephone ? '0' + p.numTelephone.toString() : '—',
            sex: p.sexe === true || p.sexe === 'true',
            adresse: p.adresse ?? '—',
            image_biometrique: null,
          };
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Erreur chargement patient:', err),
      });

      this.http.get<any[]>(`http://localhost:8081/api/rdv/patient/${id}`).subscribe({
        next: (rdvs) => {
          const activeStatuts = ['CONFIRME', 'MODIFIE_CONFIRME'];
          const getDate = (rdv: any) =>
            new Date(`${rdv.date_prevue}T${rdv.heure_prevue ?? '00:00'}`).getTime();

          this.historiqueRdv = rdvs
            .map((rdv) => ({
              id: rdv.id,
              titre: 'Consultation',
              date_prevue: rdv.datePrevue,
              heure_prevue: rdv.heurePrevue?.substring(0, 5),
              statut_consultation: rdv.statutRdv,
            }))
            .sort((a: any, b: any) => {
              const aActive = activeStatuts.includes(a.statut_consultation);
              const bActive = activeStatuts.includes(b.statut_consultation);
              if (aActive !== bActive) return aActive ? -1 : 1;
              if (aActive) return getDate(a) - getDate(b);
              return getDate(b) - getDate(a);
            });

          this.cdr.detectChanges();
        },
        error: (err) => console.error('Erreur chargement RDVs:', err),
      });

      this.ordonnanceService.getOrdonnancesParPatient(+id).subscribe({
        next: (data) => {
          this.ordonnances = data.sort(
            (a, b) =>
              new Date(b.dateEmmission ?? '').getTime() - new Date(a.dateEmmission ?? '').getTime(),
          );
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Erreur ordonnances:', err),
      });

      this.loadComptesRendus(id);
    }
  }

  selectionnerRdv(rdv: any) {
    if (this.role !== 'MEDECIN') return;
    if (this.comptesRendus.some((cr) => cr.idRdv === rdv.id)) return;
    if (rdv.statut_consultation === 'ANNULE') return;

    this.rdvId = rdv.id;
  }

  rdvDejaACr(rdvId: number | undefined): boolean {
    if (!rdvId) return false;
    return this.comptesRendus.some((cr) => cr.idRdv === rdvId);
  }

  private loadComptesRendus(patientId: string) {
    this.compteRenduService.getComptesRendusParPatient(+patientId).subscribe({
      next: (data) => {
        this.comptesRendus = this.sortCR(data);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erreur comptes rendus:', err),
    });
  }

  private sortCR(list: CompteRendu[]): CompteRendu[] {
    const order: Record<string, number> = { DEMANDE: 0, EN_ATTENTE: 1, VALIDE: 2 };
    return list.sort((a, b) => {
      const statusDiff = (order[a.statut || ''] ?? 99) - (order[b.statut || ''] ?? 99);
      if (statusDiff !== 0) return statusDiff;
      if (a.statut === 'VALIDE' && b.statut === 'VALIDE') {
        return (
          new Date(b.dateRedaction || '').getTime() - new Date(a.dateRedaction || '').getTime()
        );
      }
      return 0;
    });
  }

  voirOrdonnance(ord: Ordonnance) {
    this.router.navigate(['/voir-ordonnance', ord.idOrdonnance]);
  }

  voirCompteRendu(cr: CompteRendu) {
    this.router.navigate(['/voir-compte-rendu', cr.idCr]);
  }

  retour() {
    window.history.back();
  }

  ouvrirModaleEdition() {
    this.editForm = {
      nom: this.patient.nom === '—' ? '' : this.patient.nom,
      prenom: this.patient.prenom === '—' ? '' : this.patient.prenom,
      cin: this.patient.cin === '—' ? '' : this.patient.cin,
      dateNaissance: this.patient.date_naissance === '—' ? '' : this.patient.date_naissance,
      numTelephone: this.patient.num_telephone === '—' ? '' : this.patient.num_telephone,
      sexe: this.patient.sex,
      adresse: this.patient.adresse === '—' ? '' : this.patient.adresse,
      email: '',
      password: '',
    };
    this.modaleEditionOuverte = true;
    this.updateError = '';
  }

  fermerModaleEdition() {
    this.modaleEditionOuverte = false;
    this.updateError = '';
  }

  sauvegarderPatient() {
    this.isUpdating = true;
    this.updateError = '';

    const payload: any = {
      nom: this.editForm.nom || null,
      prenom: this.editForm.prenom || null,
      cin: this.editForm.cin || null,
      dateNaissance: this.editForm.dateNaissance || null,
      numTelephone: this.editForm.numTelephone ? parseInt(this.editForm.numTelephone) : null,
      sexe: this.editForm.sexe,
      adresse: this.editForm.adresse || null,
      email: this.editForm.email || null,
      password: this.editForm.password || null,
    };

    this.http.put<any>(`http://localhost:8082/api/patients/${this.patientId}`, payload).subscribe({
      next: (updated) => {
        this.patient = {
          nom: updated.nom ?? '—',
          prenom: updated.prenom ?? '—',
          cin: updated.cin ?? '—',
          date_naissance: updated.dateNaissance ?? '—',
          num_telephone: updated.numTelephone?.toString() ?? '—',
          sex: updated.sexe === true,
          adresse: updated.adresse ?? '—',
          image_biometrique: null,
        };
        this.isUpdating = false;
        this.modaleEditionOuverte = false;
        this.showSuccessToast = true;
        setTimeout(() => {
          this.showSuccessToast = false;
          this.cdr.detectChanges();
        }, 3000);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.updateError = err?.error?.message || 'Une erreur est survenue.';
        this.isUpdating = false;
        this.cdr.detectChanges();
      },
    });
  }

  checkIn() {
    if (!this.patientId) return;
    this.checkInLoading = true;
    this.checkInError = '';

    this.fileAttenteService.getFileDuJourAvecDetails().subscribe({
      next: (rdvs) => {
        const rdv = rdvs.find(
          (r: any) =>
            r.idPatient?.toString() === this.patientId?.toString() ||
            r.patient?.idPatient?.toString() === this.patientId?.toString(),
        );

        if (!rdv || !rdv.id) {
          this.checkInLoading = false;
          this.checkInError = "Aucun RDV trouvé aujourd'hui pour ce patient.";
          this.showCheckInErrorToast();
          return;
        }

        this.fileAttenteService.checkIn(rdv.id).subscribe({
          next: () => {
            this.declencherCaptureSurTablette(this.patientId!);
            this.checkInLoading = false;
            this.checkInSuccess = true;
            this.showSuccessToast = true;
            this.cdr.detectChanges();
            setTimeout(() => {
              this.showSuccessToast = false;
              this.checkInSuccess = false;
              this.cdr.detectChanges();
            }, 5000);
          },
          error: (err) => {
            this.checkInLoading = false;
            this.checkInError = err?.error?.message || 'Erreur lors du check-in.';
            this.showCheckInErrorToast();
          },
        });
      },
      error: () => {
        this.checkInLoading = false;
        this.checkInError = 'Erreur lors de la récupération des RDVs.';
        this.showCheckInErrorToast();
      },
    });
  }

  declencherCaptureSurTablette(patientId: string) {
    this.http
      .post('http://localhost:8000/api/visage/demarrer_capture', {
        patient_id: parseInt(patientId),
      })
      .subscribe({
        next: (response: any) => {
          console.log('Capture déclenchée sur la Tablette 1', response);
        },
        error: (err) => {
          console.error('Erreur déclenchement capture:', err);
          this.checkInSuccess = false;
          this.showSuccessToast = false;
          this.checkInError = 'Erreur de communication avec la tablette';
          this.showCheckInErrorToast();
        },
      });
  }

  showCheckInErrorToast() {
    this.cdr.detectChanges();
    setTimeout(() => {
      this.checkInError = '';
      this.cdr.detectChanges();
    }, 3000);
  }

  changerOnglet(onglet: string) {
    this.ongletActif = onglet;
  }

  ouvrirModaleOrdonnance() {
    this.modaleOrdonnanceOuverte = true;
  }

  fermerModaleOrdonnance() {
    this.modaleOrdonnanceOuverte = false;
  }

  terminerEtAfficherOrdonnance() {
    this.modaleOrdonnanceOuverte = false;
    this.afficherApercuA4 = true;
  }

  ouvrirModaleCompteRendu(cr?: CompteRendu) {
    if (cr) {
      this.crSelectionne = cr;
    } else if (this.rdvId) {
      this.crSelectionne = null;
    } else {
      const demandes = this.comptesRendus
        .filter((c) => c.statut === 'DEMANDE')
        .sort(
          (a, b) =>
            new Date(a.dateRedaction || '').getTime() - new Date(b.dateRedaction || '').getTime(),
        );
      this.crSelectionne = demandes.length > 0 ? demandes[0] : null;
    }
    this.modaleCompteRenduOuverte = true;
  }

  fermerModaleCompteRendu() {
    this.modaleCompteRenduOuverte = false;
    this.crSelectionne = null;
  }

  terminerCompteRendu(event: { action: 'brouillon' | 'valider'; cr: CompteRendu }) {
    this.modaleCompteRenduOuverte = false;
    const savedCr = event.cr;
    this.crSelectionne = null;

    if (this.patientId) {
      this.loadComptesRendus(this.patientId);
    }

    if (event.action === 'valider') {
      this.afficherApercuCompteRenduA4 = true;
      if (savedCr?.idCr) {
        this.router.navigate(['/voir-compte-rendu', savedCr.idCr]);
      }
    }
  }
}
