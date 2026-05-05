import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Ordonnance } from '../models/models';

@Injectable({ providedIn: 'root' })
export class OrdonnanceService {
  private url = `${environment.dossierMedicalUrl}/ordonnances`;

  constructor(private http: HttpClient) {}

  // ✅ NEW — for patient history view
  getOrdonnancesParPatient(patientId: number): Observable<Ordonnance[]> {
    return this.http.get<Ordonnance[]>(`${this.url}/patient/${patientId}`);
  }

  getOrdonnancesParRdv(idRdv: number): Observable<Ordonnance[]> {
    return this.http.get<Ordonnance[]>(`${this.url}/rdv/${idRdv}`);
  }

  getOrdonnanceById(id: number): Observable<Ordonnance> {
    return this.http.get<Ordonnance>(`${this.url}/${id}`);
  }

  sauvegarderOrdonnance(ordonnance: Ordonnance): Observable<Ordonnance> {
    return this.http.post<Ordonnance>(this.url, ordonnance);
  }
}
