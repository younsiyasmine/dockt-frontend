import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { NotificationService, NotificationPatient } from '../../core/services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit, OnDestroy {
  menuOpen = false;
  notificationsOpen = false;
  user: any = null;
  notifications: NotificationPatient[] = [];
  unreadCount = 0;

  private userSub!: Subscription;
  private notifSub!: Subscription;
  private unreadSub!: Subscription;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.userSub = this.authService.user$.subscribe(u => {
      this.user = u ? { user: u } : null;
      if (u?.idPatient) {
        this.notificationService.init(u.idPatient);
      }
    });

    this.notifSub = this.notificationService.notifications$.subscribe(notifs => {
      this.notifications = [...notifs].sort((a, b) => {
        const dateA = new Date(`${a.dateEnvoi}T${a.heureEnvoi}`);
        const dateB = new Date(`${b.dateEnvoi}T${b.heureEnvoi}`);
        return dateB.getTime() - dateA.getTime();
      });
    });

    this.unreadSub = this.notificationService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
    });
  }

  ngOnDestroy() {
    this.userSub?.unsubscribe();
    this.notifSub?.unsubscribe();
    this.unreadSub?.unsubscribe();
    this.notificationService.disconnectSSE();
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
    if (this.menuOpen) this.notificationsOpen = false;
  }

  toggleNotifications() {
    this.notificationsOpen = !this.notificationsOpen;
    if (this.notificationsOpen) this.menuOpen = false;
  }

  markAsRead(notifId: number) {
    const patientId = this.user?.user?.idPatient;
    if (patientId) this.notificationService.markAsRead(notifId, patientId);
  }

  markAllAsRead() {
    const patientId = this.user?.user?.idPatient;
    if (patientId) this.notificationService.markAllAsRead(patientId);
  }

  getIcon(typeNotif: string): string {
    switch (typeNotif) {
      case 'CONFIRMATION_RDV':   return 'fa-solid fa-calendar-check';
      case 'CONFIRMATION_MODIF': return 'fa-solid fa-calendar-pen';
      case 'REFUS_MODIF':        return 'fa-solid fa-calendar-xmark';
      case 'ANNULATION_RDV':     return 'fa-solid fa-calendar-xmark';
      case 'POSITION_FILE':      return 'fa-solid fa-list-ol';
      case 'RAPPEL':             return 'fa-solid fa-bell';
      default:                   return 'fa-solid fa-circle-info';
    }
  }

  getTitle(typeNotif: string): string {
    switch (typeNotif) {
      case 'CONFIRMATION_RDV':   return 'Rendez-vous confirmé';
      case 'CONFIRMATION_MODIF': return 'Modification confirmée';
      case 'REFUS_MODIF':        return 'Modification refusée';
      case 'ANNULATION_RDV':     return 'Rendez-vous annulé';
      case 'POSITION_FILE':      return 'Position dans la file';
      case 'RAPPEL':             return 'Rappel de rendez-vous';
      default:                   return 'Notification';
    }
  }

  getIconBg(typeNotif: string): string {
    switch (typeNotif) {
      case 'CONFIRMATION_RDV':   return 'bg-teal-100 text-teal-600';
      case 'CONFIRMATION_MODIF': return 'bg-blue-100 text-blue-600';
      case 'REFUS_MODIF':        return 'bg-red-100 text-red-600';
      case 'ANNULATION_RDV':     return 'bg-red-100 text-red-600';
      case 'POSITION_FILE':      return 'bg-purple-100 text-purple-600';
      case 'RAPPEL':             return 'bg-orange-100 text-orange-600';
      default:                   return 'bg-slate-100 text-slate-500';
    }
  }

  getTimeAgo(dateEnvoi: string, heureEnvoi: string): string {
    const sent = new Date(`${dateEnvoi}T${heureEnvoi}`);
    const now = new Date();
    const diffMs = now.getTime() - sent.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMin / 60);
    const diffD = Math.floor(diffH / 24);

    if (diffMin < 1)  return "À l'instant";
    if (diffMin < 60) return `Il y a ${diffMin} minute${diffMin > 1 ? 's' : ''}`;
    if (diffH < 24)   return `Il y a ${diffH} heure${diffH > 1 ? 's' : ''}`;
    return `Il y a ${diffD} jour${diffD > 1 ? 's' : ''}`;
  }

  logout() {
    this.notificationService.disconnectSSE();
    this.authService.logout();
    this.menuOpen = false;
    this.notificationsOpen = false;
    this.router.navigate(['/login']);
  }
}
