export interface LoginPatientRequest {
  email: string;
  password: string;
}

export interface LoginMedecinRequest {
  login: string;
  password: string;
}

export interface LoginSecretaireRequest {
  login: string;
  password: string;
}

export interface RegisterPatientRequest {
  email: string;
  password: string;
  nom: string;
  prenom: string;
  cin?: string;
  sex: boolean;
  numTelephone: string;
  dateNaissance: string;
  adresse?: string;
}

export interface PatientResponse {
  idPatient: number;
  patientLogin: string;
  nom: string;
  prenom: string;
  cin?: string;
  sexe: boolean;
  numTelephone: number;
  dateNaissance: string;
  adresse?: string;
}

export interface MedecinResponse {
  idMedecin: number;
  medLogin: string;
  nom: string;
  prenom: string;
  cin?: string;
  telephone?: string;
  specialite?: string;
}

export interface SecretaireResponse {
  idSecretaire: number;
  secLogin: string;
  cin?: string;
  nom: string;
  prenom: string;
  telephone?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  role: 'PATIENT' | 'MEDECIN' | 'SECRETAIRE';
  user: PatientResponse | MedecinResponse | SecretaireResponse;
}
