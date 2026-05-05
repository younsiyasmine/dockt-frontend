import { Component, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';

interface Message {
  role: 'user' | 'bot';
  text?: string;
  blocked?: boolean;
  pharmacies?: any[];
  source?: string;
  faq?: boolean;
}

const FAQ_ITEMS = [
  { icon: '📅', label: 'Comment prendre un rendez-vous ?',             q: 'Comment prendre un rendez-vous ?' },
  { icon: '📝', label: 'Comment créer un compte ?',                    q: 'Comment créer un compte ?' },
  { icon: '❌', label: 'Comment annuler ou modifier un rendez-vous ?',  q: 'Comment annuler ou modifier un rendez-vous ?' },
  { icon: '✅', label: 'Comment faire mon check-in ?',                  q: 'Comment faire mon check-in ?' },
  { icon: '💊', label: 'Pharmacie de garde à Oujda',                   q: 'Pharmacie de garde à Oujda' },
];

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.css',
})
export class ChatbotComponent {
  isOpen = false;
  messages: Message[] = [];
  userInput = '';
  loading = false;
  isPatient = false;
  faqItems = FAQ_ITEMS;

  private api = 'http://127.0.0.1:8000';

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
  ) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.checkVisibility();
      }
    });

    this.messages.push({
      role: 'bot',
      text: '👋 Bonjour ! Je suis votre assistant DOCKT.\n\nVoici ce que je peux faire pour vous :',
    });
    this.messages.push({ role: 'bot', faq: true });
    this.messages.push({ role: 'bot', text: '⚠️ Urgence médicale ? Appelez le 150 immédiatement.' });
  }

  checkVisibility(): void {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const role = user?.role ?? null;
    const path = window.location.pathname;

    const isPublicPage = path === '/' || path.includes('/home');
    const isLoginPage  = path.includes('/login');

    if (isLoginPage) {
      this.isPatient = false;
    } else if (role === 'PATIENT') {
      this.isPatient = true;
    } else if (role === null && isPublicPage) {
      this.isPatient = true;
    } else {
      this.isPatient = false;
    }

    this.cdr.detectChanges();
  }

  toggleChat(): void {
    this.checkVisibility();
    this.isOpen = !this.isOpen;
    if (this.isOpen) setTimeout(() => this.scrollToBottom(), 150);
  }

  sendPreset(q: string): void {
    this.userInput = q;
    this.send();
  }

  renderMarkdown(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  send(): void {
    const text = this.userInput.trim();
    if (!text || this.loading) return;

    this.messages.push({ role: 'user', text });
    this.userInput = '';
    this.loading = true;
    this.scrollToBottom();

    const isPharma =
      text.toLowerCase().includes('pharmacie') ||
      text.toLowerCase().includes('garde');

    if (isPharma) {
      this.http.get<any>(`${this.api}/api/pharmacies`).subscribe({
        next: (data) => {
          this.ngZone.run(() => {
            const liste  = Array.isArray(data) ? data : (data.data || []);
            const source = data.source || 'fallback';
            if (liste.length > 0) {
              this.messages.push({ role: 'bot', pharmacies: liste, source });
            } else {
              this.messages.push({ role: 'bot', text: 'Aucune pharmacie trouvée. Appelez le 150.', blocked: true });
            }
            this.loading = false;
            this.scrollToBottom();
          });
        },
        error: () => {
          this.ngZone.run(() => {
            this.messages.push({ role: 'bot', text: '⚠️ Impossible de joindre le serveur.', blocked: true });
            this.loading = false;
            this.scrollToBottom();
          });
        },
      });
    } else {
      this.http.post<any>(`${this.api}/api/chat`, { message: text }).subscribe({
        next: (data) => {
          this.ngZone.run(() => {
            if (data.pharmacies) {
              this.messages.push({ role: 'bot', pharmacies: data.pharmacies, source: data.source || 'live' });
            }
            if (data.reply) {
              this.messages.push({ role: 'bot', text: data.reply, blocked: data.reply.includes('autorisé') });
            }
            if (data.faq) {
              this.messages.push({ role: 'bot', faq: true });
            }
            if (!data.reply && !data.pharmacies && !data.faq) {
              this.messages.push({ role: 'bot', text: 'Une erreur inattendue est survenue.' });
            }
            this.loading = false;
            this.scrollToBottom();
          });
        },
        error: () => {
          this.ngZone.run(() => {
            this.messages.push({
              role: 'bot',
              text: '⚠️ Impossible de joindre le serveur.\nVérifiez votre connexion ou réessayez.',
              blocked: true,
            });
            this.loading = false;
            this.scrollToBottom();
          });
        },
      });
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  scrollToBottom(): void {
    setTimeout(() => {
      const el = document.getElementById('chat-messages');
      if (el) el.scrollTop = el.scrollHeight;
    }, 100);
  }
}
