import { Component, ChangeDetectorRef } from '@angular/core'; // 1. Ajout de ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {

  login = '';
  password = '';
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef // 2. Injecter le détecteur de changement
  ) {}

  onSubmit() {
    this.errorMessage = '';

    // Vérification basique avant l'appel API
    if (!this.login || !this.password) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      return;
    }

    this.authService.loginPatient({ email: this.login, password: this.password })
      .subscribe({
        next: (response) => {
          // Stockage des informations
          this.authService.saveToken(response.accessToken);
          this.authService.saveRefreshToken(response.refreshToken);
          this.authService.saveUser(response);

          // Navigation vers le dashboard
          this.router.navigate(['/patient-dashboard']);
        },
        error: (err) => {
          console.error('Login error:', err);
          // 3. Mise à jour du message
          this.errorMessage = 'Email ou mot de passe incorrect';

          // 4. Forcer Angular à rafraîchir la vue (par précaution)
          this.cdr.detectChanges();
        }
      });
  }
}
