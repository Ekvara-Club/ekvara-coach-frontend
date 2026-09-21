import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CoachAuthProvider, useCoachAuth } from './CoachAuthContext';
import { notifyUnauthorized, requestSessionRevalidation, consumeReturnTo } from '../services/session';
import type { CoachProfile } from '../types/auth';

const api = vi.hoisted(() => {
  class CoachAccessForbiddenError extends Error {}
  return { getCoachMe: vi.fn(), login: vi.fn(), logout: vi.fn(), CoachAccessForbiddenError };
});

vi.mock('../services/auth.api', () => api);

function coach(id: string, prenom = 'Sophie'): CoachProfile {
  return { id, user: { id: `u-${id}`, prenom, nom: 'Martin', email: `${id}@ekvara.fr` }, club: null };
}

function Probe() {
  const { coach: current, loading, accessDenied, sessionNotice, login, logout } = useCoachAuth();
  return (
    <div>
      <p data-testid="loading">{String(loading)}</p>
      <p data-testid="coach">{current ? `${current.id}:${current.user.prenom}` : 'anonymous'}</p>
      <p data-testid="denied">{String(accessDenied)}</p>
      <p data-testid="notice">{sessionNotice ?? ''}</p>
      <button onClick={() => login({ email: 's@ekvara.fr', password: 'x' }).catch(() => {})}>login</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
}

const state = () => screen.getByTestId('coach').textContent;
const denied = () => screen.getByTestId('denied').textContent;
const notice = () => screen.getByTestId('notice').textContent;

async function renderReady() {
  render(
    <CoachAuthProvider>
      <Probe />
    </CoachAuthProvider>,
  );
  await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
}

function advance(ms: number) {
  vi.setSystemTime(new Date(Date.now() + ms));
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 21, 10, 0, 0));
  api.logout.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
  vi.resetAllMocks();
  consumeReturnTo();
});

describe('CoachAuthContext — bootstrap déterministe', () => {
  it('loading -> /coach/me -> authentifié (rien n\'est supposé avant la réponse)', async () => {
    api.getCoachMe.mockResolvedValue(coach('c1'));

    render(
      <CoachAuthProvider>
        <Probe />
      </CoachAuthProvider>,
    );
    expect(screen.getByTestId('loading').textContent).toBe('true');
    expect(state()).toBe('anonymous');

    await waitFor(() => expect(state()).toBe('c1:Sophie'));
    expect(api.getCoachMe).toHaveBeenCalledTimes(1);
  });

  it('session absente ou expirée (null) : anonyme, sans notice', async () => {
    api.getCoachMe.mockResolvedValue(null);

    await renderReady();

    expect(state()).toBe('anonymous');
    expect(denied()).toBe('false');
    expect(notice()).toBe('');
  });

  it('session valide SANS profil coach au démarrage : écran "accès refusé" (comportement existant conservé)', async () => {
    api.getCoachMe.mockRejectedValue(new api.CoachAccessForbiddenError());

    await renderReady();

    expect(state()).toBe('anonymous');
    expect(denied()).toBe('true');
  });

  it('erreur réseau au démarrage : retombe sur anonyme', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    api.getCoachMe.mockRejectedValue(new Error('réseau'));

    await renderReady();

    expect(state()).toBe('anonymous');
    expect(denied()).toBe('false');
    consoleError.mockRestore();
  });
});

describe('CoachAuthContext — 401 pendant un appel métier', () => {
  it('UI affiche Sophie + API 401 : l\'état Sophie est supprimé, l\'utilisateur est renvoyé au login avec explication', async () => {
    api.getCoachMe.mockResolvedValue(coach('c1'));
    await renderReady();
    expect(state()).toBe('c1:Sophie');

    act(() => notifyUnauthorized());

    expect(state()).toBe('anonymous');
    expect(denied()).toBe('false');
    expect(notice()).toMatch(/session a expiré/i);
  });

  it('un 401 sans session ne fabrique pas de notice', async () => {
    api.getCoachMe.mockResolvedValue(null);
    await renderReady();

    act(() => notifyUnauthorized());

    expect(notice()).toBe('');
  });
});

