import { Component, Output, EventEmitter, Input } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrdonnanceService } from '../core/services/ordonnance.service';
import { Ordonnance } from '../core/models/models';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-dicter-ordonnance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dicter-ordonnance.html',
  styleUrl: './dicter-ordonnance.css',
})
export class DicterOrdonnance {
  @Output() fermerModale = new EventEmitter<void>();
  @Output() ordonnanceValidee = new EventEmitter<void>();
  @Input() idRdv: number = 1;
  @Input() patientNom: string = '';

  isRecording = false;
  texteOrdonnance = '';
  typeOrdonnance = 'Médicament';
  isSaving = false;
  isTranscribing = false;

  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private readonly API_PYTHON = 'http://localhost:8000/api/transcribe';

  constructor(
    private ordonnanceService: OrdonnanceService,
    private router: Router,
    private http: HttpClient,
  ) {}

  annuler() {
    this.fermerModale.emit();
  }

  valider() {
    if (!this.texteOrdonnance.trim()) return;

    this.isSaving = true;
    const ordonnance: Ordonnance = {
      contenuTexte: this.texteOrdonnance,
      type: this.typeOrdonnance,
      idRdv: this.idRdv,
    };

    this.ordonnanceService.sauvegarderOrdonnance(ordonnance).subscribe({
      next: (data) => {
        console.log('Ordonnance sauvegardée:', data);
        this.isSaving = false;
        this.ordonnanceValidee.emit();
        this.router.navigate(['/voir-ordonnance', data.idOrdonnance]);
      },
      error: (err) => {
        console.error('Erreur sauvegarde ordonnance:', err);
        this.isSaving = false;
      },
    });
  }

  async toggleMicrophone() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  async startRecording() {
    this.isRecording = true;
    this.audioChunks = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);

      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.onstop = () => {
        this.transcribeAudio();
      };

      this.mediaRecorder.start();
    } catch (error) {
      console.error('Erreur accès microphone:', error);
      this.isRecording = false;
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      this.isRecording = false;
      this.isTranscribing = true;
    }
  }

  transcribeAudio() {
    const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    this.http.post<{ texte_transcrit: string }>(this.API_PYTHON, formData).subscribe({
      next: (response) => {
        this.isTranscribing = false;
        const nouveauTexte = response.texte_transcrit;
        this.texteOrdonnance += (this.texteOrdonnance ? '\n' : '') + nouveauTexte;
        console.log('Transcription reçue:', nouveauTexte);
      },
      error: (error) => {
        this.isTranscribing = false;
        console.error('Erreur transcription:', error);
      },
    });
  }

  effacerTexte() {
    this.texteOrdonnance = '';
  }
}
