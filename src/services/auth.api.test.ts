import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CoachAccessForbiddenError, getCoachMe, login, logout } from './auth.api';
import { setRevalidateListener, setUnauthorizedListener } from './session';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
  setUnauthorizedListener(null);
  setRevalidateListener(null);
});

const PROFILE = { id: 'c1', user: { id: 'u1', prenom: 'Sophie', nom: 'Martin', email: 's@ekvara.fr' }, club: null };

describe('auth.api (coach)', () => {
  it('login / logout / me envoient credentials: include et X-Ekvara-App: coach', async () => {
    fetchMock.mockImplementation(async () => new Response(JSON.stringify(PROFILE), { status: 200 }));

    await login({ email: 's@ekvara.fr', password: 'x' });
    await logout();
    await getCoachMe();

    expect(fetchMock).toHaveBeenCalledTimes(3);
    for (const [, init] of fetchMock.mock.calls) {
      expect((init as RequestInit).credentials).toBe('include');
      expect(new Headers((init as RequestInit).headers).get('X-Ekvara-App')).toBe('coach');
    }
  });

  it('le corps JSON du login n\'écrase pas l\'en-tête de contexte', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 200 }));

    await login({ email: 's@ekvara.fr', password: 'x' });

    const headers = new Headers(fetchMock.mock.calls[0][1].headers);
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(headers.get('X-Ekvara-App')).toBe('coach');
  });

  it('login refusé -> message backend', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ message: 'Email ou mot de passe incorrect' }), { status: 401 }));

    await expect(login({ email: 's@ekvara.fr', password: 'x' })).rejects.toThrow('Email ou mot de passe incorrect');
  });

  it('getCoachMe : 200 -> profil', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify(PROFILE), { status: 200 }));

    await expect(getCoachMe()).resolves.toEqual(PROFILE);
  });

  it('getCoachMe : 401 -> null, SANS signal global (un 401 de /coach/me est un état de démarrage normal)', async () => {
    const unauthorized = vi.fn();
    setUnauthorizedListener(unauthorized);
    fetchMock.mockResolvedValue(new Response('{}', { status: 401 }));

    await expect(getCoachMe()).resolves.toBeNull();
    expect(unauthorized).not.toHaveBeenCalled();
  });

  it('getCoachMe : 403 -> CoachAccessForbiddenError (session valide, sans profil coach), SANS déclencher de revalidation', async () => {
    const revalidate = vi.fn();
    setRevalidateListener(revalidate);
    fetchMock.mockResolvedValue(new Response('{}', { status: 403 }));

    await expect(getCoachMe()).rejects.toBeInstanceOf(CoachAccessForbiddenError);
    expect(revalidate).not.toHaveBeenCalled();
  });

  it('getCoachMe : 500 -> erreur générique', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 500 }));

    await expect(getCoachMe()).rejects.toThrow();
  });
});
