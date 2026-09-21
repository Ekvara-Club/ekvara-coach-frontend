import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { consumeReturnTo, notifyUnauthorized, requestSessionRevalidation } from './services/session';
import type { CoachProfile } from './types/auth';

const api = vi.hoisted(() => {
  class CoachAccessForbiddenError extends Error {}
  return { getCoachMe: vi.fn(), login: vi.fn(), logout: vi.fn(), CoachAccessForbiddenError };
});
const mounts = vi.hoisted(() => ({ dashboard: 0 }));

vi.mock('./services/auth.api', () => api);

vi.mock('./components/layout/Header', async () => {
  const { useCoachAuth } = await import('./contexts/CoachAuthContext');
  return {
    default: function Header() {
      const { coach, logout } = useCoachAuth();
      return (
        <header>
          <p data-testid="hello">Bonjour {coach?.user.prenom}</p>
          <button onClick={() => logout()}>logout</button>
        </header>
      );
    },
  };
});
vi.mock('./pages/DashboardPage', async () => {
  const { useEffect } = await import('react');
  return {
    default: function DashboardPage() {
      useEffect(() => {
        mounts.dashboard += 1;
      }, []);
      return <p data-testid="page">dashboard</p>;
    },
  };
});
vi.mock('./pages/AthletesPage', () => ({ default: () => <p data-testid="page">Athletes</p> }));
vi.mock('./pages/AthleteDetailPage', () => ({ default: () => <p data-testid="page">AthleteDetail</p> }));
vi.mock('./pages/GroupsPage', () => ({ default: () => <p data-testid="page">Groups</p> }));
vi.mock('./pages/GroupDetailPage', () => ({ default: () => <p data-testid="page">GroupDetail</p> }));
vi.mock('./pages/PlanningPage', () => ({ default: () => <p data-testid="page">Planning</p> }));
vi.mock('./pages/ExercisesPage', () => ({ default: () => <p data-testid="page">Exercises</p> }));
vi.mock('./pages/CompetitionsPage', () => ({ default: () => <p data-testid="page">Competitions</p> }));
vi.mock('./pages/CompetitionDetailPage', () => ({ default: () => <p data-testid="page">CompetitionDetail</p> }));
vi.mock('./pages/NoCoachAccessPage', () => ({ default: () => <p data-testid="page">no-coach-access</p> }));
vi.mock('./pages/LoginPage', async () => {
  const { useCoachAuth } = await import('./contexts/CoachAuthContext');
  return {
    default: function LoginPage() {
      const { sessionNotice, login } = useCoachAuth();
      return (
        <div>
          <p data-testid="page">login</p>
          <p data-testid="notice">{sessionNotice ?? ''}</p>
          <button onClick={() => login({ email: 's@ekvara.fr', password: 'x' })}>submit</button>
        </div>
      );
    },
  };
});

function coach(id: string, prenom = 'Sophie'): CoachProfile {
  return { id, user: { id: `u-${id}`, prenom, nom: 'Martin', email: `${id}@ekvara.fr` }, club: null };
}

const page = () => screen.getByTestId('page').textContent;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 21, 10, 0, 0));
  api.logout.mockResolvedValue(undefined);
  mounts.dashboard = 0;
  window.history.replaceState({}, '', '/');
});

afterEach(() => {
  vi.useRealTimers();
  vi.resetAllMocks();
  consumeReturnTo();
});

