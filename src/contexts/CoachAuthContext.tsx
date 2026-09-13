import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  CoachAccessForbiddenError,
  getCoachMe,
  login as apiLogin,
  logout as apiLogout,
} from '../services/auth.api';
import { setUnauthorizedListener } from '../services/session';
import type { CoachProfile, LoginPayload } from '../types/auth';

interface CoachAuthContextValue {
  coach: CoachProfile | null;
  loading: boolean;
  // true = session authentifiée mais sans profil coach (403 sur
  // GET /coach/me) — distinct de "pas de session du tout" (ticket §6).
  accessDenied: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshCoach: () => Promise<void>;
}

const CoachAuthContext = createContext<CoachAuthContextValue | undefined>(undefined);

export function CoachAuthProvider({ children }: { children: ReactNode }) {
  const [coach, setCoach] = useState<CoachProfile | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [loading, setLoading] = useState(true);

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
  }, []);

  useEffect(() => {
    let cancelled = false;

    refreshCoach().finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setUnauthorizedListener(() => {
      setCoach(null);
      setAccessDenied(false);
    });
    return () => setUnauthorizedListener(null);
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      // Voir auth.api.ts : login() ne renvoie rien d'exploitable (ticket
      // §7). L'identité coach est déterminée uniquement par refreshCoach().
      await apiLogin(payload);
      await refreshCoach();
    },
    [refreshCoach],
  );

  const logout = useCallback(async () => {
    await apiLogout();
    setCoach(null);
    setAccessDenied(false);
  }, []);

  return (
    <CoachAuthContext.Provider value={{ coach, loading, accessDenied, login, logout, refreshCoach }}>
      {children}
    </CoachAuthContext.Provider>
  );
}

export function useCoachAuth(): CoachAuthContextValue {
  const context = useContext(CoachAuthContext);
  if (!context) {
    throw new Error('useCoachAuth doit être utilisé à l\'intérieur de <CoachAuthProvider>');
  }
  return context;
}
