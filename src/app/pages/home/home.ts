import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css'
})

export class HomeComponent {
  menuOpen = false;
  activeLang = 'FR';
  activeSection = 'hero';

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  setLang(lang: string) {
    this.activeLang = lang;
  }

  @HostListener('window:scroll', [])
  onScroll() {
    const sections = ['hero', 'services', 'horaires', 'avis', 'contact'];
    const offset = 100;

    for (const id of sections) {
      const el = document.getElementById(id);
      if (el) {
        const top = el.getBoundingClientRect().top;
        if (top <= offset && top > -el.offsetHeight + offset) {
          this.activeSection = id;
        }
      }
    }
  }

  scrollTo(sectionId: string) {
    this.menuOpen = false;
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (!element) return;

      const target = element.getBoundingClientRect().top + window.scrollY - 72;
      const start = window.scrollY;
      const distance = target - start;
      const duration = 800;
      let startTime: number | null = null;

      const ease = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        window.scrollTo(0, start + distance * ease(progress));
        if (elapsed < duration) requestAnimationFrame(step);
      };

      requestAnimationFrame(step);
    }, 10);
  }
}
