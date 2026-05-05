import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { CompteRenduService } from '../core/services/compte-rendu.service';
import { CompteRendu } from '../core/models/models';

@Component({
  selector: 'app-vue-compte-rendu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vue-compte-rendu.html',
  styleUrl: './vue-compte-rendu.css',
})
export class VueCompteRendu implements OnInit {
  compteRendu: CompteRendu | null = null;
  loading = true;
  error = false;

  patientName = '';
  medecinName = '';
  rdvDate = '';
  patient: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private compteRenduService: CompteRenduService,
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.compteRenduService.getCompteRenduById(+id).subscribe({
        next: (data: any) => {
          this.compteRendu = data;
          if (data.idRdv) this.chargerInfosCompteRendu(data.idRdv);
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error('Erreur chargement compte rendu', err);
          this.error = true;
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
    } else {
      this.error = true;
      this.loading = false;
    }
  }

  private chargerInfosCompteRendu(idRdv: number): void {
    // RDV + nested patient
    this.http.get<any>(`${environment.apiUrl}/rdv/${idRdv}`).subscribe({
      next: (rdv) => {
        this.rdvDate = rdv.datePrevue ?? '';
        if (rdv.patient) {
          this.patient = rdv.patient;
          this.patientName = `${rdv.patient.prenom} ${rdv.patient.nom}`;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.rdvDate = '';
        this.cdr.detectChanges();
      },
    });

    // Doctor — id=1 for now
    this.http.get<any>(`${environment.authUrl}/medecins/1`).subscribe({
      next: (m) => {
        this.medecinName = `Dr. ${m.nom} ${m.prenom}`;
        this.cdr.detectChanges();
      },
      error: () => {
        this.medecinName = 'Dr. Bouabdellah Souad';
        this.cdr.detectChanges();
      },
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  formatNaissance(dateNaissance: string): string {
    if (!dateNaissance) return '—';
    const date = new Date(dateNaissance);
    const age = new Date().getFullYear() - date.getFullYear();
    return `${date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })} (${age} ans)`;
  }

  retour() {
    window.history.back();
  }

  imprimerDoc() {
    window.print();
  }

  async telechargerPDF() {
    if (!this.compteRendu) return;

    const jsPDF = (await import('jspdf')).default;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    let y = 20;

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text(this.medecinName.toUpperCase(), 15, y);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Compte Rendu Médical', pageWidth - 15, y, { align: 'right' });

    y += 8;
    pdf.setFontSize(12);
    pdf.setTextColor(30, 64, 175);
    pdf.text('Médecin Généraliste', 15, y);
    pdf.setTextColor(0, 0, 0);
    pdf.text(
      `Fait à Oujda, le ${this.formatDate(this.compteRendu.dateRedaction ?? '')}`,
      pageWidth - 15,
      y,
      { align: 'right' },
    );

    y += 7;
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text('15 Avenue Mohammed VI, Oujda', 15, y);
    y += 5;
    pdf.text('Tél : 05 36 78 43 21', 15, y);

    y += 5;
    pdf.setDrawColor(30, 64, 175);
    pdf.setLineWidth(0.5);
    pdf.line(15, y, pageWidth - 15, y);

    y += 12;
    pdf.setFontSize(10);
    pdf.setTextColor(120, 120, 120);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PATIENT(E)', 15, y);
    y += 7;
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text(this.patientName || '—', 15, y);
    y += 6;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(120, 120, 120);
    pdf.text(`RDV réf. ${this.compteRendu.idRdv} — ${this.formatDate(this.rdvDate)}`, 15, y);

    y += 15;
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    const lines = pdf.splitTextToSize(this.compteRendu.contenu, pageWidth - 30);
    pdf.text(lines, 15, y);

    y = 265;
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.3);
    pdf.line(15, y, pageWidth - 15, y);
    y += 8;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Signature du médecin :', pageWidth - 15, y, { align: 'right' });

    const date = this.compteRendu.dateRedaction
      ? new Date(this.compteRendu.dateRedaction).toLocaleDateString('fr-FR').replace(/\//g, '-')
      : 'sans-date';
    const nomPatient = this.patientName.replace(/\s+/g, '-') || 'patient';
    pdf.save(`compte-rendu-${nomPatient}-${date}.pdf`);
  }
}
