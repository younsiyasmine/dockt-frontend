import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Sidebar } from '../sidebar/sidebar';
import { Topbar } from '../topbar/topbar';
import { AuthService } from '../../core/services/auth';
import {
  MedecinResponse,
  SecretaireResponse
} from '../../core/models/auth.model';

@Component({
  selector: 'app-parametres',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, Topbar],
  templateUrl: './parametres.html',
})
export class Parametres implements OnInit {
  showPasswordSection = false;
  isLoading = true;

  showCreateMedecin = false;
  showCreateSecretaire = false;
  isCreating = false;

  toast = { show: false, message: '', type: 'success' as 'success' | 'error' };

  newMedecin = {
    medLogin: '',
    medMdp: '',
    nom: '',
    prenom: '',
    cin: '',
    telephone: '',
    specialite: '',
  };

  newSecretaire = {
    secLogin: '',
    secPassword: '',
    nom: '',
    prenom: '',
    cin: '',
    telephone: '',
  };

  medecinSubmitted = false;
  secretaireSubmitted = false;

  role: 'MEDECIN' | 'SECRETAIRE' | null = null;
  userId: number | null = null;

  profil = {
    prenom: '',
    nom: '',
    specialite: '',
    telephone: '',
    cin: '',
    login: '',
  };

  passwords = {
    ancien: '',
    nouveau: '',
    confirmation: '',
  };

  private readonly apiBase = 'http://localhost:8082/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  // ───────────────── INIT ─────────────────
  ngOnInit(): void {
    const auth = this.authService.getUser();
    if (!auth) {
      this.isLoading = false;
      return;
    }

    this.role = auth.role as any;
    this.userId = this.authService.getCurrentUserId();

    if (!this.userId) {
      this.isLoading = false;
      return;
    }

    if (this.role === 'MEDECIN') this.loadMedecin();
    else if (this.role === 'SECRETAIRE') this.loadSecretaire();
  }

  // ───────────────── LOADERS ─────────────────

  private loadMedecin() {
    this.http.get<MedecinResponse>(`${this.apiBase}/medecins/${this.userId}`).subscribe({
      next: (m) => {
        this.profil = {
          prenom: m.prenom ?? '',
          nom: m.nom ?? '',
          specialite: m.specialite ?? '',
          telephone: this.formatPhone(m.telephone ?? ''),
          cin: m.cin ?? '',
          login: m.medLogin ?? '',
        };
        this.finishLoading();
      },
      error: () => this.finishLoading(),
    });
  }

  private loadSecretaire() {
    this.http.get<SecretaireResponse>(`${this.apiBase}/secretaires/${this.userId}`).subscribe({
      next: (s) => {
        this.profil = {
          prenom: s.prenom ?? '',
          nom: s.nom ?? '',
          specialite: '',
          telephone: this.formatPhone(s.telephone ?? ''),
          cin: s.cin ?? '',
          login: s.secLogin ?? '',
        };
        this.finishLoading();
      },
      error: () => this.finishLoading(),
    });
  }

  private loadPatient() {
    this.http.get<any>(`${this.apiBase}/patients/my_account`).subscribe({
      next: (p) => {
        this.profil = {
          prenom: p.prenom ?? '',
          nom: p.nom ?? '',
          specialite: '',
          telephone: this.formatPhone(p.numTelephone ?? ''),
          cin: p.cin ?? '',
          login: p.email ?? '',
        };
        this.finishLoading();
      },
      error: () => this.finishLoading(),
    });
  }

  // ───────────────── SAVE PROFILE ─────────────────

  sauvegarder(): void {
    if (!this.userId || !this.role) return;

    if (this.showPasswordSection && this.passwords.nouveau) {
      if (this.passwords.nouveau !== this.passwords.confirmation) {
        return this.showError('Les mots de passe ne correspondent pas.');
      }
    }

    if (this.role === 'MEDECIN') this.saveMedecin();
    else if (this.role === 'SECRETAIRE') this.saveSecretaire();
  }

  private saveMedecin() {
    const body = {
      nom: this.profil.nom,
      prenom: this.profil.prenom,
      telephone: this.profil.telephone,
    };
    this.http.put(`${this.apiBase}/medecins/${this.userId}`, body).subscribe({
      next: () => this.handlePasswordThenSuccess('medecins'),
      error: (e) => this.showError(e?.error?.message || 'Erreur lors de la mise à jour du profil.'),
    });
  }

  private saveSecretaire() {
    const body = {
      nom: this.profil.nom,
      prenom: this.profil.prenom,
      telephone: this.profil.telephone,
    };
    this.http.put(`${this.apiBase}/secretaires/${this.userId}`, body).subscribe({
      next: () => this.handlePasswordThenSuccess('secretaires'),
      error: (e) => this.showError(e?.error?.message || 'Erreur lors de la mise à jour du profil.'),
    });
  }

