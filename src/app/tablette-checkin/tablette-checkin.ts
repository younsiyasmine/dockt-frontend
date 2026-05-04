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

  private readonly API = 'http://localhost:8000/api/visage';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.verifierNouveauPatientPeriodiquement();
  }

  // ─────────────────────────────────────────────
  // GESTION CAMÉRA
  // ─────────────────────────────────────────────
  demarrerCamera(): Promise<void> {
    return navigator.mediaDevices
      .getUserMedia({ video: { width: 1280, height: 720 } })
      .then((stream) => {
        this.stream = stream;
        this.cameraActive = true;

        if (this.videoElement) {
          this.videoElement.nativeElement.srcObject = stream;
        }

        return new Promise<void>((resolve) => {
          const checkInterval = setInterval(() => {
            const video = this.videoElement?.nativeElement;
            if (video && video.videoWidth > 0 && video.videoHeight > 0) {
              clearInterval(checkInterval);
              resolve();
            }
          }, 100);
        });
      })
      .catch((err) => {
        this.setMessage("Impossible d'accéder à la caméra", 'error', err.message);
        this.cameraActive = false;
        throw err;
      });
  }

  arreterCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.cameraActive = false;
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
  // BOUTON SCANNER (PATIENT EXISTANT)
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
            const { patient_id, nom, prenom } = res;
            this.setMessage(`Bonjour ${prenom} ${nom} !`, 'success', 'Check-in en cours...');

            this.http.post<any>(`${this.API}/checkin`, { patient_id, nom, prenom }).subscribe({
              next: (r) => {
                // ✅ CAS 1 : Check-in réussi
                if (r.status === 'success') {
                  this.setMessage(
                    '✅ Votre présence a été bien effectuée !',
                    'success',
                    `Bienvenue ${prenom} ${nom}`,
                  );
                  this.arreterCamera();
                  this.resetApresDelai(5000);
                }
                // ⚠️ CAS 2 : Aucun RDV aujourd'hui
                else if (r.status === 'no_rdv') {
                  this.setMessage(
                    "⚠️ Aucun RDV aujourd'hui",
                    'warning',
                    `${prenom} ${nom} — Contactez la secrétaire`,
                  );
                  this.arreterCamera();
                  this.resetApresDelai(4000);
                }
                // ⚠️ CAS 3 : Déjà check-in
                else if (r.status === 'already_checkin') {
                  this.setMessage(
                    '⚠️ Présence déjà enregistrée !',
                    'warning',
                    `${prenom} ${nom} — Check-in déjà effectué aujourd'hui`,
                  );
                  this.arreterCamera();
                  this.resetApresDelai(4000);
                }
                // ❌ CAS 4 : Erreur
                else {
                  this.setMessage('❌ Erreur check-in', 'error', 'Réessayez');
                  this.arreterCamera();
                  this.resetApresDelai(3000);
                }
              },
              error: () => {
                this.setMessage('❌ Erreur check-in', 'error', 'Réessayez');
                this.arreterCamera();
                this.resetApresDelai(3000);
              },
            });
          } else {
            this.setMessage('❌ Non reconnu', 'error', 'Veuillez contacter la secrétaire');
            this.arreterCamera();
            this.resetApresDelai(4000);
          }
        },
        error: () => {
          this.setMessage('❌ Erreur reconnaissance', 'error', 'Réessayez');
          this.arreterCamera();
          this.resetApresDelai(3000);
        },
      });
    });
  }

  // ─────────────────────────────────────────────
  // VÉRIFICATION NOUVEAU PATIENT
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
  // NOUVEAU PATIENT — 3 SCANS ANTI-USURPATION
  // ─────────────────────────────────────────────
  capturerNouveauPatient(patientId: number) {
    this.isProcessing = true;
    this.setMessage('🔍 Vérification en cours...', 'info', 'Analyse de votre visage (3 scans)...');

    // 3 scans pour être sûr que ce visage n'est pas déjà en base
    this.faireMultipleScans(3, (patientReconnu) => {
      if (patientReconnu) {
        // ❌ Ce visage appartient déjà à quelqu'un
        const { prenom, nom } = patientReconnu;
        this.setMessage(
          '❌ Ce visage appartient déjà à un patient !',
          'error',
          `${prenom} ${nom} — Veuillez contacter la secrétaire`,
        );
        this.http.post(`${this.API}/consommer_attente`, {}).subscribe();
        this.arreterCamera();
        this.resetApresDelai(5000);
      } else {
        // ✅ Visage inconnu → on l'enregistre
        this.setMessage('📸 Capture en cours...', 'info', 'Ne bougez pas svp');
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
      }
    });
  }

  // 🔁 Faire N scans — si AU MOINS 1 reconnaît quelqu'un → bloquer
  faireMultipleScans(
    nombreScans: number,
    callback: (patientReconnu: { prenom: string; nom: string } | null) => void,
    scanActuel: number = 0,
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
          this.faireMultipleScans(nombreScans, callback, scanActuel + 1);
          return;
        }

        const formData = new FormData();
        formData.append('image', blob, 'face.jpg');

        this.http.post<any>(`${this.API}/reconnaitre`, formData).subscribe({
          next: (res) => {
            if (res.status === 'success') {
              // Visage reconnu → bloquer immédiatement
              callback({ prenom: res.prenom, nom: res.nom });
            } else {
              // Pas reconnu → scan suivant
              this.faireMultipleScans(nombreScans, callback, scanActuel + 1);
            }
          },
          error: () => {
            // 404 = non reconnu → scan suivant
            this.faireMultipleScans(nombreScans, callback, scanActuel + 1);
          },
        });
      });
    }, 800);
  }

  // ─────────────────────────────────────────────
  // ENREGISTREMENT NOUVEAU VISAGE
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
              next: (r) => {
                this.http.post(`${this.API}/consommer_attente`, {}).subscribe();

                if (r.status === 'success') {
                  this.setMessage('✅ Visage enregistré !', 'success', 'Check-in en cours...');

                  this.http.post<any>(`${this.API}/checkin`, { patient_id: patientId }).subscribe({
                    next: (cr) => {
                      // ✅ CAS 1 : Check-in réussi
                      if (cr.status === 'success') {
                        this.setMessage(
                          '✅ Votre présence a été bien effectuée !',
                          'success',
                          'Visage et RDV enregistrés',
                        );
                        this.arreterCamera();
                        this.resetApresDelai(5000);
                      }
                      // ⚠️ CAS 2 : Déjà check-in
                      else if (cr.status === 'already_checkin') {
                        this.setMessage(
                          '⚠️ Présence déjà enregistrée !',
                          'warning',
                          "Check-in déjà effectué aujourd'hui",
                        );
                        this.arreterCamera();
                        this.resetApresDelai(4000);
                      }
                      // ⚠️ CAS 3 : Pas de RDV
                      else {
                        this.setMessage(
                          '✅ Visage enregistré',
                          'success',
                          "Aucun RDV pour aujourd'hui",
                        );
                        this.arreterCamera();
                        this.resetApresDelai(4000);
                      }
                    },
                    error: () => {
                      this.setMessage('✅ Visage enregistré', 'warning', 'Erreur check-in');
                      this.arreterCamera();
                      this.resetApresDelai(3000);
                    },
                  });
                } else {
                  this.setMessage('❌ Erreur enregistrement', 'error', 'Réessayez');
                  this.arreterCamera();
                  this.resetApresDelai(3000);
                }
              },
              error: () => {
                this.setMessage('❌ Erreur serveur', 'error', "Impossible d'associer le visage");
                this.arreterCamera();
                this.resetApresDelai(3000);
              },
            });
        } else {
          // Visage non détecté → réessayer
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
  // UTILITAIRES
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
