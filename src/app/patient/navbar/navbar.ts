import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';
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

  private userSub!: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    // Subscribe to reactive stream — updates instantly when profile is saved
    this.userSub = this.authService.user$.subscribe(u => {
      this.user = u ? { user: u } : null;
    });
  }

  ngOnDestroy() {
    this.userSub?.unsubscribe();
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
    if (this.menuOpen) this.notificationsOpen = false;
  }

  toggleNotifications() {
    this.notificationsOpen = !this.notificationsOpen;
    if (this.notificationsOpen) this.menuOpen = false;
  }

  logout() {
    this.authService.logout();
    this.menuOpen = false;
    this.notificationsOpen = false;
    this.router.navigate(['/login']);
  }
}
