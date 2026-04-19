import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ActeMedicale } from '../models/models'; // ← import from models

@Injectable({ providedIn: 'root' })
export class ActeMedicaleService {
  private url = `${environment.apiUrl}/actes`;

  constructor(private http: HttpClient) {}

  getAllActes(): Observable<ActeMedicale[]> {
    return this.http.get<ActeMedicale[]>(`${this.url}/all`);
  }

  searchActes(nom: string): Observable<ActeMedicale[]> {
    return this.http.get<ActeMedicale[]>(`${this.url}/search?nom=${nom}`);
  }

  addActe(acte: ActeMedicale): Observable<ActeMedicale> {
    return this.http.post<ActeMedicale>(`${this.url}/add`, acte);
  }

  updateActe(id: number, acte: ActeMedicale): Observable<ActeMedicale> {
    return this.http.put<ActeMedicale>(`${this.url}/update/${id}`, acte);
  }

  deleteActe(id: number): Observable<any> {
    return this.http.delete(`${this.url}/delete/${id}`);
  }
}
