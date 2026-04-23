import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth';
import { NotificationService } from '../../core/services/notification.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './topbar.html',
})
export class Topbar implements OnInit, OnDestroy {
  menuOpen = false;
  notificationsOpen = false;
  user: any = null;
  notifications: any[] = [];
  unreadCount = 0;

  private sub = new Subscription();
  private readonly apiBase = 'http://localhost:8082/api';

  constructor(
    private authService: AuthService,
    private notifService: NotificationService,
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    const stored = this.authService.getUser() as any;
    if (stored) {
      this.authService.updateCurrentUser(stored?.user ?? stored);
    }

    this.sub.add(
      this.authService.user$.subscribe((u) => {
        this.user = u;
        this.cdr.detectChanges();
      }),
    );

    this.loadFreshUser();
    this.loadNotifications();
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  private loadFreshUser() {
    const role = this.authService.getRole();
    const userId = this.authService.getCurrentUserId();
    if (!userId || !role) {
      const stored = this.authService.getUser() as any;
      this.authService.updateCurrentUser(stored?.user ?? stored);
      return;
    }

    let url = '';
    if (role === 'MEDECIN') url = `${this.apiBase}/medecins/${userId}`;
    else if (role === 'SECRETAIRE') url = `${this.apiBase}/secretaires/${userId}`;
    if (!url) return;

    this.http.get<any>(url).subscribe({
      next: (data) => {
        if (data && (data.nom || data.prenom)) {
          this.authService.updateCurrentUser(data);
        }
        // if data is garbage, do nothing — keep the localStorage version
      },
      error: () => {
        const stored = this.authService.getUser() as any;
        this.authService.updateCurrentUser(stored?.user ?? stored);
      },
    });
  }

  loadNotifications() {
    this.notifService.getUnreadCount().subscribe({
      next: (count) => (this.unreadCount = count),
      error: () => {},
    });
    this.notifService.getAll().subscribe({
      next: (data) => (this.notifications = data),
      error: () => {},
    });
  }

  markAsRead(id: number) {
    this.notifService.markAsRead(id).subscribe({
      next: () => this.loadNotifications(),
      error: () => {},
    });
  }

  markAllRead() {
    this.notifService.markAllAsRead().subscribe({
      next: () => this.loadNotifications(),
      error: () => {},
    });
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
    if (this.menuOpen) this.notificationsOpen = false;
  }

  toggleNotifications() {
    this.notificationsOpen = !this.notificationsOpen;
    if (this.notificationsOpen) {
      this.menuOpen = false;
      this.loadNotifications();
    }
  }

  logout() {
    this.authService.logout();
    this.menuOpen = false;
    this.router.navigate(['/login-admin']);
  }

  getUserLabel(): string {
    if (!this.user) return '';
    const role = this.authService.getRole();
    if (role === 'MEDECIN') return `Dr. ${this.user?.prenom ?? ''} ${this.user?.nom ?? ''}`.trim();
    if (role === 'SECRETAIRE') return `${this.user?.prenom ?? ''} ${this.user?.nom ?? ''}`.trim();
    return '';
  }

  getUserSub(): string {
    if (!this.user) return '';
    const role = this.authService.getRole();
    if (role === 'MEDECIN') return this.user?.specialite || 'Médecin Généraliste';
    if (role === 'SECRETAIRE') return 'Secrétaire';
    return '';
  }
}
