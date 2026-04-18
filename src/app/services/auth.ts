import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  LoginPatientRequest,
  LoginMedecinRequest,
  LoginSecretaireRequest,
  RegisterPatientRequest,
  AuthResponse
} from '../core/models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost:8082/api/auth';

  constructor(private http: HttpClient) {}

  loginPatient(request: LoginPatientRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login/patient`, request);
  }

  loginMedecin(request: LoginMedecinRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login/medecin`, request);
  }

  loginSecretaire(request: LoginSecretaireRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login/secretaire`, request);
  }

  register(request: RegisterPatientRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register/patient`, request);
  }

  saveToken(token: string): void {
    localStorage.setItem('accessToken', token);
  }

  saveRefreshToken(token: string): void {
    localStorage.setItem('refreshToken', token);
  }

  saveUser(user: AuthResponse): void {
    localStorage.setItem('user', JSON.stringify(user));
  }

  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getUser(): AuthResponse | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

}
