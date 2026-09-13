// Forme réelle de GET /coach/me (voir CoachService.toCoachProfileView côté
// backend) — jamais le type Athlete de l'app athlète, ce sont deux identités
// distinctes même si elles partagent le même app_user (utilisateur hybride).
export interface CoachProfileUser {
  id: string;
  prenom: string | null;
  nom: string | null;
  email: string;
}

export interface CoachProfileClub {
  id: string;
  nom: string;
  pays: string | null;
  ville: string | null;
}

export interface CoachProfile {
  id: string;
  user: CoachProfileUser;
  club: CoachProfileClub | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}
