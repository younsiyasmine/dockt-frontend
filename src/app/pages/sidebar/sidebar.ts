import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './sidebar.html',
})
export class Sidebar implements OnInit {
  userRole: string = '';
  role: 'MEDECIN' | 'SECRETAIRE' | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    const auth = JSON.parse(localStorage.getItem('user') || 'null');
    this.role = auth?.role ?? null;

    const user = this.authService.getUser();
    this.userRole = user?.role || '';
  }

  getDashboardRoute(): string {
    if (this.userRole === 'MEDECIN') return '/medecin-dashboard';
    if (this.userRole === 'SECRETAIRE') return '/medecin-dashboard';
    return '/login-admin';
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }
}
