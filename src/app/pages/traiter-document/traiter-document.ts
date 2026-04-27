import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Topbar } from '../topbar/topbar';
import { Sidebar } from '../sidebar/sidebar';
import { DicterCompteRendu } from '../../dicter-compte-rendu/dicter-compte-rendu';
import { CompteRenduService } from '../../core/services/compte-rendu.service';
import { CompteRendu } from '../../core/models/models';

@Component({
  selector: 'app-traiter-document',
  imports: [CommonModule, Topbar, Sidebar, DicterCompteRendu],
  templateUrl: './traiter-document.html',
  styleUrl: './traiter-document.css',
})
export class TraiterDocument implements OnInit {
  constructor(
    private compteRenduService: CompteRenduService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}

  demandes: CompteRendu[] = [];
  patientNames: Record<number, string> = {};
  isLoading = true;

  // Modal state
  modaleOuverte = false;
  crSelectionne: CompteRendu | null = null;
  patientNomSelectionne = '';

  ngOnInit() {
    this.compteRenduService.getComptesRendusParStatut('DEMANDE').subscribe({
      next: (data) => {
        this.demandes = data;
        // fetch patient name for each unique rdv
        const rdvIds = [...new Set(data.map((cr) => cr.idRdv))];
        rdvIds.forEach((rdvId) => {
          this.http.get<any>(`http://localhost:8081/api/rdv/${rdvId}`).subscribe({
            next: (rdv) => {
              if (rdv.idPatient) {
                this.http
                  .get<any>(`http://localhost:8082/api/patients/${rdv.idPatient}`)
                  .subscribe({
                    next: (p) => {
                      this.patientNames[rdvId] = `${p.prenom} ${p.nom}`;
                      this.cdr.detectChanges();
                    },
                  });
              }
            },
          });
        });
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  ouvrirModale(cr: CompteRendu) {
    this.crSelectionne = cr;
    this.patientNomSelectionne = this.patientNames[cr.idRdv] ?? '';
    this.modaleOuverte = true;
  }

  fermerModale() {
    this.modaleOuverte = false;
    this.crSelectionne = null;
  }

  terminer(event: { action: 'brouillon' | 'valider'; cr: CompteRendu }) {
    this.modaleOuverte = false;
    if (event.action === 'valider') {
      this.demandes = this.demandes.filter((cr) => cr.idCr !== this.crSelectionne?.idCr);
    }
    this.crSelectionne = null;
    this.ngOnInit();
  }
}
