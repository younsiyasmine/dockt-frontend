// ---------------------------------------------------------
// 1. ActeMedicale
// ---------------------------------------------------------
export interface ActeMedicale {
  id_acte?: number; // Le"?"signifie que c'est optionnel (généré par la BDD)
  libelleActe: string;
  dureeEstime: number;
}

// ---------------------------------------------------------
// 2. MedActeRdvId (La clé composite)
// ---------------------------------------------------------
export interface MedActeRdvId {
  idActeMedicale: number;
  idMed: number;
  idRdv: number;
}

// ---------------------------------------------------------
// 3. MedActeRdv (La table de jointure)
// ---------------------------------------------------------
export interface MedActeRdv {
  id?: MedActeRdvId;
  idMed?: number;
  // Attention: Pour éviter les boucles infinies de données (Circular Dependency),
  // il vaut mieux parfois ne pas inclure l'objet entier "rdv" s'il n'est pas nécessaire,
  // mais voici la traduction exacte de ton backend :
  rdv?: RDV;
  acteMedicale?: ActeMedicale;
}

// ---------------------------------------------------------
// 4. PatientDTO
// ---------------------------------------------------------
export interface PatientDTO {
  idPatient?: number;
  nom: string;
  prenom: string;
  cin: string;
  numTelephone: number;
  sexe: boolean;
  dateNaissance: string;
  adresse: string;
}

// ---------------------------------------------------------
// 5. Planning
// ---------------------------------------------------------
//A ajouter plus tard

// ---------------------------------------------------------
// 6. Les Énumérations (Enums)
// ---------------------------------------------------------
// Bien que tu n'aies pas fourni le code des enums,
// il est très recommandé de les créer en TS pour éviter les fautes de frappe !
export enum StatutRDV {
  CONFIRME = 'CONFIRME',
  ANNULE = 'ANNULE',
  MODIFIE_CONFIRME = 'MODIFIE_CONFIRME',
  PASSE = 'PASSE'
}

export enum StatutConsultation {
  EN_ATTENTE = 'EN_ATTENTE',
  EN_CONSULTATION = 'EN_CONSULTATION',
  TERMINE = 'TERMINE'
}

// ---------------------------------------------------------
// 7. RDV (Le modèle principal)
// ---------------------------------------------------------
export interface RDV {
  id?: number;
  datePrevue: string;
  heurePrevue: string;
  heureEffective?: string;
  heureFin?: string;
  statutRdv?: StatutRDV | string; // Accepte l'enum ou une chaine de caractères
  checkIn?: boolean;
  statutConsultation?: StatutConsultation | string;
  position?: number;
  idPatient?: number;
  idSecretaire?: number;
  medActeRdvs?: MedActeRdv[]; // List<MedActeRdv> devient un tableau
  patient?: PatientDTO;
}

// ---------------------------------------------------------
// 8. Ordonnance (MS3)
// ---------------------------------------------------------
export interface Ordonnance {
  idOrdonnance?: number;
  dateEmmission?: string;
  contenuTexte: string;
  type: string;
  idRdv: number;
}

// ---------------------------------------------------------
// 9. CompteRendu (MS3)
// ---------------------------------------------------------
export interface CompteRendu {
  idCr?: number;
  dateRedaction?: string;
  contenu: string;
  statut?: string; // 'DEMANDE' | 'EN_ATTENTE' | 'VALIDE'
  messagePatient?: string;
  idRdv: number;
}

