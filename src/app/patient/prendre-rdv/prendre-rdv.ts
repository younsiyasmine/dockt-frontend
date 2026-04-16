import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { Navbar } from '../navbar/navbar';
import { RdvService } from '../../core/services/rdv.service';
import { RDV, StatutRDV } from '../../core/models';

interface CalendarDay {
  number: number | string;
  disabled: boolean;
  selected: boolean;
}

interface TimeSlot {
  time: string;
  available: boolean;
  selected: boolean;
}

@Component({
  selector: 'app-prendre-rdv',
  standalone: true,
  imports: [CommonModule, RouterLink, Navbar],
  templateUrl: './prendre-rdv.html',
  styleUrl: './prendre-rdv.css',
})
export class PrendreRdv implements OnInit {
  isEditMode = false;
  rdvId: string | null = null;


  isLoading = false;
  isSlotsLoading = false;
  errorMessage = '';

  currentDate = new Date();
  selectedDate: CalendarDay | null = null;
  selectedSlot: TimeSlot | null = null;
  dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  calendarDays: CalendarDay[] = [];
  // Add these to your class properties
  selectedDayNumber: number | null = null;
  selectedMonth: number | null = null;
  selectedYear: number | null = null;

  readonly ALL_SLOTS = [
    '09:00',
    '09:30',
    '10:00',
    '10:30',
    '11:00',
    '11:30',
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
  ];
  timeSlots: TimeSlot[] = [];

  private readonly PATIENT_ID = 2;
  private allRdvs: RDV[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private rdvService: RdvService,
  ) {}

  get currentMonthLabel(): string {
    return this.currentDate.toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric',
    });
  }

  ngOnInit() {
    this.rdvId = this.route.snapshot.paramMap.get('id');
    if (this.rdvId) this.isEditMode = true;
    this.generateCalendar();

    this.rdvService.listerTousLesRDV().subscribe({
      next: (rdvs) => {
        this.allRdvs = rdvs;
        this.generateCalendar(); // ← regenerate AFTER rdvs are loaded
      },
      error: (err) => {
        console.error('Impossible de charger les RDVs:', err);
        this.generateCalendar(); // still generate even if RDVs fail
      },
    });
  }

  selectDate(day: CalendarDay) {
    if (day.disabled || !day.number) return;

    // 1. Save the specific date values
    this.selectedDayNumber = day.number as number;
    this.selectedMonth = this.currentDate.getMonth();
    this.selectedYear = this.currentDate.getFullYear();

    // 2. Update the UI objects
    this.calendarDays.forEach((d) => (d.selected = (d.number === day.number)));

    this.selectedDate = day;
    this.selectedSlot = null; // Reset slot when date changes
    this.computeSlots();
  }

  private computeSlots() {
    const dateStr = this.buildDateString();

    const takenTimes = this.allRdvs
      .filter((rdv) => rdv.datePrevue === dateStr
        && rdv.statutRdv !== StatutRDV.ANNULE) // ← only active RDVs block slots
      .map((rdv) => rdv.heurePrevue?.substring(0, 5) ?? '');

    const today = new Date();
    const isToday =
      dateStr ===
      `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const currentTime = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;

    this.timeSlots = this.ALL_SLOTS.map((time) => ({
      time,
      available: !takenTimes.includes(time) && !(isToday && time <= currentTime),
      selected: false,
    }));
  }

  private isDateFull(year: number, month: number, day: number): boolean {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const takenTimes = this.allRdvs
      .filter((rdv) => rdv.datePrevue === dateStr
        && rdv.statutRdv !== StatutRDV.ANNULE) // ← same fix here
      .map((rdv) => rdv.heurePrevue?.substring(0, 5) ?? '');
    return this.ALL_SLOTS.every((slot) => takenTimes.includes(slot));
  }

  selectSlot(slot: TimeSlot) {
    if (!slot.available) return;
    this.timeSlots.forEach((s) => (s.selected = false));
    slot.selected = true;
    this.selectedSlot = slot;
  }

  confirmerRdv() {
    if (!this.selectedDate || !this.selectedSlot) return;

    this.isLoading = true;
    this.errorMessage = '';

    if (this.isEditMode && this.rdvId) {
      // MODIFIER: send new date + time to backend
      const rdvModifie: Partial<RDV> = {
        datePrevue: this.buildDateString(),
        heurePrevue: this.selectedSlot.time + ':00',
        statutRdv: StatutRDV.MODIFIE_CONFIRME,
        idPatient: this.PATIENT_ID,
      };

      this.rdvService.modifierRDVGlobalement(Number(this.rdvId), rdvModifie).subscribe({
        next: () => this.onSuccess('Rendez-vous modifié avec succès !'),
        error: (err) => this.onError(err),
      });

    } else {
      // CRÉER: create new RDV
      const rdv: RDV = {
        datePrevue: this.buildDateString(),
        heurePrevue: this.selectedSlot.time + ':00',
        statutRdv: StatutRDV.CONFIRME,
        idPatient: this.PATIENT_ID,
      };

      this.rdvService.ajouterRDV(rdv).subscribe({
        next: (res) => {
          this.allRdvs.push(res);
          this.generateCalendar();
          this.onSuccess("C'est Confirmé ! Votre rendez-vous a bien été enregistré.");
        },
        error: (err) => this.onError(err),
      });
    }
  }

  private buildDateString(): string {
    const year = this.selectedYear;
    const month = String(this.selectedMonth! + 1).padStart(2, '0');
    const day = String(this.selectedDayNumber).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private onSuccess(message: string) {
    this.isLoading = false;
    this.router.navigate(['/patient/mes-rendezvous'], {
      queryParams: { success: message },
    });
  }

  private onError(err: any) {
    this.isLoading = false;
    this.errorMessage = err?.error?.message ?? 'Une erreur est survenue. Veuillez réessayer.';
    console.error('RDV error:', err);
  }

  generateCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    // Logic to calculate days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    this.calendarDays = [];

    // 1. Fill empty slots for the start of the month
    for (let i = 0; i < firstDay; i++) {
      this.calendarDays.push({ number: '', disabled: true, selected: false });
    }

    // 2. Generate actual days
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);

      // Check if "Today" is already finished (after 18:30)
      const isToday = d === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear();

      const now = new Date();
      const todayFullyPassed = isToday && (now.getHours() > 18 || (now.getHours() === 18 && now.getMinutes() >= 30));

      // PERSISTENCE LOGIC:
      // Check if this day matches the one the user previously clicked
      const isSelected = d === this.selectedDayNumber &&
        month === this.selectedMonth &&
        year === this.selectedYear;

      this.calendarDays.push({
        number: d,
        disabled: date < todayMidnight || todayFullyPassed || this.isDateFull(year, month, d),
        selected: isSelected // This keeps the emerald color visible
      });

      // If this day was selected, make sure the reference is updated
      // so the time slots section (ngIf="selectedDate") stays visible
      if (isSelected) {
        this.selectedDate = this.calendarDays[this.calendarDays.length - 1];
      }
    }
  }

  prevMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.generateCalendar();
  }

  nextMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.generateCalendar();
  }
}
