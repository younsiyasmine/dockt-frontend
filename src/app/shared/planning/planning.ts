import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RdvService } from '../../core/services/rdv.service';
import { RDV } from '../../core/models';

interface RdvData {
  id_rdv: number;
  date_prevue: Date;
  heure_prevue: string;
  patientNom: string;
  statut_consultation: string;
  colorClass: string;

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
  imports: [CommonModule, RouterModule],
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

  selectedRdv: RdvData | null = null;
  menuX = 0;
  menuY = 0;
  showMenu = false;

  rdvList: RdvData[] = [];

  constructor(
    private rdvService: RdvService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.generateWeek();
    this.loadRdvs();
  }

  loadRdvs(): void {
    this.rdvService.listerTousLesRDV().subscribe({
      next: (rdvs: RDV[]) => {
        this.rdvList = rdvs.map((rdv, index) => {
          // Patient name: use patient object if available, fallback to ID
          const patientNom = rdv.patient
            ? `${rdv.patient.prenom} ${rdv.patient.nom}`
            : `Patient #${rdv.idPatient}`;

          // Acte: first medActeRdv's libelleActe if available
          const statut_consultation =
            rdv.medActeRdvs?.[0]?.acteMedicale?.libelleActe ?? 'Consultation';

          // Parse date
          const [year, month, day] = (rdv.datePrevue as string).split('-').map(Number);
          const date_prevue = new Date(year, month - 1, day);

          // Parse time: "09:00:00" → "9:00"
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
}
