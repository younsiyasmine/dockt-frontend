import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
// 1. On indique à l'ordinateur où trouver vos DEUX composants
import { GererDossier } from './gerer-dossier/gerer-dossier';
import { AjouterRdv } from './ajouter-rdv/ajouter-rdv';
import { DicterOrdonnance } from './dicter-ordonnance/dicter-ordonnance';
import { VueOrdonnance } from './vue-ordonnance/vue-ordonnance';


@Component({
  selector: 'app-root',
  // 2. On les ajoute officiellement tous les deux dans la liste
  imports: [RouterOutlet, GererDossier, AjouterRdv, DicterOrdonnance, VueOrdonnance],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('front-gestion-dossier');
}
