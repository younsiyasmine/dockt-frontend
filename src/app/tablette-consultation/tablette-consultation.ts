import {
  Component,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewInit,
  ChangeDetectorRef,
  NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

// Trois états UI possibles :
// - 'attente'      : bouton visible, caméra inactive
// - 'scanning'     : caméra active, détection en cours
// - 'succes'       : résultat positif (début ou fin OK)
// - 'non_reconnu'  : patient non reconnu / pas son tour / pas de check-in
type EtatUI = 'attente' | 'scanning' | 'succes' | 'non_reconnu';

interface ResultatFlask {
  status:          string;  // success | no_face | inconnu | patient_non_reconnu | error
  action?:         string;  // "debut" | "fin"
  message?:        string;
  patient_id?:     string;
  nom?:            string;
  prenom?:         string;
  rdv_id?:         number;
  duree_secondes?: number;
}

@Component({
  selector:    'app-tablette-consultation',
  standalone:  true,
  imports:     [CommonModule],
  templateUrl: './tablette-consultation.html',
  styleUrls:   ['./tablette-consultation.css'],
})
export class TabletteConsultationComponent implements OnDestroy, AfterViewInit {

  // Endpoint unique Flask — gère automatiquement début ET fin
  private readonly IA_URL = 'http://localhost:8000/api/visage/consulter';

  @ViewChild('videoEl')       videoEl!:       ElementRef<HTMLVideoElement>;
  @ViewChild('canvasEl')      canvasEl!:      ElementRef<HTMLCanvasElement>;
  @ViewChild('overlayCanvas') overlayCanvas!: ElementRef<HTMLCanvasElement>;

  private stream:            MediaStream | null = null;
  private detectionInterval: ReturnType<typeof setInterval> | null = null;
  private faceInterval:      ReturnType<typeof setInterval> | null = null;
  private detectingNow = false;

  // ── UI State ─────────────────────────────────────────────────
  etat:          EtatUI = 'attente';
  cameraActive           = false;
  isProcessing           = false;
  message                = '';
  nomPatient             = '';
  prenomPatient          = '';
  erreurCamera           = '';

  // Durée avant retour à l'état initial (ms)
  private readonly COOLDOWN_MS = 5000;

  constructor(
    private http: HttpClient,
    private cdr:  ChangeDetectorRef,
    private zone: NgZone,
  ) {}

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.arreterTout();
  }

  // ── Reset UI vers état initial ────────────────────────────────
  private resetUI(): void {
    this.etat          = 'attente';
    this.message       = '';
    this.nomPatient    = '';
    this.prenomPatient = '';
    this.cdr.detectChanges();
  }

  // ── Bouton "Démarrer la caméra" ───────────────────────────────
  async demarrerCamera(): Promise<void> {
    if (this.cameraActive || this.isProcessing) return;

    try {
      this.erreurCamera = '';
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });

      const video = this.videoEl.nativeElement;
      video.srcObject = this.stream;
      await video.play();

      this.cameraActive = true;
      this.etat         = 'scanning';
      this.cdr.detectChanges();

      // Adapter le canvas overlay à la vidéo
      video.addEventListener('loadedmetadata', () => {
        this.ajusterOverlayCanvas();
      });

      // Dessiner le rectangle vert toutes les 100ms
      this.faceInterval = setInterval(() => {
        this.zone.runOutsideAngular(() => {
          this.dessinerRectangleVisage();
        });
      }, 100);

      // Envoyer une frame à Flask toutes les 2.5 secondes
      this.detectionInterval = setInterval(() => {
        this.capturerEtEnvoyer();
      }, 2500);

    } catch (err) {
      this.erreurCamera = "Impossible d'accéder à la caméra. Vérifiez les permissions.";
      this.cdr.detectChanges();
    }
  }

  // ── Arrêt complet caméra + intervalles ───────────────────────
  arreterTout(): void {
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }
    if (this.faceInterval) {
      clearInterval(this.faceInterval);
      this.faceInterval = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    this.cameraActive = false;
    this.detectingNow = false;
    this.effacerOverlay();
    this.cdr.detectChanges();
  }

  // ── Adapter canvas overlay à la vidéo ────────────────────────
  private ajusterOverlayCanvas(): void {
    const video   = this.videoEl.nativeElement;
    const overlay = this.overlayCanvas.nativeElement;
    overlay.width  = video.videoWidth  || 640;
    overlay.height = video.videoHeight || 480;
  }

  // ── Dessiner rectangle guide vert ─────────────────────────────
  private dessinerRectangleVisage(): void {
    const video   = this.videoEl.nativeElement;
    const overlay = this.overlayCanvas.nativeElement;
    const ctx     = overlay.getContext('2d');
    if (!ctx || !this.cameraActive) return;

    if (overlay.width !== video.videoWidth && video.videoWidth > 0) {
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

    // Rectangle vert
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth   = 2.5;
    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur  = 8;
    ctx.strokeRect(rectX, rectY, rectW, rectH);

    // Label "Visage 1" en haut du rectangle
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(rectX, rectY - 22, 64, 20);
    ctx.fillStyle    = '#ffffff';
    ctx.font         = '11px Segoe UI, sans-serif';
    ctx.shadowBlur   = 0;
    ctx.fillText('Visage 1', rectX + 6, rectY - 8);
  }

  // ── Effacer overlay ───────────────────────────────────────────
  private effacerOverlay(): void {
    const overlay = this.overlayCanvas?.nativeElement;
    if (!overlay) return;
    const ctx = overlay.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, overlay.width, overlay.height);
  }

  // ── Capturer frame depuis la vidéo ───────────────────────────
  private capturerEtEnvoyer(): void {
    if (this.detectingNow || !this.cameraActive) return;

    const video  = this.videoEl.nativeElement;
    const canvas = this.canvasEl.nativeElement;
    const ctx    = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(blob => {
      if (blob) this.envoyerAuFlask(blob);
    }, 'image/jpeg', 0.85);
  }

  // ── Envoyer à Flask /api/visage/consulter ─────────────────────
  private envoyerAuFlask(blob: Blob): void {
    this.detectingNow = true;
    this.isProcessing = true;
    this.cdr.detectChanges();

    const formData = new FormData();
    formData.append('image', blob, 'frame.jpg');

    this.http.post<ResultatFlask>(this.IA_URL, formData).subscribe({
      next: res => {
        this.zone.run(() => {
          this.isProcessing = false;
          this.traiterResultat(res);
        });
      },
      error: () => {
        this.zone.run(() => {
          this.detectingNow = false;
          this.isProcessing = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  // ── Traitement de la réponse Flask ────────────────────────────
  private traiterResultat(res: ResultatFlask): void {
    console.log('Résultat Flask:', res);

    // Aucun visage → continuer le scan silencieusement
    if (res.status === 'no_face') {
      this.detectingNow = false;
      return;
    }

    // Arrêter la caméra pour tous les autres résultats
    this.arreterTout();
    this.nomPatient    = res.nom    || '';
    this.prenomPatient = res.prenom || '';

    if (res.status === 'success') {
      // Début ou fin de consultation réussie
      this.etat    = 'succes';
      this.message = res.message || '';
    } else {
      // patient_non_reconnu | inconnu | error | no_checkin | mauvais_patient
      // → dans tous ces cas, on affiche "Patient non reconnu"
      this.etat    = 'non_reconnu';
      this.message = 'Patient non reconnu.';
      // On vide le nom pour ne pas l'afficher
      this.nomPatient    = '';
      this.prenomPatient = '';
    }

    this.cdr.detectChanges();

    // Retour automatique à l'état initial
    setTimeout(() => this.resetUI(), this.COOLDOWN_MS);
  }
}
