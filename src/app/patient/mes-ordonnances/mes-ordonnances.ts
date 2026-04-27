import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Navbar } from '../navbar/navbar';
import { OrdonnanceService } from '../../core/services/ordonnance.service';
import { AuthService } from '../../core/services/auth';
import { Ordonnance } from '../../core/models/models';

@Component({
  selector: 'app-mes-ordonnances',
  standalone: true,
  imports: [CommonModule, RouterModule, Navbar, DatePipe],
  templateUrl: './mes-ordonnances.html',
  styleUrl: './mes-ordonnances.css',
})
export class MesOrdonnancesComponent implements OnInit {
  ordonnancesList: Ordonnance[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';

  constructor(
    private ordonnanceService: OrdonnanceService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) {}

  ngOnInit(): void {
    console.log('raw localStorage user:', localStorage.getItem('user'));
    const patientId = this.authService.getCurrentUserId();
    console.log('patientId:', patientId);

    if (!patientId) {
      this.errorMessage = 'Session expirée. Veuillez vous reconnecter.';
      this.isLoading = false;
      return;
    }
    this.loadOrdonnances(patientId);
  }

  loadOrdonnances(patientId: number): void {
    this.isLoading = true;
    this.ordonnanceService.getOrdonnancesParPatient(patientId).subscribe({
      next: (data) => {
        this.ordonnancesList = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement ordonnances:', err);
        this.errorMessage = 'Impossible de charger les ordonnances.';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  telechargerPDF(ord: Ordonnance): void {
    this.router.navigate(['/voir-ordonnance', ord.idOrdonnance]);
  }
}
