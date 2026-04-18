import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html'
})
export class Sidebar implements OnInit {
  userRole: string = '';

  constructor(private authService: AuthService) {}

  ngOnInit() {
    const user = this.authService.getUser();
    this.userRole = user?.role || '';
  }

  getDashboardRoute(): string {
    if (this.userRole === 'MEDECIN') return '/medecin-dashboard';
    if (this.userRole === 'SECRETAIRE') return '/secretaire-dashboard';
    return '/login-admin';
  }
}
