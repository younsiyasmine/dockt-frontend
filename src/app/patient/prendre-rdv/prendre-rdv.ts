import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Navbar } from '../navbar/navbar';

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
  imports: [CommonModule, RouterLink, Navbar],
  templateUrl: './prendre-rdv.html',
  styleUrl: './prendre-rdv.css',
})
export class PrendreRdv implements OnInit {
  currentDate = new Date();
  selectedDate: CalendarDay | null = null;
  selectedSlot: TimeSlot | null = null;

  dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  calendarDays: CalendarDay[] = [];

  timeSlots: TimeSlot[] = [
    { time: '09:00', available: true, selected: false },
    { time: '09:30', available: true, selected: false },
    { time: '10:00', available: false, selected: false },
    { time: '10:30', available: true, selected: false },
    { time: '11:00', available: true, selected: false },
    { time: '11:30', available: true, selected: false },
    { time: '14:00', available: true, selected: false },
    { time: '14:30', available: false, selected: false },
    { time: '15:00', available: true, selected: false },
    { time: '15:30', available: true, selected: false },
    { time: '16:00', available: true, selected: false },
    { time: '16:30', available: true, selected: false },
  ];

  get currentMonthLabel(): string {
    return this.currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }

  ngOnInit() {
    this.generateCalendar();
  }

  generateCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    this.calendarDays = [];

    for (let i = 0; i < firstDay; i++) {
      this.calendarDays.push({ number: '', disabled: true, selected: false });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      this.calendarDays.push({
        number: d,
        disabled: date < new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        selected: false,
      });
    }
  }

  selectDate(day: CalendarDay) {
    this.calendarDays.forEach((d) => (d.selected = false));
    day.selected = true;
    this.selectedDate = day;
    this.selectedSlot = null;
    this.timeSlots.forEach((s) => (s.selected = false));
  }

  selectSlot(slot: TimeSlot) {
    this.timeSlots.forEach((s) => (s.selected = false));
    slot.selected = true;
    this.selectedSlot = slot;
  }

  prevMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.generateCalendar();
  }

  nextMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.generateCalendar();
  }

  showToast = false;

  confirmerRdv() {
    // API call later
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }
}
