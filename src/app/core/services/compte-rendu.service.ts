import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CompteRendu } from '../models';

@Injectable({ providedIn: 'root' })
export class CompteRenduService {
  private url = `${environment.dossierMedicalUrl}/comptes-rendus`;

  constructor(private http: HttpClient) {}

  getComptesRendusParRdv(idRdv: number): Observable<CompteRendu[]> {
    return this.http.get<CompteRendu[]>(`${this.url}/rdv/${idRdv}`);
  }

  getCompteRenduById(id: number): Observable<CompteRendu> {
    return this.http.get<CompteRendu>(`${this.url}/${id}`);
  }

  demanderCompteRendu(cr: CompteRendu): Observable<CompteRendu> {
    return this.http.post<CompteRendu>(`${this.url}/demande`, cr);
  }

  sauvegarderBrouillon(cr: CompteRendu): Observable<CompteRendu> {
    return this.http.post<CompteRendu>(`${this.url}/brouillon`, cr);
  }

  validerCompteRendu(cr: CompteRendu): Observable<CompteRendu> {
    return this.http.post<CompteRendu>(`${this.url}/valider`, cr);
  }

  mettreAJourBrouillon(id: number, cr: CompteRendu): Observable<CompteRendu> {
    return this.http.put<CompteRendu>(`${this.url}/brouillon/${id}`, cr);
  }

  validerCompteRenduExistant(id: number, cr: CompteRendu): Observable<CompteRendu> {
    return this.http.put<CompteRendu>(`${this.url}/valider/${id}`, cr);
  }
}
