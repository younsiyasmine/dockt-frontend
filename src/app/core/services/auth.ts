import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  LoginPatientRequest,
  LoginMedecinRequest,
  LoginSecretaireRequest,
  RegisterPatientRequest,
  AuthResponse,
} from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:8082/api/auth';

  // reactive user stream — topbar subscribes to this
  private userSubject = new BehaviorSubject<any>(
    (() => {
      const u = JSON.parse(localStorage.getItem('user') || 'null');
      return u?.user ?? u;
    })(),
  );
  user$ = this.userSubject.asObservable();

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

  getRole(): string | null {
    const user = this.getUser();
    return user?.role ?? null;
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
    const fresh = (user as any)?.user ?? user;
    this.userSubject.next(fresh); // push to reactive stream
  }

  updateCurrentUser(userData: any): void {
    this.userSubject.next(userData); // push fresh data to all subscribers instantly
    const stored = this.getUser() as any;
    if (stored) {
      stored.user = userData;
      localStorage.setItem('user', JSON.stringify(stored));
    }
  }

  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getUser(): AuthResponse | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  getCurrentUserId(): number | null {
    const response = this.getUser();
    if (!response) return null;
    const user = (response as any).user ?? response;
    if ('idPatient' in user) return (user as any).idPatient;
    if ('idMedecin' in user) return (user as any).idMedecin;
    if ('idSecretaire' in user) return (user as any).idSecretaire;
    return null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    this.userSubject.next(null); // clear the stream on logout
  }
}
