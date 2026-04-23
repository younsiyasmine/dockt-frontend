import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RdvService } from '../../core/services/rdv.service';
import { RDV } from '../../core/models/models';
import { Router } from '@angular/router';
import { Sidebar } from '../../pages/sidebar/sidebar';
import { Topbar } from '../../pages/topbar/topbar';

interface RdvData {
  id_rdv: number;
  date_prevue: Date;
  heure_prevue: string;
  patientNom: string;
  statut_consultation: string;
  colorClass: string;
  statutRdv: string;
}

const COLORS = [
  'bg-[#dcfce7] text-[#166534] border-[#bbf7d0]',
  'bg-[#dbeafe] text-[#1e40af] border-[#bfdbfe]',
  'bg-[#e0f7fa] text-[#006064] border-[#b2ebf2]',
  'bg-[#fef9c3] text-[#854d0e] border-[#fef08a]',
  'bg-[#fce7f3] text-[#9d174d] border-[#fbcfe8]',
];

@Component({
  selector: 'app-planning',
  standalone: true,
  imports: [CommonModule, RouterModule, Sidebar, Topbar],
  templateUrl: './planning.html',
  styleUrls: ['./planning.css'],
})
export class Planning implements OnInit {
  currentDate: Date = new Date();
  daysOfWeek: any[] = [];
  hours = [
    '8:00',
    '8:30',
    '9:00',
    '9:30',
    '10:00',
    '10:30',
    '11:00',
    '11:30',
    '12:00',
    '12:30',
    '13:00',
    '13:30',
    '14:00',
    '14:30',
    '15:00',
    '15:30',
    '16:00',
    '16:30',
    '17:00',
    '17:30',
    '18:00',
    '18:30',
    '19:00',
    '19:30',
  ];

  role: 'MEDECIN' | 'SECRETAIRE' | null = null;

  selectedRdv: RdvData | null = null;
  menuX = 0;
  menuY = 0;
  showMenu = false;
  showConfirmDelete = false;
  showToast = false;
  toastMessage = '';

  rdvList: RdvData[] = [];

  constructor(
    private rdvService: RdvService,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const auth = JSON.parse(localStorage.getItem('user') || 'null');
    this.role = auth?.role ?? null;

    this.generateWeek();
    this.loadRdvs();
  }

  loadRdvs(): void {
    this.rdvService.listerTousLesRDV().subscribe({
      next: (rdvs: RDV[]) => {
        this.rdvList = rdvs.map((rdv, index) => {
          const patientNom = rdv.patient
            ? `${rdv.patient.prenom} ${rdv.patient.nom}`
            : `Patient #${rdv.idPatient}`;

          const statut_consultation =
            rdv.medActeRdvs?.[0]?.acteMedicale?.libelleActe ?? 'Consultation';

          const [year, month, day] = (rdv.datePrevue as string).split('-').map(Number);
          const date_prevue = new Date(year, month - 1, day);

          const heure_prevue = rdv.heurePrevue
            ? rdv.heurePrevue.substring(0, 5).replace(/^0/, '')
            : '';

          return {
            id_rdv: rdv.id!,
            date_prevue,
            heure_prevue,
            patientNom,
            statut_consultation,
            colorClass: COLORS[index % COLORS.length],
            statutRdv: rdv.statutRdv ?? '',
          };
        });
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erreur chargement planning:', err),
    });
  }

  generateWeek() {
    this.daysOfWeek = [];
    const labels = ['LUN.', 'MAR.', 'MER.', 'JEU.', 'VEN.', 'SAM.', 'DIM.'];
    let start = new Date(this.currentDate);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);

    for (let i = 0; i < 7; i++) {
      let d = new Date(start);
      d.setDate(start.getDate() + i);
      this.daysOfWeek.push({
        label: labels[i],
        date: d.getDate(),
        fullDate: d,
        isToday: d.toDateString() === new Date().toDateString(),
      });
    }
  }

  get currentMonthLabel(): string {
    return this.currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }

  prevWeek() {
    this.currentDate = new Date(this.currentDate);
    this.currentDate.setDate(this.currentDate.getDate() - 7);
    this.generateWeek();
  }

  nextWeek() {
    this.currentDate = new Date(this.currentDate);
    this.currentDate.setDate(this.currentDate.getDate() + 7);
    this.generateWeek();
  }

  getAppForCell(hour: string, dayDate: Date): RdvData | undefined {
    return this.rdvList.find(
      (rdv) =>
        rdv.heure_prevue === hour && rdv.date_prevue.toDateString() === dayDate.toDateString(),
    );
  }

  openMenu(event: MouseEvent, rdv: RdvData): void {
    event.stopPropagation();
    this.selectedRdv = rdv;
    this.menuX = event.clientX;
    this.menuY = event.clientY;
    this.showMenu = true;
  }

  closeMenu(): void {
    this.showMenu = false;
    this.selectedRdv = null;
  }

  modifierRdv(): void {
    if (!this.selectedRdv) return;
    const id = this.selectedRdv.id_rdv;
    this.closeMenu();
    this.router.navigate(['/ajouter-rdv', id]);
  }

  demanderConfirmationSuppression(): void {
    this.showMenu = false;
    this.showConfirmDelete = true;
  }

  annulerSuppression(): void {
    this.showConfirmDelete = false;
    this.selectedRdv = null;
  }

  confirmerSuppression(): void {
    if (!this.selectedRdv) return;
    const id = this.selectedRdv.id_rdv;
    this.showConfirmDelete = false;
    this.selectedRdv = null;

    this.rdvService.supprimerRDV(id).subscribe({
      next: () => {
        this.rdvList = this.rdvList.filter((r) => r.id_rdv !== id);
        this.toastMessage = 'Rendez-vous supprimé avec succès !';
        this.showToast = true;
        setTimeout(() => {
          this.showToast = false;
          this.cdr.detectChanges();
        }, 3000);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erreur suppression RDV:', err),
    });
  }

  get isSelectedRdvPasse(): boolean {
    if (!this.selectedRdv) return false;
    return this.selectedRdv.statutRdv === 'PASSE';
  }
}
