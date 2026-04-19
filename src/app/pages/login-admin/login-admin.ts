import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-login-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login-admin.html',
  styleUrl: './login-admin.css'
})
export class LoginAdminComponent {

  login = '';
  password = '';
  selectedRole = 'MEDECIN';
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    this.errorMessage = '';

    if (this.selectedRole === 'MEDECIN') {
      this.authService.loginMedecin({ login: this.login, password: this.password })
        .subscribe({
          next: (response) => this.handleSuccess(response),
          error: () => this.errorMessage = 'Login ou mot de passe incorrect'
        });
    } else {
      this.authService.loginSecretaire({ login: this.login, password: this.password })
        .subscribe({
          next: (response) => this.handleSuccess(response),
          error: () => this.errorMessage = 'Login ou mot de passe incorrect'
        });
    }
  }

  handleSuccess(response: any) {
    this.authService.saveToken(response.accessToken);
    this.authService.saveRefreshToken(response.refreshToken);
    this.authService.saveUser(response);

    if (response.role === 'MEDECIN') {
      this.router.navigate(['/medecin-dashboard']);
    } else {
      this.router.navigate(['/secretaire-dashboard']);
    }
  }
}
