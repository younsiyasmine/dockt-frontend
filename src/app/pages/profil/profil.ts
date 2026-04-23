import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth';
import { PatientService } from '../../core/services/patient.service';
import { Navbar } from '../../patient/navbar/navbar';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, Navbar],
  templateUrl: './profil.html',
  styleUrl: './profil.css',
  changeDetection: ChangeDetectionStrategy.Default,
})
export class ProfilComponent implements OnInit {
  user: any = null;
  dashboardLink: string = '/patient/dashboard';
  patientId: number | null = null;

  editMode = false;
  showPasswordSection = false;
  isLoading = false;

  form: any = {};
  originalForm: any = {};
  displayName = '';

  oldPassword = '';
  newPassword = '';
  confirmPassword = '';
  passwordError = '';
  successMessage = '';
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private patientService: PatientService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.user = this.authService.getUser();

    if (this.user) {
      const u = this.user.user;
      this.patientId = u?.idPatient;

      // Prepend 0 for display (DB stores 9 digits without leading 0)
      const rawPhone = u?.numTelephone?.toString() ?? '';
      const displayPhone = rawPhone ? '0' + rawPhone : '';

      this.form = {
        nom: u?.nom,
        prenom: u?.prenom,
        email: u?.patientLogin,
        cin: u?.cin,
        numTelephone: displayPhone,
        dateNaissance: u?.dateNaissance,
        sexe: u?.sexe,
        adresse: u?.adresse,
      };
      this.originalForm = { ...this.form };
      this.displayName = `${u?.nom ?? ''} ${u?.prenom ?? ''}`.trim();

      if (this.user.role === 'MEDECIN') {
        this.dashboardLink = '/medecin-dashboard';
      } else if (this.user.role === 'SECRETAIRE') {
        this.dashboardLink = '/secretaire-dashboard';
      } else {
        this.dashboardLink = '/patient/dashboard';
      }
    }
  }

  enableEdit() {
    this.editMode = true;
    this.successMessage = '';
    this.errorMessage = '';
  }

  cancelEdit() {
    this.form = { ...this.originalForm };
    this.editMode = false;
  }

  saveChanges() {
    if (!this.patientId) return;

    const phone = this.form.numTelephone?.toString().trim();
    if (!phone || !/^0\d{9}$/.test(phone)) {
      this.errorMessage = 'Le numéro doit contenir exactement 10 chiffres et commencer par 0.';
      setTimeout(() => { this.errorMessage = ''; this.cdr.detectChanges(); }, 3000);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const payload: any = { ...this.form };
    // Strip leading 0 before sending to backend
    payload.numTelephone = Number(phone.slice(1));
    delete payload.email;

    this.patientService.updateProfil(this.patientId, payload).subscribe({
      next: (updatedPatient) => {
        // Rebuild display phone: prepend 0 to whatever backend returns
        const updatedPhone = updatedPatient.numTelephone
          ? '0' + updatedPatient.numTelephone.toString()
          : '';

        this.authService.updateCurrentUser({
          ...this.user.user,
          nom: updatedPatient.nom,
          prenom: updatedPatient.prenom,
          cin: updatedPatient.cin,
          numTelephone: updatedPatient.numTelephone,
          dateNaissance: updatedPatient.dateNaissance,
          sexe: updatedPatient.sexe,
          adresse: updatedPatient.adresse,
        });

        this.form.numTelephone = updatedPhone;
        this.originalForm = { ...this.form };
        this.displayName = `${this.form.nom ?? ''} ${this.form.prenom ?? ''}`.trim();

        if (this.user?.user) {
          this.user.user.nom = updatedPatient.nom;
          this.user.user.prenom = updatedPatient.prenom;
          this.user.user.cin = updatedPatient.cin;
          this.user.user.numTelephone = updatedPatient.numTelephone;
          this.user.user.dateNaissance = updatedPatient.dateNaissance;
          this.user.user.sexe = updatedPatient.sexe;
          this.user.user.adresse = updatedPatient.adresse;
        }

        this.editMode = false;
        this.isLoading = false;
        this.successMessage = 'Profil mis à jour avec succès.';
        this.cdr.detectChanges();
        setTimeout(() => { this.successMessage = ''; this.cdr.detectChanges(); }, 3000);
      },
      error: (err) => {
        console.log('❌ error', err);
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'Erreur lors de la mise à jour.';
        this.cdr.detectChanges();
        setTimeout(() => { this.errorMessage = ''; this.cdr.detectChanges(); }, 3000);
      }
    });
  }

  togglePasswordSection() {
    this.showPasswordSection = !this.showPasswordSection;
    this.oldPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.passwordError = '';
  }

  savePassword() {
    this.passwordError = '';

    if (!this.oldPassword) {
      this.passwordError = 'Veuillez saisir votre ancien mot de passe.';
      return;
    }
    if (!this.newPassword || this.newPassword.length < 8) {
      this.passwordError = 'Le nouveau mot de passe doit contenir au moins 8 caractères.';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.passwordError = 'Les mots de passe ne correspondent pas.';
      return;
    }
    if (this.oldPassword === this.newPassword) {
      this.passwordError = "Le nouveau mot de passe doit être différent de l'ancien.";
      return;
    }
    if (!this.patientId) return;

    this.isLoading = true;
    this.patientService
      .changePassword(this.patientId, this.oldPassword, this.newPassword)
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.showPasswordSection = false;
          this.oldPassword = '';
          this.newPassword = '';
          this.confirmPassword = '';
          this.successMessage = 'Mot de passe mis à jour avec succès.';
          this.cdr.detectChanges();
          setTimeout(() => { this.successMessage = ''; this.cdr.detectChanges(); }, 3000);
        },
        error: (err) => {
          this.isLoading = false;
          this.passwordError = err?.error?.message || 'Ancien mot de passe incorrect.';
          this.cdr.detectChanges();
        },
      });
  }
}