  private savePatient() {
    const body = {
      nom: this.profil.nom,
      prenom: this.profil.prenom,
      numTelephone: this.profil.telephone,
    };
    this.http.put(`${this.apiBase}/patients/${this.userId}`, body).subscribe({
      next: () => this.handlePasswordThenSuccess('patients'),
      error: (e) => this.showError(e?.error?.message || 'Erreur lors de la mise à jour du profil.'),
    });
  }

  // ───────────────── PASSWORD ─────────────────

  private handlePasswordThenSuccess(endpoint: string) {
    if (this.showPasswordSection && this.passwords.nouveau) {
      this.http
        .put(`${this.apiBase}/${endpoint}/${this.userId}/change-password`, {
          ancienMdp: this.passwords.ancien,
          nouveauMdp: this.passwords.nouveau,
        })
        .subscribe({
          next: () => this.showSuccess('Mot de passe mis à jour avec succès !'),
          error: (e) => this.showError(e?.error?.message || 'Mot de passe actuel incorrect.'),
        });
    } else {
      this.showSuccess('Modifications enregistrées avec succès !');
    }
  }

  // ───────────────── CREATE ACCOUNTS ─────────────────

  toggleCreateMedecin(): void {
    this.showCreateMedecin = !this.showCreateMedecin;
    this.showCreateSecretaire = false;
    this.medecinSubmitted = false;
  }

  toggleCreateSecretaire(): void {
    this.showCreateSecretaire = !this.showCreateSecretaire;
    this.showCreateMedecin = false;
    this.secretaireSubmitted = false;
  }

  createMedecin(): void {
    this.medecinSubmitted = true;
    const { medLogin, medMdp, nom, prenom, cin, telephone, specialite } = this.newMedecin;

    if (!nom || !prenom || !cin || !specialite) return;
    if (!medLogin || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(medLogin)) return;
    if (!medMdp || medMdp.length < 8) return;
    if (!/^\d{10}$/.test(telephone)) return;

    this.isCreating = true;
    this.http.post(`${this.apiBase}/medecins`, this.newMedecin).subscribe({
      next: () => {
        this.isCreating = false;
        this.showCreateMedecin = false;
        this.medecinSubmitted = false;
        this.newMedecin = {
          medLogin: '',
          medMdp: '',
          nom: '',
          prenom: '',
          cin: '',
          telephone: '',
          specialite: '',
        };
        this.showToast('Compte médecin créé avec succès !');
      },
      error: (e) => {
        this.isCreating = false;
        this.showError(e?.error?.message || 'Erreur lors de la création du compte médecin.');
      },
    });
  }

  createSecretaire(): void {
    this.secretaireSubmitted = true;
    const { secLogin, secPassword, nom, prenom, cin, telephone } = this.newSecretaire;

    if (!nom || !prenom || !cin) return;
    if (!secLogin || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(secLogin)) return;
    if (!secPassword || secPassword.length < 8) return;
    if (!/^\d{10}$/.test(telephone)) return;

    this.isCreating = true;
    this.http.post(`${this.apiBase}/secretaires`, this.newSecretaire).subscribe({
      next: () => {
        this.isCreating = false;
        this.showCreateSecretaire = false;
        this.secretaireSubmitted = false;
        this.newSecretaire = {
          secLogin: '',
          secPassword: '',
          nom: '',
          prenom: '',
          cin: '',
          telephone: '',
        };
        this.showToast('Compte secrétaire créé avec succès !');
      },
      error: (e) => {
        this.isCreating = false;
        this.showError(e?.error?.message || 'Erreur lors de la création du compte secrétaire.');
      },
    });
  }

  // ───────────────── TOAST HELPERS ─────────────────

  private showToast(message: string, type: 'success' | 'error' = 'success'): void {
    this.toast = { show: true, message, type };
    this.cdr.markForCheck();
    setTimeout(() => {
      this.toast.show = false;
      this.cdr.markForCheck();
    }, 3000);
  }

  private showSuccess(message: string = 'Modifications enregistrées avec succès !'): void {
    this.passwords = { ancien: '', nouveau: '', confirmation: '' };
    this.showPasswordSection = false;
    this.showToast(message);
  }

  private showError(msg: string): void {
    this.showToast(msg || 'Une erreur est survenue.', 'error');
  }

  // ───────────────── HELPERS ─────────────────

  private formatPhone(phone: string): string {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    return digits.startsWith('0') ? digits : '0' + digits;
  }

  private finishLoading() {
    this.isLoading = false;
    this.cdr.markForCheck();
  }

  // ───────────────── VALIDATION HELPERS ─────────────────

  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  isValidPhone(phone: string): boolean {
    return /^\d{10}$/.test(phone);
  }
}
