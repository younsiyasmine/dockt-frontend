import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface RdvData {
  id_rdv: number;
  date_prevue: Date;
  heure_prevue: string;
  patientNom: string;
  statut_consultation: string;
  colorClass: string;
}

@Component({
  selector: 'app-planning',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './planning.html',
  styleUrls: ['./planning.css'],
})
export class Planning implements OnInit {
  currentDate: Date = new Date(2026, 1, 2);
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
  ];

  rdvList: RdvData[] = [
    {
      id_rdv: 1,
      date_prevue: new Date(2026, 1, 5),
      heure_prevue: '9:00',
      patientNom: 'Marie Dubois',
      statut_consultation: 'Consultation de suivi diabète',
      colorClass: 'bg-[#dcfce7] text-[#166534] border-[#bbf7d0]',
    },
    {
      id_rdv: 2,
      date_prevue: new Date(2026, 1, 5),
      heure_prevue: '10:00',
      patientNom: 'Jean Martin',
      statut_consultation: 'Contrôle tension artérielle',
      colorClass: 'bg-[#dbeafe] text-[#1e40af] border-[#bfdbfe]',
    },
    {
      id_rdv: 3,
      date_prevue: new Date(2026, 1, 5),
      heure_prevue: '11:00',
      patientNom: 'Sophie Bernard',
      statut_consultation: 'Consultation générale',
      colorClass: 'bg-[#e0f7fa] text-[#006064] border-[#b2ebf2]',
    },
    {
      id_rdv: 4,
      date_prevue: new Date(2026, 1, 5),
      heure_prevue: '14:00',
      patientNom: 'Pierre Petit',
      statut_consultation: 'Renouvellement ordonnance',
      colorClass: 'bg-[#e0f7fa] text-[#006064] border-[#b2ebf2]',
    },
    {
      id_rdv: 5,
      date_prevue: new Date(2026, 1, 5),
      heure_prevue: '15:00',
      patientNom: 'Claire Robert',
      statut_consultation: 'Résultats analyses',
      colorClass: 'bg-[#e0f7fa] text-[#006064] border-[#b2ebf2]',
    },
  ];

  ngOnInit(): void {
    this.generateWeek();
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

  isFullHour(hour: string): boolean {
    return hour.endsWith(':00');
  }
}
