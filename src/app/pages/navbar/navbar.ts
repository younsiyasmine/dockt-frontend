import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit {
  // États pour l'affichage des menus déroulants
  menuOpen = false;
  notificationsOpen = false;

  // Données de l'utilisateur connecté
  user: any = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Récupération des informations de l'utilisateur au chargement du composant
    this.user = this.authService.getUser();
  }

  /**
   * Alterne l'affichage du menu profil
   * Ferme le menu notifications s'il est ouvert
   */
  toggleMenu() {
    this.menuOpen = !this.menuOpen;
    if (this.menuOpen) {
      this.notificationsOpen = false;
    }
  }

  /**
   * Alterne l'affichage de la fenêtre de notifications
   * Ferme le menu profil s'il est ouvert
   */
  toggleNotifications() {
    this.notificationsOpen = !this.notificationsOpen;
    if (this.notificationsOpen) {
      this.menuOpen = false;
    }
  }

  /**
   * Déconnecte l'utilisateur via l'AuthService et redirige vers la page de login
   */
  logout() {
    this.authService.logout();
    this.menuOpen = false;
    this.notificationsOpen = false;
    this.router.navigate(['/login']);
  }
}
