import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CompetitionsPage from './CompetitionsPage';
import type { CoachCompetitionsListView, CompetitionCatalogItem } from '../types/coach';

const api = vi.hoisted(() => ({
  getCoachCompetitions: vi.fn(),
  getCompetitionCatalogPaginated: vi.fn(),
  getCompetitionYears: vi.fn(),
}));

vi.mock('../services/coach.api', async (importOriginal) => {
  const original = await importOriginal<typeof import('../services/coach.api')>();
  return { ...original, ...api };
});

function catalogItem(id: string, nom: string, dateDebut: string): CompetitionCatalogItem {
  return {
    id,
    nom,
    organisateur: null,
    source: null,
    source_external_id: null,
    date_debut: dateDebut,
    date_fin: null,
    lieu: null,
    ville: 'Lyon',
    pays: 'France',
    niveau: 'régional',
    saison: null,
  };
}

const TEAM: CoachCompetitionsListView = {
  upcoming: [
    {
      competition: {
        id: 'team-1',
        name: 'Coupe de France',
        startDate: '2026-11-20T00:00:00.000Z',
        endDate: null,
        city: 'Orléans',
        country: 'France',
        level: 'national',
      },
      athleteCount: 2,
      athletes: [],
    },
  ],
  past: [],
};

function paginated(items: CompetitionCatalogItem[], total = items.length, page = 1) {
  return { items, total, page, limit: 20 };
}

describe('CompetitionsPage — explorateur coach (ticket #24)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-12T10:00:00Z'));
    window.history.replaceState({}, '', '/competitions');
    api.getCoachCompetitions.mockResolvedValue(TEAM);
    api.getCompetitionYears.mockResolvedValue([2027, 2026, 2025]);
    api.getCompetitionCatalogPaginated.mockImplementation(({ scope }: { scope: string }) =>
      Promise.resolve(
        scope === 'upcoming'
          ? paginated([catalogItem('cat-up', 'Open de Lyon', '2026-12-05')])
          : paginated([catalogItem('cat-past', 'Open de Nice', '2026-02-10')]),
      ),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('vue équipe conservée + catalogue complet À venir / Passées, chaque ligne mène à la fiche', async () => {
    render(<CompetitionsPage />);

    const team = await screen.findByRole('region', { name: 'Mon équipe · À venir' });
    expect(within(team).getByText('Coupe de France')).toBeInTheDocument();

    const upcoming = screen.getByRole('region', { name: 'Calendrier · À venir' });
    const past = screen.getByRole('region', { name: 'Calendrier · Passées' });
    expect(await within(upcoming).findByRole('link', { name: /Open de Lyon/ })).toHaveAttribute('href', '/competitions/cat-up');
    expect(await within(past).findByRole('link', { name: /Open de Nice/ })).toHaveAttribute('href', '/competitions/cat-past');
    expect(within(upcoming).getByText('05 DÉC')).toBeInTheDocument();
    expect(within(upcoming).getByText('Régional')).toBeInTheDocument();

    expect(api.getCompetitionCatalogPaginated).toHaveBeenCalledWith({ page: 1, limit: 20, scope: 'upcoming', search: undefined, year: undefined });
    expect(api.getCompetitionCatalogPaginated).toHaveBeenCalledWith({ page: 1, limit: 20, scope: 'past', search: undefined, year: undefined });
    expect(screen.getByRole('button', { name: '+ Préparer une compétition' })).toBeInTheDocument();
  });

  it('filtre période : URL mise à jour, section masquée et vue équipe retirée (jamais une liste non filtrée à côté)', async () => {
    render(<CompetitionsPage />);
    await screen.findByRole('region', { name: 'Mon équipe · À venir' });

    await userEvent.click(within(screen.getByRole('group', { name: 'Période' })).getByRole('button', { name: 'Passées' }));

    expect(window.location.search).toBe('?status=past');
    expect(screen.queryByRole('region', { name: 'Calendrier · À venir' })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Calendrier · Passées' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Mon équipe · À venir' })).not.toBeInTheDocument();
  });

  it('année lue depuis l’URL : transmise au backend, sélecteur positionné', async () => {
    window.history.replaceState({}, '', '/competitions?year=2025');
    render(<CompetitionsPage />);

    await waitFor(() =>
      expect(api.getCompetitionCatalogPaginated).toHaveBeenCalledWith({ page: 1, limit: 20, scope: 'upcoming', search: undefined, year: 2025 }),
    );
    expect(await screen.findByRole('option', { name: '2025' })).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveValue('2025');
  });

  it('recherche backend (debounce) + état vide qui reflète la recherche', async () => {
    render(<CompetitionsPage />);
    await screen.findByRole('region', { name: 'Mon équipe · À venir' });

    api.getCompetitionCatalogPaginated.mockResolvedValue(paginated([]));
    fireEvent.change(screen.getByLabelText('Rechercher une compétition par nom, ville ou pays'), { target: { value: 'zzz' } });

    await waitFor(() =>
      expect(api.getCompetitionCatalogPaginated).toHaveBeenCalledWith({ page: 1, limit: 20, scope: 'upcoming', search: 'zzz', year: undefined }),
    );
    expect(await screen.findByText('Aucune compétition à venir pour « zzz ».')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Mon équipe · À venir' })).not.toBeInTheDocument();
  });

  it('catalogue indisponible : message propre, la vue équipe reste affichée', async () => {
    api.getCompetitionCatalogPaginated.mockRejectedValue(new Error('Une erreur est survenue (500)'));
    render(<CompetitionsPage />);

    expect(await screen.findByRole('region', { name: 'Mon équipe · À venir' })).toBeInTheDocument();
    expect(await screen.findAllByText('Impossible de charger le catalogue.')).toHaveLength(2);
    expect(screen.queryByText('Une erreur est survenue (500)')).not.toBeInTheDocument();
  });

  it('"Voir plus" charge la page suivante du catalogue', async () => {
    api.getCompetitionCatalogPaginated.mockImplementation(({ scope, page }: { scope: string; page: number }) => {
      if (scope === 'past') return Promise.resolve(paginated([]));
      return Promise.resolve(
        page === 1
          ? paginated([catalogItem('p1', 'Open A', '2026-12-01')], 2, 1)
          : paginated([catalogItem('p2', 'Open B', '2026-12-08')], 2, 2),
      );
    });
    render(<CompetitionsPage />);

    const upcoming = await screen.findByRole('region', { name: 'Calendrier · À venir' });
    await within(upcoming).findByRole('link', { name: /Open A/ });
    await act(async () => {
      fireEvent.click(within(upcoming).getByRole('button', { name: 'Voir plus (1 restantes)' }));
    });

    expect(await within(upcoming).findByRole('link', { name: /Open B/ })).toBeInTheDocument();
    expect(within(upcoming).queryByRole('button', { name: /Voir plus/ })).not.toBeInTheDocument();
  });
});
