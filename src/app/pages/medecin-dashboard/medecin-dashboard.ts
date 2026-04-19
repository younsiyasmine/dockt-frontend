import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { NotificationService } from '../../core/services/notification.service';
import { Navbar } from '../../patient/navbar/navbar'; // ✅ Import de la Navbar pour éviter la redondance
import { Sidebar } from '../sidebar/sidebar';
@Component({
  selector: 'app-medecin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    Navbar,
    Sidebar,
  ],
  templateUrl: './medecin-dashboard.html',
  styleUrl: './medecin-dashboard.css'
})
export class MedecinDashboard implements OnInit {
  // --- État de l'interface ---
  menuOpen = false;
  notificationsOpen = false;

  // --- Données ---
  user: any = null;
  notifications: any[] = [];
  unreadCount: number = 0;
  today: Date = new Date();

  constructor(
    private authService: AuthService,
    private notifService: NotificationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.user = this.authService.getUser();
    this.loadNotifications();
  }

  // --- Logique des Notifications ---
  loadNotifications() {
    // Récupère le nombre de non-lus pour le badge
    this.notifService.getUnreadCount().subscribe({
      next: (count) => this.unreadCount = count,
      error: (err: any) => console.error('Erreur count:', err)
    });

    // Récupère la liste complète pour le menu déroulant
    this.notifService.getAll().subscribe({
      next: (data) => this.notifications = data,
      error: (err: any) => console.error('Erreur list:', err)
    });
  }

  // Marquer une notification spécifique comme lue
  markAsRead(id: number) {
    this.notifService.markAsRead(id).subscribe({
      next: () => this.loadNotifications(),
      error: (err: any) => console.error('Erreur markAsRead:', err)
    });
  }

  // Tout marquer comme lu (Appelé par ton bouton dans le HTML)
  markAllRead() {
    this.notifService.markAllAsRead().subscribe({
      next: () => {
        this.loadNotifications();
        // Optionnel : fermer le menu après l'action
        // this.notificationsOpen = false;
      },
      error: (err: any) => console.error('Erreur markAllRead:', err)
    });
  }

  // --- Gestion de l'affichage (Toggles) ---
  toggleMenu() {
    this.menuOpen = !this.menuOpen;
    if (this.menuOpen) this.notificationsOpen = false; // Ferme l'autre menu
  }

  toggleNotifications() {
    this.notificationsOpen = !this.notificationsOpen;
    if (this.notificationsOpen) {
      this.menuOpen = false; // Ferme l'autre menu
      this.loadNotifications(); // Rafraîchit les données à l'ouverture
    }
  }

  // --- Authentification ---
  logout() {
    this.authService.logout();
    this.menuOpen = false;
    this.router.navigate(['/login-admin']);
  }
}
