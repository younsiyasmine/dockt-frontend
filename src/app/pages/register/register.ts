import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {

  email = '';        // ← était patientLogin
  password = '';     // ← était patientMdp
  nom = '';
  prenom = '';
  cin = '';
  sex = true;
  numTelephone: string = '';
  dateNaissance = '';
  adresse = '';
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    this.errorMessage = '';

    if (!this.email || !this.password || !this.nom || !this.prenom || !this.cin) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      return;
    }

    this.authService.register({
      email: this.email,
      password: this.password,
      nom: this.nom,
      prenom: this.prenom,
      cin: this.cin,
      sex: this.sex,
      numTelephone: this.numTelephone,
      dateNaissance: this.dateNaissance,
      adresse: this.adresse
    }).subscribe({
      next: (response) => {
        this.authService.saveToken(response.accessToken);
        this.authService.saveRefreshToken(response.refreshToken);
        this.authService.saveUser(response);
        this.router.navigate(['/patient-dashboard']);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || err.error?.error || 'Erreur lors de l\'inscription';
      }
    });
  }


}
