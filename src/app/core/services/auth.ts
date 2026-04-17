import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private tokenKey = 'jwt_token';

  // Save token after login
  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  // Get token to attach to requests
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // Logout → clear token
  logout(): void {
    localStorage.removeItem(this.tokenKey);
  }
}
