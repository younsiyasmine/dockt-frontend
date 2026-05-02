import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-tablette-checkin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tablette-checkin.html',
  styleUrls: [],
})
export class TabletteCheckinComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;

  // Variables pour l'affichage
  message: string = 'Veuillez vous placer devant la caméra';
  sousMessage: string = 'Placez votre visage dans le cadre jaune';
  messageClass: string = 'info';

  // ✅ Variables utilisées dans le HTML
  cameraActive: boolean = false;
  isProcessing: boolean = false;
  patientEnAttente: boolean = false;

  private scanInterval: any;
  private attenteInterval: any;
  private isScanning: boolean = true;
  private isCheckingKnown: boolean = false;
  private isCapturingNew: boolean = false;
  private nouveauPatientEnAttente: number | null = null;
  private stream: MediaStream | null = null;

  private readonly API = 'http://localhost:8000/api/visage';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.demarrerCamera();
    this.verifierNouveauPatientPeriodiquement();
    //this.scannerPatientConnuPeriodiquement();
  }

  // ─────────────────────────────────────────────
  // DÉMARRAGE CAMÉRA
  // ─────────────────────────────────────────────
  demarrerCamera() {
    navigator.mediaDevices
      .getUserMedia({ video: { width: 1280, height: 720 } })
      .then((stream) => {
        this.stream = stream;
        if (this.videoElement) {
          this.videoElement.nativeElement.srcObject = stream;
        }
        console.log('✅ Caméra accessible');
        this.cameraActive = true;
      })
      .catch((err) => {
        this.setMessage("Impossible d'accéder à la caméra", 'error', err.message);
        this.cameraActive = false;
      });
  }

  arreterCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.cameraActive = false;
  }

  // ─────────────────────────────────────────────
  // BOUTON SCANNER
  // ─────────────────────────────────────────────
  demarrerScan() {
    if (this.isProcessing) return;

    this.isProcessing = true;
    this.patientEnAttente = false;
    this.setMessage('🔍 Scan en cours...', 'info', 'Veuillez patienter');

    this.capturerImage((blob) => {
      if (!blob) {
        this.setMessage('❌ Échec capture', 'error', 'Réessayez');
        this.resetApres3s();
        return;
      }

      const formData = new FormData();
      formData.append('image', blob, 'face.jpg');

      this.http.post<any>(`${this.API}/reconnaitre`, formData).subscribe({
        next: (res) => {
          if (res.status === 'success') {
            const { patient_id, nom, prenom } = res;
            this.setMessage(`Bonjour ${prenom} ${nom} !`, 'success', 'Check-in en cours...');

            this.http.post<any>(`${this.API}/checkin`, { patient_id, nom, prenom }).subscribe({
              next: (r) => {
                if (r.status === 'success') {
                  this.setMessage(
                    '✅ Check-in effectué !',
                    'success',
                    `${prenom} ${nom} — Bienvenue !`,
                  );
                } else if (r.status === 'no_rdv') {
                  this.setMessage(`⚠️ Aucun RDV aujourd'hui`, 'warning', `${prenom} ${nom}`);
                }
                this.resetApres3s();
              },
              error: () => {
                this.setMessage('❌ Erreur check-in', 'error', 'Réessayez');
                this.resetApres3s();
              },
            });
          } else {
            this.setMessage('❌ Non reconnu', 'error', 'Veuillez contacter la secrétaire');
            this.resetApres3s();
          }
        },
        error: () => {
          this.setMessage('❌ Erreur reconnaissance', 'error', 'Réessayez');
          this.resetApres3s();
        },
      });
    });
  }

  // ─────────────────────────────────────────────
  // VÉRIFICATION NOUVEAU PATIENT
  // ─────────────────────────────────────────────
  verifierNouveauPatientPeriodiquement() {
    this.attenteInterval = setInterval(() => {
      if (this.isCapturingNew) return;

      this.http.get<any>(`${this.API}/verifier_attente`).subscribe({
        next: (res) => {
          if (res.status === 'pending') {
            const patientId = res.patient_id;
            this.patientEnAttente = true;
            this.isCapturingNew = true;
            this.isScanning = false;
            this.nouveauPatientEnAttente = patientId;

            this.setMessage(`📸 Nouveau patient`, 'info', 'Placez-vous devant la caméra');

            setTimeout(() => this.capturerNouveauPatient(patientId), 3000);
          } else {
            this.patientEnAttente = false;
          }
        },
        error: () => {
          this.patientEnAttente = false;
        },
      });
    }, 2000);
  }

  capturerNouveauPatient(patientId: number) {
    this.isProcessing = true;
    this.setMessage('📸 Capture en cours...', 'info', 'Ne bougez pas svp');

    this.capturerImage((blob) => {
      if (!blob) {
        this.setMessage('❌ Échec capture', 'error', 'Réessayez');
        this.resetApres3s();
        return;
      }

      const formData = new FormData();
      formData.append('image', blob, 'face.jpg');

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
                next: (r) => {
                  this.http.post(`${this.API}/consommer_attente`, {}).subscribe();

                  if (r.status === 'success') {
                    this.setMessage('✅ Visage enregistré !', 'success', 'Check-in en cours...');

                    this.http
                      .post<any>(`${this.API}/checkin`, { patient_id: patientId })
                      .subscribe({
                        next: (cr) => {
                          if (cr.status === 'success') {
                            this.setMessage(
                              '✅ Check-in effectué !',
                              'success',
                              'Visage et RDV enregistrés',
                            );
                          } else if (cr.status === 'no_rdv') {
                            this.setMessage(
                              '✅ Visage enregistré',
                              'success',
                              "Aucun RDV pour aujourd'hui",
                            );
                          }
                          this.resetApres3s();
                        },
                        error: () => {
                          this.setMessage(
                            '⚠️ Visage enregistré',
                            'warning',
                            'Erreur lors du check-in',
                          );
                          this.resetApres3s();
                        },
                      });
                  } else {
                    this.setMessage('❌ Erreur enregistrement', 'error', 'Réessayez');
                    this.resetApres3s();
                  }
                },
                error: () => {
                  this.setMessage('❌ Erreur serveur', 'error', "Impossible d'associer le visage");
                  this.resetApres3s();
                },
              });
          } else {
            this.setMessage('❌ Visage non détecté', 'error', 'Replacez-vous devant la caméra');
            setTimeout(() => {
              this.isCapturingNew = false;
              this.isProcessing = false;
              if (this.nouveauPatientEnAttente) {
                this.isCapturingNew = true;
                setTimeout(() => this.capturerNouveauPatient(this.nouveauPatientEnAttente!), 2000);
              }
            }, 3000);
          }
        },
        error: () => {
          this.setMessage('❌ Erreur extraction', 'error', 'Réessayez');
          this.resetApres3s();
        },
      });
    });
  }

  // ─────────────────────────────────────────────
  // SCAN PATIENT CONNU
  // ─────────────────────────────────────────────
  scannerPatientConnuPeriodiquement() {
    this.scanInterval = setInterval(() => {
      if (
        this.isScanning &&
        !this.isCheckingKnown &&
        !this.isCapturingNew &&
        !this.nouveauPatientEnAttente
      ) {
        this.scannerPatientConnu();
      }
    }, 3000);
  }

  scannerPatientConnu() {
    if (this.isCheckingKnown || this.isCapturingNew || this.nouveauPatientEnAttente) return;

    this.isCheckingKnown = true;

    this.capturerImage((blob) => {
      if (!blob || this.isCapturingNew) {
        this.isCheckingKnown = false;
        return;
      }

      const formData = new FormData();
      formData.append('image', blob, 'face.jpg');

      this.http.post<any>(`${this.API}/reconnaitre`, formData).subscribe({
        next: (res) => {
          if (this.isCapturingNew || this.nouveauPatientEnAttente) {
            this.isCheckingKnown = false;
            return;
          }

          if (res.status === 'success') {
            const { patient_id, nom, prenom } = res;
            this.isScanning = false;

            this.setMessage(`Bonjour ${prenom} ${nom} !`, 'success', 'Check-in en cours...');

            this.http.post<any>(`${this.API}/checkin`, { patient_id, nom, prenom }).subscribe({
              next: (r) => {
                if (r.status === 'success') {
                  this.setMessage(
                    '✅ Check-in effectué !',
                    'success',
                    `${prenom} ${nom} — Bienvenue !`,
                  );
                } else if (r.status === 'no_rdv') {
                  this.setMessage(`⚠️ Aucun RDV aujourd'hui`, 'warning', `${prenom} ${nom}`);
                }
                this.isCheckingKnown = false;
                this.resetApres3s();
              },
              error: () => {
                this.setMessage('❌ Erreur check-in', 'error', 'Réessayez');
                this.isCheckingKnown = false;
                this.resetApres3s();
              },
            });
          } else {
            this.isCheckingKnown = false;
          }
        },
        error: () => {
          this.isCheckingKnown = false;
        },
      });
    });
  }

  // ─────────────────────────────────────────────
  // UTILITAIRES
  // ─────────────────────────────────────────────
  capturerImage(callback: (blob: Blob | null) => void) {
    const video = this.videoElement?.nativeElement;
    if (!video || video.videoWidth === 0) {
      callback(null);
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => callback(blob), 'image/jpeg', 0.9);
  }

  setMessage(msg: string, cls: string, sous: string = '') {
    this.message = msg;
    this.messageClass = cls;
    this.sousMessage = sous;
  }

  resetApres3s() {
    setTimeout(() => {
      this.setMessage(
        'Veuillez vous placer devant la caméra',
        'info',
        'Placez votre visage dans le cadre jaune',
      );
      this.isProcessing = false;
      this.isScanning = true;
      this.isCheckingKnown = false;
      this.isCapturingNew = false;
      this.nouveauPatientEnAttente = null;
      this.patientEnAttente = false;
    }, 3000);
  }

  resetApres5s() {
    setTimeout(() => {
      this.setMessage(
        'Veuillez vous placer devant la caméra',
        'info',
        'Placez votre visage dans le cadre jaune',
      );
      this.isProcessing = false;
      this.isScanning = true;
      this.isCheckingKnown = false;
      this.isCapturingNew = false;
      this.nouveauPatientEnAttente = null;
      this.patientEnAttente = false;
    }, 5000);
  }

  ngOnDestroy() {
    if (this.scanInterval) clearInterval(this.scanInterval);
    if (this.attenteInterval) clearInterval(this.attenteInterval);
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
    }
  }
}
