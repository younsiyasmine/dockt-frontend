import { Component } from '@angular/core';
import { RouterLink } from '@angular/router'; // Pour débloquer les liens [routerLink]
import { Navbar } from '../navbar/navbar'; // Vérifie bien que le chemin vers navbar.ts est correct

@Component({
  selector: 'app-patient-dashboard',
  standalone: true, // Assure-toi que cette ligne est présente
  imports: [RouterLink, Navbar], // On ajoute les outils nécessaires ici
  templateUrl: './patient-dashboard.html',
  styleUrl: './patient-dashboard.css',
})
export class PatientDashboard {}
