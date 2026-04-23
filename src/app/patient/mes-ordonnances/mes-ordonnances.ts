import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Navbar } from '../navbar/navbar';
import { OrdonnanceService } from '../../core/services/ordonnance.service';
import { Ordonnance } from '../../core/models/models';

@Component({
  selector: 'app-mes-ordonnances',
  standalone: true,
  imports: [CommonModule, RouterModule, Navbar],
  templateUrl: './mes-ordonnances.html',
  styleUrl: './mes-ordonnances.css',
})
export class MesOrdonnancesComponent implements OnInit {
  ordonnancesList: Ordonnance[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';

  constructor(
    private ordonnanceService: OrdonnanceService,
    private cdr: ChangeDetectorRef,
    private router: Router, // ← ADD
  ) {}

  ngOnInit(): void {
    const idRdv = 1;
    this.loadOrdonnances(idRdv);
  }

  loadOrdonnances(idRdv: number): void {
    this.isLoading = true;
    this.ordonnanceService.getOrdonnancesParRdv(idRdv).subscribe({
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
    console.log('Navigating to:', '/voir-ordonnance', ord.idOrdonnance);
    this.router.navigate(['/voir-ordonnance', ord.idOrdonnance]);
  }

}
