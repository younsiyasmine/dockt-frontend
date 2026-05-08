import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  NgZone,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-tablette-checkin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tablette-checkin.html',
  styleUrls: ['./tablette-checkin.css'],
})
export class TabletteCheckinComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('overlayCanvas') overlayCanvas!: ElementRef<HTMLCanvasElement>;

  message: string = 'Veuillez vous placer devant la caméra';
  sousMessage: string = 'Cliquez sur le bouton pour scanner';
  messageClass: string = 'info';

  cameraActive: boolean = false;
  isProcessing: boolean = false;
  patientEnAttente: boolean = false;

  private attenteInterval: any;
  private isCapturingNew: boolean = false;
  private nouveauPatientEnAttente: number | null = null;
  private stream: MediaStream | null = null;

  // ── Canvas overlay interval ──────────────────────────────────
  private overlayInterval: any;

  private readonly API = 'http://localhost:8000/api/visage';

  constructor(
    private http: HttpClient,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.verifierNouveauPatientPeriodiquement();
  }

  // ─────────────────────────────────────────────
  // GESTION CAMÉRA
  // ─────────────────────────────────────────────
  demarrerCamera(): Promise<void> {
    return navigator.mediaDevices
      .getUserMedia({ video: { width: 1280, height: 720, facingMode: 'user' } })
      .then((stream) => {
        this.stream = stream;

        // 1) Rendre le bloc <video> visible AVANT d'attacher le flux
        this.cameraActive = true;
        this.cdr.detectChanges();   // force Angular à insérer le <video> dans le DOM

        return new Promise<void>((resolve, reject) => {
          let tentatives = 0;

          const checkInterval = setInterval(() => {
            tentatives++;
            const video = this.videoElement?.nativeElement;

            if (video) {
              // 2) Attacher srcObject seulement si pas encore fait
              if (!video.srcObject) {
                video.srcObject = stream;
                video.play().catch(() => {});
              }
              // 3) Attendre que la vidéo ait des dimensions réelles
              if (video.videoWidth > 0 && video.videoHeight > 0) {
                clearInterval(checkInterval);
                this.demarrerOverlay();
                resolve();
              }
            }

            if (tentatives > 150) {
              clearInterval(checkInterval);
              reject(new Error('Caméra timeout — vérifiez les permissions'));
            }
          }, 100);
        });
      })
      .catch((err) => {
        this.setMessage("Impossible d'accéder à la caméra", 'error', err.message);
        this.cameraActive = false;
        this.cdr.detectChanges();
        throw err;
      });
  }

  arreterCamera() {
    this.arreterOverlay();
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.videoElement?.nativeElement) {
      this.videoElement.nativeElement.srcObject = null;
    }
    this.cameraActive = false;
    this.cdr.detectChanges();
  }

  resetApresDelai(delaiMs: number = 5000) {
    setTimeout(() => {
      this.setMessage(
        'Veuillez vous placer devant la caméra',
        'info',
        'Cliquez sur le bouton pour scanner',
      );
      this.isProcessing = false;
      this.isCapturingNew = false;
      this.nouveauPatientEnAttente = null;
      this.patientEnAttente = false;
      this.arreterCamera();
    }, delaiMs);
  }

  // ─────────────────────────────────────────────
  // OVERLAY CANVAS — rectangle guide jaune
  // ─────────────────────────────────────────────
  private demarrerOverlay(): void {
    this.overlayInterval = setInterval(() => {
      this.zone.runOutsideAngular(() => {
        this.dessinerRectangleGuide();
      });
    }, 100);
  }

  private arreterOverlay(): void {
    if (this.overlayInterval) {
      clearInterval(this.overlayInterval);
      this.overlayInterval = null;
    }
    const overlay = this.overlayCanvas?.nativeElement;
    if (overlay) {
      const ctx = overlay.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, overlay.width, overlay.height);
    }
  }

  private dessinerRectangleGuide(): void {
    const video   = this.videoElement?.nativeElement;
    const overlay = this.overlayCanvas?.nativeElement;
    if (!video || !overlay || !this.cameraActive) return;

    const ctx = overlay.getContext('2d');
    if (!ctx) return;

    if (video.videoWidth > 0 && overlay.width !== video.videoWidth) {
      overlay.width  = video.videoWidth;
      overlay.height = video.videoHeight;
    }

    ctx.clearRect(0, 0, overlay.width, overlay.height);

    const cw    = overlay.width;
    const ch    = overlay.height;
    const rectW = cw * 0.28;
    const rectH = ch * 0.55;
    const rectX = (cw - rectW) / 2;
    const rectY = (ch - rectH) / 2 - ch * 0.04;

    // Rectangle vert — même couleur que le bouton #22c55e
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth   = 3;
    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur  = 10;
    ctx.strokeRect(rectX, rectY, rectW, rectH);
  }

  // ─────────────────────────────────────────────
  // BOUTON SCANNER (PATIENT EXISTANT) — logique inchangée
  // ─────────────────────────────────────────────
  async demarrerScan() {
    if (this.isProcessing) return;

    this.isProcessing = true;
    this.setMessage('🔍 Scan en cours...', 'info', 'Veuillez patienter');

    try {
      await this.demarrerCamera();
      setTimeout(() => {
        this.capturerEtReconnaitre();
      }, 500);
    } catch (err) {
      this.setMessage('❌ Erreur caméra', 'error', 'Vérifiez les permissions');
      this.isProcessing = false;
      this.arreterCamera();
    }
  }

  capturerEtReconnaitre() {
    this.capturerImage((blob) => {
      if (!blob) {
        this.setMessage('❌ Échec capture', 'error', 'Réessayez');
        this.arreterCamera();
        this.resetApresDelai(3000);
        return;
      }

      const formData = new FormData();
      formData.append('image', blob, 'face.jpg');

      this.http.post<any>(`${this.API}/reconnaitre`, formData).subscribe({
        next: (res) => {
          if (res.status === 'success') {
            const { patient_id, nom, prenom, vecteur } = res;
            this.setMessage(`Bonjour ${prenom} ${nom} !`, 'success', 'Check-in en cours...');

            this.http
              .post<any>(`${this.API}/checkin`, { patient_id, nom, prenom, vecteur })
              .subscribe({
                next: (r) => {
                  if (r.status === 'success') {
                    this.setMessage(
                      '✅ Check-in effectué avec succès !',
                      'success',
                      `Bienvenue ${prenom} ${nom}`,
                    );
                    this.arreterCamera();
                    this.resetApresDelai(5000);
                  } else if (r.status === 'no_rdv') {
                    this.setMessage(
                      '❌ Check-in non réussi',
                      'error',
                      `Aucun rendez-vous aujourd'hui`,
                    );
                    this.arreterCamera();
                    this.resetApresDelai(4000);
                  } else if (r.status === 'already_checkin') {
                    this.setMessage(
                      '❌ Check-in non réussi',
                      'error',
                      `Présence déjà enregistrée aujourd'hui`,
                    );
                    this.arreterCamera();
                    this.resetApresDelai(4000);
                  } else {
                    this.setMessage('❌ Check-in non réussi', 'error', 'Veuillez réessayer');
                    this.arreterCamera();
                    this.resetApresDelai(3000);
                  }
                },
                error: () => {
                  this.setMessage('❌ Check-in non réussi', 'error', 'Veuillez réessayer');
                  this.arreterCamera();
                  this.resetApresDelai(3000);
                },
              });
          } else {
            this.setMessage('❌ Check-in non réussi', 'error', 'Visage non reconnu — contactez la secrétaire');
            this.arreterCamera();
            this.resetApresDelai(4000);
          }
        },
        error: () => {
          this.setMessage('❌ Check-in non réussi', 'error', 'Erreur de reconnaissance — réessayez');
          this.arreterCamera();
          this.resetApresDelai(3000);
        },
      });
    });
  }

  // ─────────────────────────────────────────────
  // VÉRIFICATION NOUVEAU PATIENT — logique inchangée
  // ─────────────────────────────────────────────
  verifierNouveauPatientPeriodiquement() {
    this.attenteInterval = setInterval(() => {
      if (this.isCapturingNew || this.isProcessing) return;

      this.http.get<any>(`${this.API}/verifier_attente`).subscribe({
        next: (res) => {
          if (res.status === 'pending') {
            const patientId = res.patient_id;
            this.patientEnAttente = true;
            this.isCapturingNew = true;
            this.nouveauPatientEnAttente = patientId;

            this.setMessage('📸 Nouveau patient détecté', 'info', 'Ouverture caméra...');

            this.demarrerCamera()
              .then(() => {
                setTimeout(() => this.capturerNouveauPatient(patientId), 2000);
              })
              .catch(() => {
                this.setMessage('❌ Erreur caméra', 'error', 'Impossible de démarrer la caméra');
                this.isCapturingNew = false;
                this.patientEnAttente = false;
              });
          }
        },
        error: () => {},
      });
    }, 2000);
  }

  // ─────────────────────────────────────────────
  // NOUVEAU PATIENT — 3 SCANS ANTI-USURPATION — logique inchangée
  // ─────────────────────────────────────────────
  capturerNouveauPatient(patientId: number) {
    this.isProcessing = true;
    this.setMessage('🔍 Vérification en cours...', 'info', 'Analyse de votre visage (3 scans)...');

    this.faireMultipleScans(3, (patientReconnu) => {
      if (patientReconnu) {
        const { prenom, nom } = patientReconnu;
        this.setMessage(
          '❌ Check-in non réussi',
          'error',
          `Ce visage appartient déjà à ${prenom} ${nom}`,
        );
        this.http.post(`${this.API}/consommer_attente`, {}).subscribe();
        this.arreterCamera();
        this.resetApresDelai(5000);
      } else {
        this.setMessage('📸 Capture en cours...', 'info', 'Ne bougez pas svp');

        setTimeout(() => {
          this.capturerImage((blob) => {
            if (!blob) {
              this.setMessage('❌ Échec capture', 'error', 'Réessayez');
              this.arreterCamera();
              this.resetApresDelai(3000);
              return;
            }
            const formData = new FormData();
            formData.append('image', blob, 'face.jpg');
            this.enregistrerNouveauVisage(patientId, formData);
          });
        }, 1000);
      }
    });
  }

  faireMultipleScans(
    nombreScans: number,
    callback: (patientReconnu: { prenom: string; nom: string } | null) => void,
    scanActuel: number = 0,
    retriesLeft: number = 3,
  ) {
    if (scanActuel >= nombreScans) {
      callback(null);
      return;
    }

    this.setMessage(
      `🔍 Vérification ${scanActuel + 1}/${nombreScans}...`,
      'info',
      'Restez immobile svp',
    );

    setTimeout(() => {
      this.capturerImage((blob) => {
        if (!blob) {
          if (retriesLeft > 0) {
            setTimeout(
              () => this.faireMultipleScans(nombreScans, callback, scanActuel, retriesLeft - 1),
              500,
            );
          } else {
            this.faireMultipleScans(nombreScans, callback, scanActuel + 1, 3);
          }
          return;
        }

        const formData = new FormData();
        formData.append('image', blob, 'face.jpg');

        this.http.post<any>(`${this.API}/reconnaitre`, formData).subscribe({
          next: (res) => {
            if (res.status === 'success') {
              callback({ prenom: res.prenom, nom: res.nom });
            } else {
              this.faireMultipleScans(nombreScans, callback, scanActuel + 1, 3);
            }
          },
          error: () => {
            this.faireMultipleScans(nombreScans, callback, scanActuel + 1, 3);
          },
        });
      });
    }, 800);
  }

  // ─────────────────────────────────────────────
  // ENREGISTREMENT NOUVEAU VISAGE — logique inchangée
  // ─────────────────────────────────────────────
  enregistrerNouveauVisage(patientId: number, formData: FormData) {
    this.http.post<any>(`${this.API}/extraire_vecteur`, formData).subscribe({
      next: (res) => {
        if (res.status === 'success' && res.vecteur) {
          this.setMessage('✅ Visage capturé !', 'success', 'Enregistrement...');

          this.http
            .post<any>(`${this.API}/capture_et_associer`, {
              patient_id: patientId,
              vecteur: res.vecteur,
            })
            .subscribe({
              next: (r1) => {
                if (r1.status === 'accumulating') {
                  this.http
                    .post<any>(`${this.API}/capture_et_associer`, {
                      patient_id: patientId,
                      vecteur: res.vecteur,
                    })
                    .subscribe({
                      next: (r2) => this.handleAssocierResult(r2, patientId),
                      error: () => {
                        this.setMessage('❌ Erreur enregistrement', 'error', 'Réessayez');
                        this.arreterCamera();
                        this.resetApresDelai(3000);
                      },
                    });
                } else {
                  this.handleAssocierResult(r1, patientId);
                }
              },
              error: () => {
                this.setMessage('❌ Erreur serveur', 'error', "Impossible d'associer le visage");
                this.arreterCamera();
                this.resetApresDelai(3000);
              },
            });
        } else {
          this.setMessage('❌ Visage non détecté', 'error', 'Replacez-vous devant la caméra');
          setTimeout(() => {
            if (this.nouveauPatientEnAttente) {
              this.capturerNouveauPatient(this.nouveauPatientEnAttente);
            }
          }, 3000);
        }
      },
      error: () => {
        this.setMessage('❌ Erreur extraction', 'error', 'Réessayez');
        this.arreterCamera();
        this.resetApresDelai(3000);
      },
    });
  }

  // ─────────────────────────────────────────────
  // HANDLER RÉSULTAT ASSOCIER — logique inchangée
  // ─────────────────────────────────────────────
  handleAssocierResult(r: any, patientId: number) {
    this.http.post(`${this.API}/consommer_attente`, {}).subscribe();

    if (r.status === 'success') {
      this.setMessage('✅ Visage enregistré !', 'success', 'Check-in en cours...');

      this.http.post<any>(`${this.API}/checkin`, { patient_id: patientId }).subscribe({
        next: (cr) => {
          if (cr.status === 'success') {
            this.setMessage(
              '✅ Check-in effectué avec succès !',
              'success',
              'Visage et rendez-vous enregistrés',
            );
            this.arreterCamera();
            this.resetApresDelai(5000);
          } else if (cr.status === 'already_checkin') {
            this.setMessage(
              '❌ Check-in non réussi',
              'error',
              "Présence déjà enregistrée aujourd'hui",
            );
            this.arreterCamera();
            this.resetApresDelai(4000);
          } else {
            this.setMessage(
              '✅ Check-in effectué avec succès !',
              'success',
              "Aucun rendez-vous pour aujourd'hui",
            );
            this.arreterCamera();
            this.resetApresDelai(4000);
          }
        },
        error: () => {
          this.setMessage('❌ Check-in non réussi', 'error', 'Erreur serveur');
          this.arreterCamera();
          this.resetApresDelai(3000);
        },
      });
    } else {
      this.setMessage('❌ Erreur enregistrement', 'error', 'Réessayez');
      this.arreterCamera();
      this.resetApresDelai(3000);
    }
  }

  // ─────────────────────────────────────────────
  // UTILITAIRES — logique inchangée
  // ─────────────────────────────────────────────
  capturerImage(callback: (blob: Blob | null) => void) {
    const video = this.videoElement?.nativeElement;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      console.warn('Vidéo non prête', video?.videoWidth, video?.videoHeight);
      callback(null);
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => callback(blob), 'image/jpeg', 0.9);
    canvas.remove();
  }

  setMessage(msg: string, cls: string, sous: string = '') {
    this.message = msg;
    this.messageClass = cls;
    this.sousMessage = sous;
  }

  ngOnDestroy() {
    if (this.attenteInterval) clearInterval(this.attenteInterval);
    this.arreterCamera();
  }
}
