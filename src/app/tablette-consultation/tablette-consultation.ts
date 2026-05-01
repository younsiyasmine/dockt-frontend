import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-tablette-consultation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tablette-consultation.html',
  styleUrls: [],
})
export class TabletteConsultationComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;

  message: string = 'Veuillez vous placer devant la caméra';
  messageClass: string = 'info';
  patientNom: string = '';
  scanInterval: any;
  isScanning: boolean = true;
  isProcessing: boolean = false;

  private stream: MediaStream | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.demarrerCamera();
    this.demarrerScanPeriodique();
  }

  demarrerCamera() {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        this.stream = stream;
        if (this.videoElement) {
          this.videoElement.nativeElement.srcObject = stream;
        }
      })
      .catch((err) => {
        console.error('Erreur caméra:', err);
        this.message = "Impossible d'accéder à la caméra";
        this.messageClass = 'error';
      });
  }

  demarrerScanPeriodique() {
    this.scanInterval = setInterval(() => {
      if (this.isScanning && this.videoElement?.nativeElement && !this.isProcessing) {
        this.capturerEtReconnaitre();
      }
    }, 3000);
  }

  capturerEtReconnaitre() {
    const video = this.videoElement.nativeElement;
    if (video.videoWidth === 0) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    canvas.toBlob((blob) => {
      if (blob) {
        const formData = new FormData();
        formData.append('image', blob, 'face.jpg');

        this.isProcessing = true;

        this.http.post('http://localhost:8000/api/visage/reconnaitre', formData).subscribe({
          next: (response: any) => {
            if (response.status === 'success') {
              const patientId = response.patient_id;
              const patientNomReconnu = `${response.prenom} ${response.nom}`;

              // Vérifier si c'est le début ou la fin
              this.http.get(`http://localhost:8081/api/rdv/patient/${patientId}`).subscribe({
                next: (rdvs: any) => {
                  const aujourdHui = new Date().toISOString().split('T')[0];
                  const rdv = rdvs.find((r: any) => r.datePrevue === aujourdHui);

                  if (rdv) {
                    const statutActuel = rdv.statutConsultation;

                    if (statutActuel === 'EN_ATTENTE' || statutActuel === null) {
                      // Début consultation
                      this.http
                        .put(
                          `http://localhost:8081/api/file-attente/statut-consultation/${rdv.id}?statutConsultation=EN_CONSULTATION`,
                          {},
                        )
                        .subscribe({
                          next: () => {
                            this.patientNom = patientNomReconnu;
                            this.message = `Début consultation pour ${patientNomReconnu}`;
                            this.messageClass = 'success';
                            this.isScanning = true;
                            this.isProcessing = false;
                            setTimeout(() => {
                              this.message = 'Scan terminé, attente prochain patient';
                              this.messageClass = 'info';
                            }, 3000);
                          },
                          error: () => {
                            this.message = 'Erreur début consultation';
                            this.messageClass = 'error';
                            this.isProcessing = false;
                          },
                        });
                    } else if (statutActuel === 'EN_CONSULTATION') {
                      // Fin consultation
                      this.http
                        .put(
                          `http://localhost:8081/api/file-attente/statut-consultation/${rdv.id}?statutConsultation=TERMINE`,
                          {},
                        )
                        .subscribe({
                          next: () => {
                            this.patientNom = '';
                            this.message = `Fin consultation pour ${patientNomReconnu}`;
                            this.messageClass = 'success';
                            this.isScanning = true;
                            this.isProcessing = false;
                            setTimeout(() => {
                              this.message = 'Prêt pour prochain patient';
                              this.messageClass = 'info';
                            }, 3000);
                          },
                          error: () => {
                            this.message = 'Erreur fin consultation';
                            this.messageClass = 'error';
                            this.isProcessing = false;
                          },
                        });
                    } else {
                      this.message = `Patient déjà ${statutActuel}`;
                      this.messageClass = 'error';
                      this.isProcessing = false;
                    }
                  } else {
                    this.message = "Aucun RDV trouvé aujourd'hui";
                    this.messageClass = 'error';
                    this.isProcessing = false;
                  }
                },
                error: () => {
                  this.message = 'Erreur récupération RDV';
                  this.messageClass = 'error';
                  this.isProcessing = false;
                },
              });
            }
          },
          error: () => {
            this.isProcessing = false;
          },
        });
      }
    }, 'image/jpeg');
  }

  ngOnDestroy() {
    if (this.scanInterval) clearInterval(this.scanInterval);
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
    }
  }
}
