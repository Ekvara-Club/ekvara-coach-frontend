import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  CoachAccessForbiddenError,
  getCoachMe,
  login as apiLogin,
  logout as apiLogout,
} from '../services/auth.api';
import {
  FOCUS_REVALIDATE_MIN_INTERVAL_MS,
  createSessionRevalidator,
  setRevalidateListener,
  setUnauthorizedListener,
} from '../services/session';
import { navigateTo } from '../utils/navigation';
import type { CoachProfile, LoginPayload } from '../types/auth';

interface CoachAuthContextValue {
  coach: CoachProfile | null;
  loading: boolean;
  // true = session authentifiée mais sans profil coach (403 sur
  // GET /coach/me) — distinct de "pas de session du tout" (ticket §6).
  accessDenied: boolean;
  // Explication à afficher sur /login quand une session a été perdue (expirée,
  // remplacée) : jamais un "Accès réservé aux comptes coach" brut issu d'un 403.
  sessionNotice: string | null;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshCoach: () => Promise<void>;
}

const SESSION_EXPIRED_NOTICE = 'Ta session a expiré. Reconnecte-toi pour continuer.';
const SESSION_CHANGED_NOTICE = "Ta session a changé (ce navigateur n'est plus connecté avec un compte coach). Reconnecte-toi.";

const CoachAuthContext = createContext<CoachAuthContextValue | undefined>(undefined);

export function CoachAuthProvider({ children }: { children: ReactNode }) {
  const [coach, setCoachState] = useState<CoachProfile | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);

  // La revalidation compare avec la session COURANTE, pas celle capturée par
  // une closure : la ref est mise à jour en même temps que l'état.
  const coachRef = useRef<CoachProfile | null>(null);
  const setCoach = useCallback((next: CoachProfile | null) => {
    coachRef.current = next;
    setCoachState(next);
  }, []);

  const refreshCoach = useCallback(async () => {
    try {
      const profile = await getCoachMe();
      setCoach(profile);
      setAccessDenied(false);
    } catch (error) {
      if (error instanceof CoachAccessForbiddenError) {
        setCoach(null);
        setAccessDenied(true);
        return;
      }
      // Erreur réseau/serveur inattendue au chargement : on retombe sur
      // l'écran de connexion plutôt que de laisser l'app dans un état
      // indéterminé (même choix que EkvaraFrontend).
      console.error('Erreur lors de la récupération du profil coach', error);
      setCoach(null);
      setAccessDenied(false);
    }
  }, [setCoach]);

  // Vérifie auprès du backend que la session est toujours celle attendue.
  // Ne déconnecte que sur une preuve : 401 (plus de session) ou 403 sur
  // /coach/me (le cookie coach est maintenant un compte SANS profil coach) ;
  // une erreur réseau/serveur laisse l'état intact.
  const revalidate = useRef(
    createSessionRevalidator(async () => {
      const current = coachRef.current;
      if (!current) return;

      let fresh: CoachProfile | null;
      try {
        fresh = await getCoachMe();
      } catch (error) {
        if (error instanceof CoachAccessForbiddenError && coachRef.current?.id === current.id) {
          // On avait un profil coach, le backend n'en voit plus : la session a
          // été remplacée (autre compte connecté dans un autre onglet coach).
          // Retour au login avec explication, pas l'écran "accès refusé" d'un
          // premier login.
          setCoach(null);
          setSessionNotice(SESSION_CHANGED_NOTICE);
        }
        return;
      }

      // Un logout/login a eu lieu pendant la vérification : elle est périmée.
      if (coachRef.current?.id !== current.id) return;

      if (fresh === null) {
        setCoach(null);
        setSessionNotice(SESSION_EXPIRED_NOTICE);
      } else if (fresh.id !== current.id) {
        // Un autre coach a remplacé cette session : on adopte la nouvelle
        // identité. L'app remonte ses pages (clé = id) pour ne garder aucune
        // donnée de l'ancien coach.
        setCoach(fresh);
      }
    }),
  ).current;

  // Bootstrap déterministe : loading -> /coach/me -> authentifié, accès refusé
  // OU anonyme, et seulement ensuite les routes protégées.
  useEffect(() => {
    let cancelled = false;

    refreshCoach().finally(() => {
      if (!cancelled) {
        revalidate.markChecked();
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [refreshCoach, revalidate]);

  // 401 sur une requête métier : la session n'existe plus. 403 : demande de
  // revalidation (jamais une déconnexion directe).
  useEffect(() => {
    setUnauthorizedListener(() => {
      if (coachRef.current === null) return;
      setCoach(null);
      setAccessDenied(false);
      setSessionNotice(SESSION_EXPIRED_NOTICE);
    });
    setRevalidateListener((minIntervalMs) => {
      void revalidate(minIntervalMs);
    });
    return () => {
      setUnauthorizedListener(null);
      setRevalidateListener(null);
    };
  }, [revalidate, setCoach]);

  // Retour d'un onglet resté inactif : revalidation throttlée (focus et
  // visibilitychange se déclenchent ensemble, la déduplication/le throttle
  // n'en font qu'une requête).
  const hasSession = coach !== null;
  useEffect(() => {
    if (!hasSession) return;

    function onReturn() {
      if (document.visibilityState === 'hidden') return;
      void revalidate(FOCUS_REVALIDATE_MIN_INTERVAL_MS);
    }
    window.addEventListener('focus', onReturn);
    document.addEventListener('visibilitychange', onReturn);
    return () => {
      window.removeEventListener('focus', onReturn);
      document.removeEventListener('visibilitychange', onReturn);
    };
  }, [hasSession, revalidate]);

  const login = useCallback(
    async (payload: LoginPayload) => {
      // Voir auth.api.ts : login() ne renvoie rien d'exploitable (ticket
      // §7). L'identité coach est déterminée uniquement par refreshCoach().
      await apiLogin(payload);
      setSessionNotice(null);
      await refreshCoach();
    },
    [refreshCoach],
  );

  const logout = useCallback(async () => {
    await apiLogout();
    // Déconnexion volontaire : on quitte la page AVANT d'effacer la session,
    // sinon la garde de routes la mémoriserait comme "destination à retrouver"
    // pour la prochaine connexion (possiblement un autre compte).
    navigateTo('/login', 'replace');
    setSessionNotice(null);
    setCoach(null);
    setAccessDenied(false);
  }, [setCoach]);

  const value = useMemo<CoachAuthContextValue>(
    () => ({ coach, loading, accessDenied, sessionNotice, login, logout, refreshCoach }),
    [coach, loading, accessDenied, sessionNotice, login, logout, refreshCoach],
  );

  return <CoachAuthContext.Provider value={value}>{children}</CoachAuthContext.Provider>;
}

export function useCoachAuth(): CoachAuthContextValue {
  const context = useContext(CoachAuthContext);
  if (!context) {
    throw new Error('useCoachAuth doit être utilisé à l\'intérieur de <CoachAuthProvider>');
  }
  return context;
}
