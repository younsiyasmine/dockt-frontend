import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { OrdonnanceService } from '../core/services/ordonnance.service';
import { Ordonnance } from '../core/models/models';

@Component({
  selector: 'app-vue-ordonnance',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vue-ordonnance.html',
  styleUrl: './vue-ordonnance.css',
})
export class VueOrdonnance implements OnInit {
  ordonnance: Ordonnance | null = null;
  loading = true;
  error = false;

  patientName = '';
  medecinName = '';
  rdvDate = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ordonnanceService: OrdonnanceService,
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.ordonnanceService.getOrdonnanceById(+id).subscribe({
        next: (data: any) => {
          this.ordonnance = data;
          if (data.idRdv) this.chargerInfosOrdonnance(data.idRdv);
          this.loading = false;
          this.cdr.detectChanges(); // ← ADD
        },
        error: (err: any) => {
          console.error('Erreur chargement ordonnance', err);
          this.error = true;
          this.loading = false;
          this.cdr.detectChanges(); // ← ADD
        },
      });
    }
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

  private chargerInfosOrdonnance(idRdv: number): void {
    // One call gets RDV + nested patient
    this.http.get<any>(`${environment.apiUrl}/rdv/${idRdv}`).subscribe({
      next: (rdv) => {
        this.rdvDate = rdv.datePrevue ?? '';
        if (rdv.patient) {
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
        this.medecinName = 'Dr. Inconnu';
        this.cdr.detectChanges();
      },
    });
  }

  retour() {
    window.history.back();
  }

  imprimerDoc() {
    window.print();
  }

  async telechargerPDF() {
    if (!this.ordonnance) return;

    const jsPDF = (await import('jspdf')).default;
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pageWidth = pdf.internal.pageSize.getWidth();
    let y = 20;

    // Header - Doctor info
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(this.medecinName.toUpperCase(), 15, y);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text('DOCKT', pageWidth - 15, y, { align: 'right' });

    y += 8;
    pdf.setFontSize(12);
    pdf.setTextColor(0, 150, 136);
    pdf.text('Médecin Généraliste', 15, y);
    pdf.setTextColor(0, 0, 0);
    pdf.text(
      `Fait à Oujda, le ${this.formatDate(this.ordonnance.dateEmmission ?? '')}`,
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
    pdf.setTextColor(0, 0, 0);

    y += 5;
    pdf.setDrawColor(0, 150, 136);
    pdf.setLineWidth(0.5);
    pdf.line(15, y, pageWidth - 15, y);

    // Patient
    y += 15;
    pdf.setFontSize(10);
    pdf.setTextColor(120, 120, 120);
    pdf.text('PRESCRIPTION POUR', pageWidth / 2, y, { align: 'center' });
    y += 8;
    pdf.setFontSize(18);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'bold');
    pdf.text(this.patientName || '— Patient —', pageWidth / 2, y, { align: 'center' });
    y += 6;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(120, 120, 120);
    pdf.text(
      `RDV réf. ${this.ordonnance.idRdv} — ${this.formatDate(this.rdvDate)}`,
      pageWidth / 2,
      y,
      { align: 'center' },
    );

    // Content
    y += 15;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    const lines = pdf.splitTextToSize(this.ordonnance.contenuTexte, pageWidth - 30);
    pdf.text(lines, 15, y);

    // Footer - only signature
    y = 265;
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.3);
    pdf.line(15, y, pageWidth - 15, y);
    y += 8;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Signature et Cachet :', pageWidth - 15, y, { align: 'right' });

    const date = this.ordonnance.dateEmmission
      ? new Date(this.ordonnance.dateEmmission).toLocaleDateString('fr-FR').replace(/\//g, '-')
      : 'sans-date';
    const nomPatient = this.patientName.replace(/\s+/g, '-') || 'patient';
    pdf.save(`ordonnance-${nomPatient}-${date}.pdf`);

  }
}
