// services/patient.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PatientService {

  private api = 'http://localhost:8082/api/patients';

  constructor(private http: HttpClient) {}

  getPatients(search?: string): Observable<any[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    return this.http.get<any[]>(this.api, { params });
  }

  getStats(): Observable<any> {
    return this.http.get<any>(`${this.api}/stats`);
  }
}
