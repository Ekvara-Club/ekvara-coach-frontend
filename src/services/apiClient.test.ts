import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from './apiClient';
import { setRevalidateListener, setUnauthorizedListener } from './session';

const fetchMock = vi.fn();

function respond(status: number) {
  fetchMock.mockResolvedValue(new Response('{}', { status }));
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
  setUnauthorizedListener(null);
  setRevalidateListener(null);
});

describe('apiFetch (coach)', () => {
  it('envoie le cookie de session (credentials: include) et sélectionne le contexte COACH', async () => {
    respond(200);

    await apiFetch('/coach/dashboard');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/coach\/dashboard$/);
    expect(init.credentials).toBe('include');
    expect(new Headers(init.headers).get('X-Ekvara-App')).toBe('coach');
  });

  it('conserve les en-têtes de l\'appelant en ajoutant X-Ekvara-App', async () => {
    respond(200);

    await apiFetch('/x', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: '{}' });

    const headers = new Headers(fetchMock.mock.calls[0][1].headers);
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(headers.get('X-Ekvara-App')).toBe('coach');
  });

  it('401 -> signale la session invalide, renvoie la réponse telle quelle', async () => {
    const unauthorized = vi.fn();
    setUnauthorizedListener(unauthorized);
    respond(401);

    const response = await apiFetch('/x');

    expect(unauthorized).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(401);
  });

  it('403 -> demande une revalidation, ne déconnecte pas, reste un 403', async () => {
    const unauthorized = vi.fn();
    const revalidate = vi.fn();
    setUnauthorizedListener(unauthorized);
    setRevalidateListener(revalidate);
    respond(403);

    const response = await apiFetch('/x');

    expect(revalidate).toHaveBeenCalledTimes(1);
    expect(unauthorized).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });

  it('aucun retry : une seule requête par appel', async () => {
    respond(401);

    await apiFetch('/x');

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