describe('Coach App — garde de routes et session', () => {
  it('pendant le chargement : ni dashboard ni login (pas de flash Dashboard -> Login)', async () => {
    let resolveMe!: (v: CoachProfile | null) => void;
    api.getCoachMe.mockReturnValue(new Promise((resolve) => (resolveMe = resolve)));

    render(<App />);

    expect(screen.getByText('Chargement...')).toBeInTheDocument();
    expect(screen.queryByTestId('page')).not.toBeInTheDocument();

    await act(async () => resolveMe(coach('c1')));
    expect(page()).toBe('dashboard');
  });

  it('session absente : redirigé vers /login ; après connexion, retour à la page demandée', async () => {
    api.getCoachMe.mockResolvedValueOnce(null).mockResolvedValueOnce(coach('c1'));
    api.login.mockResolvedValue(undefined);
    window.history.replaceState({}, '', '/planning');

    render(<App />);
    await waitFor(() => expect(page()).toBe('login'));
    expect(window.location.pathname).toBe('/login');

    fireEvent.click(screen.getByText('submit'));

    await waitFor(() => expect(page()).toBe('Planning'));
    expect(window.location.pathname).toBe('/planning');
  });

  it('session valide sans profil coach : écran dédié, pas de redirection /login', async () => {
    api.getCoachMe.mockRejectedValue(new api.CoachAccessForbiddenError());

    render(<App />);

    await waitFor(() => expect(page()).toBe('no-coach-access'));
    expect(window.location.pathname).toBe('/');
  });

  it('CAS DU BUG — UI affiche « Bonjour Sophie », l\'API répond 401 : retour au login avec explication, aucun dashboard bloqué', async () => {
    api.getCoachMe.mockResolvedValue(coach('c1'));
    render(<App />);
    await waitFor(() => expect(screen.getByTestId('hello').textContent).toBe('Bonjour Sophie'));

    act(() => notifyUnauthorized());

    await waitFor(() => expect(page()).toBe('login'));
    expect(screen.queryByTestId('hello')).not.toBeInTheDocument();
    expect(screen.getByTestId('notice').textContent).toMatch(/session a expiré/i);
    expect(window.location.pathname).toBe('/login');
  });

  it('CAS DU BUG — UI affiche « Bonjour Sophie », l\'API répond 403 « Accès réservé aux comptes coach » et /coach/me confirme : synchronisé sur le login', async () => {
    api.getCoachMe.mockResolvedValueOnce(coach('c1')).mockRejectedValueOnce(new api.CoachAccessForbiddenError());
    render(<App />);
    await waitFor(() => expect(screen.getByTestId('hello').textContent).toBe('Bonjour Sophie'));
    vi.setSystemTime(new Date(Date.now() + 60_000));

    await act(async () => requestSessionRevalidation());

    await waitFor(() => expect(page()).toBe('login'));
    expect(screen.queryByText(/Accès réservé/)).not.toBeInTheDocument();
    expect(screen.getByTestId('notice').textContent).toMatch(/session a changé/i);
  });

  it('vrai 403 avec session coach inchangée : reste sur sa page', async () => {
    api.getCoachMe.mockResolvedValue(coach('c1'));
    render(<App />);
    await waitFor(() => expect(page()).toBe('dashboard'));
    vi.setSystemTime(new Date(Date.now() + 60_000));

    await act(async () => requestSessionRevalidation());

    expect(page()).toBe('dashboard');
    expect(screen.getByTestId('hello').textContent).toBe('Bonjour Sophie');
  });

  it('session remplacée par un autre coach : pages remontées, aucune donnée de l\'ancien', async () => {
    api.getCoachMe.mockResolvedValueOnce(coach('c1')).mockResolvedValueOnce(coach('c2', 'Autre'));
    render(<App />);
    await waitFor(() => expect(page()).toBe('dashboard'));
    expect(mounts.dashboard).toBe(1);
    vi.setSystemTime(new Date(Date.now() + 60_000));

    await act(async () => requestSessionRevalidation());

    await waitFor(() => expect(screen.getByTestId('hello').textContent).toBe('Bonjour Autre'));
    expect(mounts.dashboard).toBe(2);
  });

  it('déconnexion volontaire : la page quittée n\'est pas mémorisée pour la connexion suivante', async () => {
    api.getCoachMe.mockResolvedValueOnce(coach('c1')).mockResolvedValueOnce(coach('c2'));
    api.login.mockResolvedValue(undefined);
    window.history.replaceState({}, '', '/planning');
    render(<App />);
    await waitFor(() => expect(page()).toBe('Planning'));

    fireEvent.click(screen.getByText('logout'));
    await waitFor(() => expect(page()).toBe('login'));
    expect(screen.getByTestId('notice').textContent).toBe('');
    fireEvent.click(screen.getByText('submit'));

    await waitFor(() => expect(page()).toBe('dashboard'));
    expect(window.location.pathname).toBe('/');
  });

  it('jamais de rechargement de fenêtre sur perte de session', async () => {
    const reload = vi.fn();
    const original = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: new Proxy(original, {
        get(target, prop) {
          if (prop === 'reload') return reload;
          const value = Reflect.get(target, prop, target);
          return typeof value === 'function' ? value.bind(target) : value;
        },
      }),
    });
    api.getCoachMe.mockResolvedValue(coach('c1'));
    render(<App />);
    await waitFor(() => expect(page()).toBe('dashboard'));

    act(() => notifyUnauthorized());
    await waitFor(() => expect(page()).toBe('login'));

    expect(reload).not.toHaveBeenCalled();
    Object.defineProperty(window, 'location', { configurable: true, value: original });
  });
});
