import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RDV } from '../models'; // ← import from models

@Injectable({ providedIn: 'root' })
export class FileAttenteService {
  private url = `${environment.apiUrl}/file-attente`;

  constructor(private http: HttpClient) {}

  getFileDuJour(): Observable<RDV[]> {
    return this.http.get<RDV[]>(`${this.url}/today`);
  }

  getFileDuJourAvecDetails(): Observable<RDV[]> {
    return this.http.get<RDV[]>(`${this.url}/today/details`);
  }

  getRdvsByPatient(idPatient: number): Observable<RDV[]> {
    return this.http.get<RDV[]>(`${this.url}/patient/${idPatient}`);
  }

  checkIn(idRdv: number): Observable<RDV> {
    return this.http.put<RDV>(`${this.url}/checkin/${idRdv}`, {});
  }

  updateStatutConsultation(idRdv: number, statut: string): Observable<RDV> {
    return this.http.put<RDV>(
      `${this.url}/statut-consultation/${idRdv}?statutConsultation=${statut}`,
      {},
    );
  }

  getWaitTime(idRdv: number): Observable<number> {
    return this.http.get<number>(`${this.url}/wait-time/${idRdv}`);
  }
}