describe('CoachAuthContext — 403 : revalidation, jamais de faux logout', () => {
  it('vrai 403 (ex. athlète hors roster) avec session coach inchangée : l\'utilisateur reste connecté', async () => {
    api.getCoachMe.mockResolvedValue(coach('c1'));
    await renderReady();
    advance(60_000);

    await act(async () => requestSessionRevalidation());

    expect(api.getCoachMe).toHaveBeenCalledTimes(2);
    expect(state()).toBe('c1:Sophie');
    expect(notice()).toBe('');
    expect(denied()).toBe('false');
  });

  it('CAS DU BUG : UI affiche Sophie, le backend ne voit plus de profil coach (403 « Accès réservé aux comptes coach ») -> resynchronisé sur le login, pas de dashboard bloqué', async () => {
    api.getCoachMe.mockResolvedValueOnce(coach('c1')).mockRejectedValueOnce(new api.CoachAccessForbiddenError());
    await renderReady();
    advance(60_000);

    await act(async () => requestSessionRevalidation());

    expect(state()).toBe('anonymous');
    expect(denied()).toBe('false'); // pas l'écran "accès refusé" : on retourne au login
    expect(notice()).toMatch(/session a changé/i);
  });

  it('403 puis /coach/me = 401 -> retour login, session expirée', async () => {
    api.getCoachMe.mockResolvedValueOnce(coach('c1')).mockResolvedValueOnce(null);
    await renderReady();
    advance(60_000);

    await act(async () => requestSessionRevalidation());

    expect(state()).toBe('anonymous');
    expect(notice()).toMatch(/session a expiré/i);
  });

  it('403 puis /coach/me = un AUTRE coach (autre onglet coach) -> nouvelle identité adoptée', async () => {
    api.getCoachMe.mockResolvedValueOnce(coach('c1')).mockResolvedValueOnce(coach('c2', 'Autre'));
    await renderReady();
    advance(60_000);

    await act(async () => requestSessionRevalidation());

    expect(state()).toBe('c2:Autre');
  });

  it('erreur réseau pendant la revalidation : aucune déconnexion', async () => {
    api.getCoachMe.mockResolvedValueOnce(coach('c1')).mockRejectedValueOnce(new Error('réseau'));
    await renderReady();
    advance(60_000);

    await act(async () => requestSessionRevalidation());

    expect(state()).toBe('c1:Sophie');
  });

  it('rafale de 403 : dédupliquée en une seule requête', async () => {
    api.getCoachMe.mockResolvedValue(coach('c1'));
    await renderReady();
    advance(60_000);

    await act(async () => {
      requestSessionRevalidation();
      requestSessionRevalidation();
      requestSessionRevalidation();
    });

    expect(api.getCoachMe).toHaveBeenCalledTimes(2);
  });
});

describe('CoachAuthContext — focus / visibilité', () => {
  it('retour de focus après plusieurs minutes : détecte une session expirée', async () => {
    api.getCoachMe.mockResolvedValueOnce(coach('c1')).mockResolvedValueOnce(null);
    await renderReady();
    advance(5 * 60_000);

    await act(async () => {
      window.dispatchEvent(new Event('focus'));
    });

    await waitFor(() => expect(state()).toBe('anonymous'), { timeout: 3000 });
    expect(notice()).toMatch(/session a expiré/i);
  });

  it('retour de visibilité : détecte un changement de profil', async () => {
    api.getCoachMe.mockResolvedValueOnce(coach('c1')).mockResolvedValueOnce(coach('c2', 'Autre'));
    await renderReady();
    advance(5 * 60_000);

    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await waitFor(() => expect(state()).toBe('c2:Autre'), { timeout: 3000 });
  });

  it('focus + visibilitychange simultanés : une seule vérification', async () => {
    api.getCoachMe.mockResolvedValue(coach('c1'));
    await renderReady();
    advance(5 * 60_000);

    await act(async () => {
      window.dispatchEvent(new Event('focus'));
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(api.getCoachMe).toHaveBeenCalledTimes(2);
  });

  it('focus répétés dans les 30 s : throttlés ; juste après le bootstrap : pas de requête', async () => {
    api.getCoachMe.mockResolvedValue(coach('c1'));
    await renderReady();
    advance(2_000);
    await act(async () => window.dispatchEvent(new Event('focus')));
    expect(api.getCoachMe).toHaveBeenCalledTimes(1);

    advance(31_000);
    await act(async () => window.dispatchEvent(new Event('focus')));
    advance(5_000);
    await act(async () => window.dispatchEvent(new Event('focus')));
    expect(api.getCoachMe).toHaveBeenCalledTimes(2);
  });

  it('anonyme : aucune revalidation au focus', async () => {
    api.getCoachMe.mockResolvedValue(null);
    await renderReady();
    advance(5 * 60_000);

    await act(async () => window.dispatchEvent(new Event('focus')));

    expect(api.getCoachMe).toHaveBeenCalledTimes(1);
  });
});

describe('CoachAuthContext — login / logout', () => {
  it('login : identité déterminée par /coach/me (jamais par le corps du login), notice effacée', async () => {
    api.getCoachMe.mockResolvedValueOnce(null).mockResolvedValueOnce(coach('c1'));
    api.login.mockResolvedValue(undefined);
    await renderReady();

    fireEvent.click(screen.getByText('login'));

    await waitFor(() => expect(state()).toBe('c1:Sophie'));
    expect(notice()).toBe('');
  });

  it('login d\'un compte sans profil coach : écran "accès refusé" (comportement existant)', async () => {
    api.getCoachMe.mockResolvedValueOnce(null).mockRejectedValueOnce(new api.CoachAccessForbiddenError());
    api.login.mockResolvedValue(undefined);
    await renderReady();

    fireEvent.click(screen.getByText('login'));

    await waitFor(() => expect(denied()).toBe('true'));
  });

  it('logout : session coach effacée', async () => {
    api.getCoachMe.mockResolvedValue(coach('c1'));
    await renderReady();

    fireEvent.click(screen.getByText('logout'));

    await waitFor(() => expect(state()).toBe('anonymous'));
    expect(api.logout).toHaveBeenCalledTimes(1);
  });
});
