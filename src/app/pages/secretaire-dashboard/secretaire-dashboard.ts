import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth';
import { NotificationService } from '../../services/notification.service';
import { Sidebar } from '../sidebar/sidebar'; // Assurez-vous que le nom de classe est correct

@Component({
  selector: 'app-secretaire-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, Sidebar],
  templateUrl: './secretaire-dashboard.html',
  styleUrl: './secretaire-dashboard.css'
})
export class SecretaireDashboard implements OnInit {
  // États pour l'affichage des menus déroulants
  menuOpen = false;
  notificationsOpen = false;

  // Données
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

  loadNotifications() {
    this.notifService.getUnreadCount().subscribe({
      next: (count) => this.unreadCount = count,
      error: (err: any) => console.error(err)
    });

    this.notifService.getAll().subscribe({
      next: (data) => this.notifications = data,
      error: (err: any) => console.error(err)
    });
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
    if (this.menuOpen) this.notificationsOpen = false;
  }

  toggleNotifications() {
    this.notificationsOpen = !this.notificationsOpen;
    if (this.notificationsOpen) this.menuOpen = false;
  }

  markAllRead() {
    this.notifService.markAllAsRead().subscribe(() => this.loadNotifications());
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login-admin']);
  }
}
