import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, getCoachDashboard } from './coach.api';
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

describe('coach.api — appels métier', () => {
  it('envoie le contexte coach et le cookie de session', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 200 }));

    await getCoachDashboard();

    const init = fetchMock.mock.calls[0][1];
    expect(init.credentials).toBe('include');
    expect(new Headers(init.headers).get('X-Ekvara-App')).toBe('coach');
  });

  it('401 -> signale la session invalide ET lève une ApiError 401', async () => {
    const unauthorized = vi.fn();
    setUnauthorizedListener(unauthorized);
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ message: 'Authentification requise' }), { status: 401 }));

    await expect(getCoachDashboard()).rejects.toMatchObject({ status: 401 });
    expect(unauthorized).toHaveBeenCalledTimes(1);
  });

  it('403 -> demande une revalidation, ne déconnecte pas, et reste une ApiError 403 (jamais un succès)', async () => {
    const unauthorized = vi.fn();
    const revalidate = vi.fn();
    setUnauthorizedListener(unauthorized);
    setRevalidateListener(revalidate);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: 'Accès réservé aux comptes coach' }), { status: 403 }),
    );

    const error = await getCoachDashboard().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(403);
    expect(revalidate).toHaveBeenCalledTimes(1);
    expect(unauthorized).not.toHaveBeenCalled();
  });

  it('aucun retry', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 403 }));

    await getCoachDashboard().catch(() => undefined);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
