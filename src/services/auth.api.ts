import type { CoachProfile, LoginPayload } from '../types/auth';
import { API_URL, withAppContext } from './apiClient';

// withAppContext : `credentials: 'include'` + X-Ekvara-App: coach (cookie de
// session COACH, indépendant de celui de l'app athlète). Ces appels n'utilisent
// volontairement pas apiFetch : un 401/403 de login/me est un état normal
// (mauvais mot de passe, pas connecté, compte sans profil coach), pas un signal
// de session à propager.
function authFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API_URL}${path}`, withAppContext(init));
}

async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (typeof body?.message === 'string') return body.message;
  } catch {
    // corps non-JSON ou vide : on retombe sur le message générique ci-dessous.
  }
  return `Une erreur est survenue (${response.status})`;
}

// Levée par getCoachMe() sur un 403 : distincte d'un 401 (pas de session du
// tout) — CoachAuthContext s'en sert pour afficher "aucun accès coach" au
// lieu de renvoyer vers /login (voir ticket §6).
export class CoachAccessForbiddenError extends Error {
  constructor() {
    super("Ce compte ne possède pas d'accès coach.");
    this.name = 'CoachAccessForbiddenError';
  }
}

// IMPORTANT (ticket §7) : login() ne renvoie JAMAIS le corps de la réponse.
// POST /auth/login renvoie la forme "athlete" (potentiellement un corps vide
// pour un compte coach-only, voir l'audit backend Ticket #1) — ce corps
// n'est PAS utilisé pour déterminer l'identité coach. Seul le statut HTTP
// compte ici ; l'identité coach est déterminée séparément par getCoachMe().
export async function login(payload: LoginPayload): Promise<void> {
  const response = await authFetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
}

export async function logout(): Promise<void> {
  const response = await authFetch('/auth/logout', { method: 'POST' });
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
}

// null = pas de session coach (401) ; lève CoachAccessForbiddenError si la
// session est valide mais sans profil coach (403) ; renvoie le profil coach
// sinon. Sert de vérification de session : c'est CoachAuthContext qui décide
// quoi faire d'un null/403 selon le moment (démarrage, login, revalidation),
// donc aucun signal global n'est émis ici.
export async function getCoachMe(): Promise<CoachProfile | null> {
  const response = await authFetch('/coach/me');

  if (response.status === 401) {
    return null;
  }
  if (response.status === 403) {
    throw new CoachAccessForbiddenError();
  }
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }

  return response.json();
}
