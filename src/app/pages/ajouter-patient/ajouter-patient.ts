import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PatientService } from '../../core/services/patient.service';
import { throwError } from 'rxjs';

@Component({
  selector: 'app-ajouter-patient',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ajouter-patient.html',
})
export class AjouterPatientComponent {
  @Output() close = new EventEmitter<void>();
  @Output() patientAdded = new EventEmitter<any>();

  currentStep = 1;
  isSubmitting = false;
  errorMessage = '';
  showPassword = false;

  patientForm: FormGroup;

  showToast = false;
  toastMessage = '';

  constructor(
    private fb: FormBuilder,
    private patientService: PatientService,
  ) {
    this.patientForm = this.fb.group({
      prenom: ['', [Validators.required, Validators.maxLength(100)]],
      nom: ['', [Validators.required, Validators.maxLength(100)]],
      num_telephone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      cin: ['', [Validators.required, Validators.maxLength(20)]],
      sex: ['', Validators.required],
      date_naissance: ['', Validators.required],
      patient_login: ['', [Validators.email, Validators.maxLength(100)]],
      patient_mdp: ['', [Validators.minLength(8), Validators.maxLength(255)]],
      adresse: ['', Validators.maxLength(255)],
    });
  }

  get isStep1Valid(): boolean {
    return ['prenom', 'nom', 'num_telephone', 'cin', 'sex', 'date_naissance'].every(
      (c) => this.patientForm.get(c)?.valid,
    );
  }

  get isFormValid(): boolean {
    const mdp = this.patientForm.get('patient_mdp')?.value;
    if (mdp && mdp.length < 8) return false;
    return this.isStep1Valid;
  }

  getInitials(): string {
    const p = this.patientForm.get('prenom')?.value?.[0]?.toUpperCase() || '';
    const n = this.patientForm.get('nom')?.value?.[0]?.toUpperCase() || '';
    return `${p}${n}`;
  }

  hasInitials(): boolean {
    return !!(this.patientForm.get('prenom')?.value || this.patientForm.get('nom')?.value);
  }

  nextStep() {
    if (this.isStep1Valid) this.currentStep = 2;
  }

  prevStep() {
    this.currentStep = 1;
  }

  onSubmit() {
    if (!this.isFormValid) return;
    this.isSubmitting = true;
    this.errorMessage = '';

    const form = this.patientForm.value;
    const tel = form.num_telephone?.toString().trim();

    const payload = {
      nom: form.nom,
      prenom: form.prenom,
      numTelephone: tel && /^\d+$/.test(tel) ? parseInt(tel, 10) : null,
      cin: form.cin || null,
      sex: form.sex === 'Homme' ? true : form.sex === 'Femme' ? false : null,
      dateNaissance: form.date_naissance || null,
      adresse: form.adresse || null,
      email: form.patient_login || null,
      password: form.patient_mdp || null,
    };


    this.patientService.createPatient(payload).subscribe({
      next: (created) => {
        this.patientAdded.emit(created);
        this.isSubmitting = false;

        // ✅ Show success toast
        this.toastMessage = 'Patient Ajouté avec succès ✅';
        this.showToast = true;

        // ✅ Auto hide toast after 2s and THEN close modal
        setTimeout(() => {
          this.showToast = false;
          this.onClose();
        }, 2000);
        },

      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err?.error?.message || 'Erreur lors de la création du patient.';
      },
    });
  }

  onClose() {
    this.patientForm.reset();
    this.currentStep = 1;
    this.errorMessage = '';
    this.close.emit();
  }

  onBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) this.onClose();
  }
}
