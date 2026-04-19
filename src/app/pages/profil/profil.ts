import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { Navbar } from '../navbar/navbar';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule, RouterLink, Navbar],
  templateUrl: './profil.html',
  styleUrl: './profil.css'
})
export class ProfilComponent implements OnInit {
  user: any = null;
  dashboardLink: string = '/patient-dashboard';

  constructor(private authService: AuthService) {}

  ngOnInit() {
    // Récupération de l'objet complet stocké lors du login
    this.user = this.authService.getUser();

    // Debug : affiche les données en console pour vérifier les noms des champs
    console.log("Données utilisateur :", this.user);

    if (this.user) {
      // Gestion du lien de retour dynamique
      if (this.user.role === 'MEDECIN') {
        this.dashboardLink = '/medecin-dashboard';
      }  else if (this.user.role === 'SECRETAIRE') {
        this.dashboardLink = '/secretaire-dashboard';}
      else {
        this.dashboardLink = '/patient-dashboard';
      }
    }
  }
}
