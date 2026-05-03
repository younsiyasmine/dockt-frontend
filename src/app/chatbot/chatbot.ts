import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Message {
  role: 'user' | 'bot';
  text: string;
  blocked?: boolean;
  pharmacies?: any[];
  source?: string;
}

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

  private api = 'http://127.0.0.1:8000';

  constructor(private http: HttpClient) {
    this.messages.push({
      role: 'bot',
      text: 'Bonjour ! Je suis votre assistant médical pour Oujda.\n\nJe peux vous aider à :\n- 🏥 Trouver la pharmacie de garde\n- ❓ Répondre à vos questions de santé\n\n⚠️ Je ne donne pas de conseils sur les médicaments.',
    });
  }

  // ← Scroll automatique à chaque ouverture
  toggleChat(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      setTimeout(() => this.scrollToBottom(), 150);
    }
  }

  sendPreset(text: string): void {
    this.userInput = text;
    this.send();
  }

  send(): void {
    const text = this.userInput.trim();
    if (!text || this.loading) return;

    this.messages.push({ role: 'user', text });
    this.userInput = '';
    this.loading = true;

    // ← Scroll immédiat après message utilisateur
    this.scrollToBottom();

    const isPharma =
      text.toLowerCase().includes('pharmacie') ||
      text.toLowerCase().includes('garde');

    if (isPharma) {
      this.http.get<any>(`${this.api}/api/pharmacies`).subscribe({
        next: (data) => {
          const liste = Array.isArray(data) ? data : data.data || [];
          const source = data.source || 'fallback';
          if (liste.length > 0) {
            this.messages.push({ role: 'bot', text: '', pharmacies: liste, source });
          } else {
            this.messages.push({
              role: 'bot',
              text: 'Aucune pharmacie trouvée. Appelez le 150.',
              blocked: true,
            });
          }
          this.loading = false;
          this.scrollToBottom();
        },
        error: () => {
          this.messages.push({
            role: 'bot',
            text: 'Erreur de connexion. Vérifiez que Flask tourne.',
            blocked: true,
          });
          this.loading = false;
          this.scrollToBottom();
        },
      });
    } else {
      this.http.post<any>(`${this.api}/api/chat`, { message: text }).subscribe({
        next: (data) => {
          if (data.pharmacies) {
            this.messages.push({
              role: 'bot',
              text: '',
              pharmacies: data.pharmacies,
              source: 'live',
            });
          } else {
            const isBlocked = data.reply?.includes('autorisé');
            this.messages.push({
              role: 'bot',
              text: data.reply || data.error || 'Erreur.',
              blocked: isBlocked,
            });
          }
          this.loading = false;
          this.scrollToBottom();
        },
        error: () => {
          this.messages.push({
            role: 'bot',
            text: 'Erreur de connexion au serveur.',
            blocked: true,
          });
          this.loading = false;
          this.scrollToBottom();
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
