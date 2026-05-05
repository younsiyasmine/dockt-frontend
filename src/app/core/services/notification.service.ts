import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from './auth';

export interface NotificationPatient {
  idNotif: number;
  typeNotif: string;
  contenuNotif: string;
  dateEnvoi: string;
  heureEnvoi: string;
  statutNotif: string; // 'LU' | 'NON_LU'
  canal: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {

  private apiUrl = 'http://localhost:8082/api/notifications';

  private notificationsSubject = new BehaviorSubject<NotificationPatient[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);

  notifications$ = this.notificationsSubject.asObservable();
  unreadCount$ = this.unreadCountSubject.asObservable();

  private eventSource: EventSource | null = null;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // ── CALL THIS WHEN PATIENT LOGS IN ────────────────────────────────────────

  init(patientId: number) {
    this.loadNotifications(patientId);
    this.connectSSE(patientId);
  }

  // ── SSE CONNECTION ────────────────────────────────────────────────────────

  private connectSSE(patientId: number) {
    this.disconnectSSE();

    const token = this.authService.getToken();
    if (!token) return;

    // pass token as query param since EventSource doesn't support headers
    const url = `${this.apiUrl}/stream/${patientId}?token=${token}`;
    this.eventSource = new EventSource(url);

    this.eventSource.addEventListener('notification', (event: MessageEvent) => {
      try {
        // If it's the "connection established" string, it will fail here
        const newNotif: NotificationPatient = JSON.parse(event.data);

        const current = this.notificationsSubject.getValue();
        this.notificationsSubject.next([newNotif, ...current]);

        if (newNotif.statutNotif === 'NON_LU') {
          this.unreadCountSubject.next(this.unreadCountSubject.getValue() + 1);
        }
      } catch (e) {
        // This catches the "SSE connection established" string safely
        console.log('SSE Info:', event.data);
      }
    });

    this.eventSource.addEventListener('connected', () => {
      console.log('✅ SSE connecté pour patient', patientId);
    });

    this.eventSource.onerror = () => {
      console.warn('⚠️ SSE déconnecté, reconnexion automatique...');
    };
  }

  disconnectSSE() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  // ── HTTP METHODS ──────────────────────────────────────────────────────────

  loadNotifications(patientId: number) {
    this.http.get<NotificationPatient[]>(`${this.apiUrl}/patient/${patientId}`)
      .subscribe({
        next: (notifs) => {
          this.notificationsSubject.next(notifs);
          const unread = notifs.filter(n => n.statutNotif === 'NON_LU').length;
          this.unreadCountSubject.next(unread);
        },
        error: (err) => console.error('Erreur chargement notifications', err)
      });
  }

  markAsRead(notifId: number, patientId: number) {
    this.http.patch(`${this.apiUrl}/${notifId}/read/patient/${patientId}`, {})
      .subscribe({
        next: () => {
          const updated = this.notificationsSubject.getValue().map(n =>
            n.idNotif === notifId ? { ...n, statutNotif: 'LU' } : n
          );
          this.notificationsSubject.next(updated);
          const unread = updated.filter(n => n.statutNotif === 'NON_LU').length;
          this.unreadCountSubject.next(unread);
        },
        error: (err) => console.error('Erreur markAsRead', err)
      });
  }

  markAllAsRead(patientId: number) {
    this.http.patch(`${this.apiUrl}/patient/${patientId}/read-all`, {})
      .subscribe({
        next: () => {
          const updated = this.notificationsSubject.getValue()
            .map(n => ({ ...n, statutNotif: 'LU' }));
          this.notificationsSubject.next(updated);
          this.unreadCountSubject.next(0);
        },
        error: (err) => console.error('Erreur markAllAsRead', err)
      });
  }

  ngOnDestroy() {
    this.disconnectSSE();
  }
}
