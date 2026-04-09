import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {

  // 1. ESPIONNAGE : On affiche chaque requête qui sort d'Angular
  console.log(`📡 Envoi de la requête vers : ${req.url}`);

  // 2. GESTION DES RETOURS : On laisse passer la requête et on écoute la réponse
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = '';

      if (error.error instanceof ErrorEvent) {
        // Cas A : Erreur côté Front-end (ex: le wifi de l'utilisateur est coupé)
        errorMessage = `Erreur locale : ${error.error.message}`;
      } else {
        // Cas B : Erreur côté Back-end (Spring Boot a répondu avec une erreur)
        if (error.status === 0) {
          errorMessage = "🚨 ERREUR CRITIQUE : Le serveur Spring Boot est éteint OU tu as oublié @CrossOrigin('*') sur ton Controller !";
        } else if (error.status === 404) {
          errorMessage = `🚨 ERREUR 404 : L'URL ${req.url} n'existe pas dans le backend.`;
        } else if (error.status === 500) {
          errorMessage = "🚨 ERREUR 500 : Le code Java a planté (regarde la console d'IntelliJ).";
        } else {
          errorMessage = `Erreur Back-end : Code ${error.status}\nMessage: ${error.message}`;
        }
      }

      // On affiche l'erreur en rouge vif dans la console du navigateur
      console.error(errorMessage);

      // On renvoie l'erreur pour que le composant puisse afficher un message propre au patient/médecin
      return throwError(() => new Error(errorMessage));
    })
  );
};
