import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DicterOrdonnance } from '../dicter-ordonnance/dicter-ordonnance';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';

// C'EST CETTE LIGNE QUI RÈGLE TOUT !
import { VueOrdonnance } from '../vue-ordonnance/vue-ordonnance';

// 👇 1. ON AJOUTE L'IMPORT DU COMPTE RENDU ICI
import { DicterCompteRendu } from '../dicter-compte-rendu/dicter-compte-rendu';
// Add to imports at top
import { FileAttenteService } from '../core/services/file-attente.service'; // adjust path

// 👇 2. NOUVEL IMPORT POUR L'APERÇU A4 DU COMPTE RENDU
import { VueCompteRendu } from '../vue-compte-rendu/vue-compte-rendu';
import { Topbar } from '../pages/topbar/topbar';
import { Sidebar } from '../pages/sidebar/sidebar';

@Component({
  selector: 'app-gerer-dossier',
  // 👇 3. ON L'AJOUTE DANS LA LISTE ICI !
  imports: [
    CommonModule,
    DicterOrdonnance,
    VueOrdonnance,
    DicterCompteRendu,
    VueCompteRendu,
    Topbar,
    Sidebar,
    FormsModule,
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
  ) {}

  role: 'MEDECIN' | 'SECRETAIRE' | null = null;

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

  modaleEditionOuverte = false;
  isUpdating = false;
  updateError = '';
  showPassword = false;

  editForm: any = {};

  showSuccessToast = false;

  checkInLoading = false;
  checkInSuccess = false;
  checkInError = '';

  ngOnInit(): void {
    const auth = JSON.parse(localStorage.getItem('user') || 'null');
    this.role = auth?.role ?? null;

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

      // Fetch RDVs from MS2
      this.http.get<any[]>(`http://localhost:8081/api/rdv/patient/${id}`).subscribe({
        next: (rdvs) => {
          const activeStatuts = ['CONFIRME', 'MODIFIE_CONFIRME'];

          const getDate = (rdv: any) =>
            new Date(`${rdv.date_prevue}T${rdv.heure_prevue ?? '00:00'}`).getTime();

          this.historiqueRdv = rdvs
            .map((rdv) => ({
              titre: 'Consultation',
              date_prevue: rdv.datePrevue,
              heure_prevue: rdv.heurePrevue?.substring(0, 5),
              statut_consultation: rdv.statutRdv,
            }))
            .sort((a: any, b: any) => {
              const aActive = activeStatuts.includes(a.statut_consultation);
              const bActive = activeStatuts.includes(b.statut_consultation);

              if (aActive !== bActive) return aActive ? -1 : 1;

              if (aActive) {
                return getDate(a) - getDate(b); // active: soonest first
              } else {
                return getDate(b) - getDate(a); // inactive: most recent first
              }
            });

          this.cdr.detectChanges();
        },
        error: (err) => console.error('Erreur chargement RDVs:', err),
      });
    }
  }

  // 👇 6. ADD THE retour() FUNCTION
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

    // First get today's RDVs to find the idRdv for this patient
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

        const rdvId: number = rdv.id;

        this.fileAttenteService.checkIn(rdvId).subscribe({
          next: () => {
            // Déclencher la capture sur Tablette 1 APRÈS le check-in
            this.declencherCaptureSurTablette(this.patientId!);

            this.checkInLoading = false;
            this.checkInSuccess = true;
            this.showSuccessToast = true;
            this.cdr.detectChanges();

            // Le toast reste affiché 5 secondes (temps pour que le patient se place)
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
      error: (err) => {
        this.checkInLoading = false;
        this.checkInError = 'Erreur lors de la récupération des RDVs.';
        this.showCheckInErrorToast();
      },
    });
  }

  // MÉTHODE : Déclencher la capture sur la Tablette 1
  declencherCaptureSurTablette(patientId: string) {
    // Appeler le serveur Python (port 8000)
    this.http
      .post('http://localhost:8000/api/visage/demarrer_capture', {
        patient_id: parseInt(patientId),
      })
      .subscribe({
        next: (response: any) => {
          console.log('✅ Capture déclenchée sur la Tablette 1', response);
        },
        error: (err) => {
          console.error('❌ Erreur déclenchement capture:', err);
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

  // --- GESTION DES ONGLETS ---
  ongletActif: string = 'infos';

  changerOnglet(onglet: string) {
    this.ongletActif = onglet;
  }

  // --- GESTION DE LA MODALE ORDONNANCE ---
  modaleOrdonnanceOuverte: boolean = false;

  ouvrirModaleOrdonnance() {
    this.modaleOrdonnanceOuverte = true;
  }

  fermerModaleOrdonnance() {
    this.modaleOrdonnanceOuverte = false;
  }

  // --- GESTION DE L'AFFICHAGE A4 (ORDONNANCE) ---
  afficherApercuA4: boolean = false;

  terminerEtAfficherOrdonnance() {
    this.modaleOrdonnanceOuverte = false;
    this.afficherApercuA4 = true;
  }

  // --- GESTION DE LA MODALE COMPTE RENDU ---
  modaleCompteRenduOuverte: boolean = false;

  ouvrirModaleCompteRendu() {
    this.modaleCompteRenduOuverte = true;
  }

  fermerModaleCompteRendu() {
    this.modaleCompteRenduOuverte = false;
  }

  // 👇 LA FONCTION MISE À JOUR POUR OUVRIR LE A4 AUTOMATIQUEMENT
  terminerCompteRendu(action: 'brouillon' | 'valider') {
    this.modaleCompteRenduOuverte = false;

    if (action === 'valider') {
      this.afficherApercuCompteRenduA4 = true;
    } else {
      console.log('Brouillon sauvegardé !');
    }
  }

  // 👇 4. GESTION DE L'AFFICHAGE A4 (COMPTE RENDU)
  afficherApercuCompteRenduA4: boolean = false;

  ouvrirApercuCompteRendu() {
    this.afficherApercuCompteRenduA4 = true;
  }

  // --- VOS DONNÉES DE TEST ---

  historiqueRdv: any[] = [];

  ordonnances = [
    {
      type: 'Standard',
      date_emmission: '15/03/2026',
      contenu_texte: 'Paracétamol 1000mg, 1 boite.',
    },
  ];

  comptesRendus = [
    {
      id: 1,
      date_redaction: '03/04/2026',
      statut: 'Brouillon',
      contenu: 'Patiente vue ce jour pour... (à compléter)',
    },
    {
      id: 2,
      date_redaction: '15/03/2026',
      statut: 'Validé',
      contenu: 'Patiente présentant une légère fatigue. Prescription de bilan sanguin et repos.',
    },
  ];
}
