import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RDV } from '../models';

@Injectable({ providedIn: 'root' })
export class RdvService {
  private apiUrl = `${environment.apiUrl}/rdv`;

  constructor(private http: HttpClient) {}

  listerTousLesRDV(): Observable<RDV[]> {
    return this.http.get<RDV[]>(this.apiUrl);
  }

  getRDVByPatient(idPatient: number): Observable<RDV[]> {
    return this.http.get<RDV[]>(`${this.apiUrl}/patient/${idPatient}`);
  }

  ajouterRDV(nouveauRdv: RDV): Observable<RDV> {
    return this.http.post<RDV>(`${this.apiUrl}/ajouter`, nouveauRdv);
  }

  mettreAJourStatut(id: number, statut: string): Observable<RDV> {
    let params = new HttpParams().set('statut', statut);
    return this.http.put<RDV>(`${this.apiUrl}/${id}/statut`, null, { params });
  }

  supprimerRDV(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/supprimer/${id}`, { responseType: 'text' });
  }
}
