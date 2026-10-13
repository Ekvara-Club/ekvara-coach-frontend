import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CompetitionDetailPage from './CompetitionDetailPage';
import { ApiError } from '../services/coach.api';
import type { CoachCompetitionDetailView } from '../types/coach';
import type { CompetitionDetail } from '../types/competition';
import type { CompetitionEntriesResponse } from '../types/competition-entries';

const api = vi.hoisted(() => ({
  getCompetitionById: vi.fn(),
  getCoachCompetitionDetail: vi.fn(),
  getCompetitionEntries: vi.fn(),
  getCoachDashboardAthletes: vi.fn(),
}));

vi.mock('../services/coach.api', async (importOriginal) => {
  const original = await importOriginal<typeof import('../services/coach.api')>();
  return { ...original, ...api };
});

// Section autonome déjà couverte par CompetitionResultsSection.test.tsx : ici
// seule sa présence/absence compte.
vi.mock('../components/competitions/CompetitionResultsSection', () => ({
  default: ({ competitionId }: { competitionId: string }) => <p data-testid="wt-results">wt-results:{competitionId}</p>,
}));

const COMPETITION_ID = '11111111-1111-4111-8111-111111111111';

function publicDetail(overrides: Partial<CompetitionDetail> = {}): CompetitionDetail {
  return {
    id: COMPETITION_ID,
    nom: 'Open de Paris',
    organisateur: 'FFTDA',
    source: 'martial_events',
    sourceExternalId: null,
    dateDebut: '2026-11-14',
    dateFin: '2026-11-15',
    lieu: 'Stade Pierre de Coubertin',
    ville: 'Paris',
    pays: 'France',
    niveau: 'national',
    saison: '2026-2027',
    sources: [{ source: 'martial_events', sourceUrl: 'https://example.test/open-de-paris' }],
    availability: { entryCount: 2, matchCount: 0 },
    ...overrides,
  };
}

function coachDetail(overrides: Partial<CoachCompetitionDetailView> = {}): CoachCompetitionDetailView {
  return {
    competition: {
      id: COMPETITION_ID,
      name: 'Open de Paris (vue coach)',
      startDate: '2026-11-14T00:00:00.000Z',
      endDate: '2026-11-15T00:00:00.000Z',
      city: 'Paris',
      country: 'France',
      level: 'national',
    },
    athleteCount: 1,
    athletes: [
      {
        id: 'ath-1',
        firstName: 'Lina',
        lastName: 'Exemple',
        ageCategory: 'Senior',
        weightCategory: '-57kg',
        participationStatus: null,
        result: { classement: null, medaille: null, victoires: null, defaites: null },
        groups: [{ id: 'g1', name: 'Compétiteurs' }],
        hasOfficialParticipation: false,
        preparation: {
          id: 'prep-1',
          status: 'selectionne',
          targetAgeCategory: 'Senior',
          targetWeightCategory: '-57kg',
          objective: 'Viser le podium',
          coachNote: 'NOTE PRIVÉE DU COACH',
        },
      },
    ],
    ...overrides,
  };
}

const ENTRIES: CompetitionEntriesResponse = {
  competitionId: COMPETITION_ID,
  totalEntries: 2,
  categories: [
    {
      rawLabel: 'Senior F -57kg',
      ageCategory: 'Senior',
      gender: 'female',
      weightCategory: '-57kg',
      entries: [
        { id: 'e1', name: 'Alice Externe', club: 'Club A', league: null, country: 'FRA' },
        { id: 'e2', name: 'Bea Externe', club: null, league: null, country: null },
      ],
    },
  ],
};

describe('CompetitionDetailPage — fiche coach (ticket #24)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-12T10:00:00Z'));
    window.history.replaceState({}, '', `/competitions/${COMPETITION_ID}`);
    api.getCompetitionEntries.mockResolvedValue(ENTRIES);
    api.getCoachDashboardAthletes.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('compétition du catalogue sans lien avec l’équipe (403) : fiche publique complète + invitation à préparer, jamais une erreur', async () => {
    api.getCompetitionById.mockResolvedValue(publicDetail());
    api.getCoachCompetitionDetail.mockRejectedValue(new ApiError('Accès interdit à cette compétition', 403));

    render(<CompetitionDetailPage competitionId={COMPETITION_ID} />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Open de Paris' })).toBeInTheDocument();
    expect(screen.getByText('14–15 novembre 2026')).toBeInTheDocument();
    expect(screen.getByText('national · FFTDA')).toBeInTheDocument();
    expect(screen.getByText('Saison 2026-2027')).toBeInTheDocument();
    expect(screen.getByText('J-33')).toBeInTheDocument();

    expect(await screen.findByText("Aucun athlète de ton équipe n'est encore prévu sur cette compétition.")).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    // Inscrits publiés (Martial Events) : même section que l'app athlète.
    const entries = screen.getByRole('region', { name: 'Inscrits' });
    expect(await within(entries).findByText('2 inscrits · 1 catégorie')).toBeInTheDocument();
    // Pas de combats ⇒ pas de section résultats.
    expect(screen.queryByTestId('wt-results')).not.toBeInTheDocument();

    const sources = screen.getByRole('region', { name: 'Sources des données' });
    expect(within(sources).getByRole('link', { name: /Martial Events/ })).toHaveAttribute('href', 'https://example.test/open-de-paris');

    await userEvent.click(screen.getByRole('button', { name: 'Préparer cette compétition' }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('compétition passée avec résultats WT, sans lien équipe : résultats affichés, aucun bouton de préparation', async () => {
    api.getCompetitionById.mockResolvedValue(
      publicDetail({
        nom: 'Grand Prix Final',
        dateDebut: '2026-03-02',
        dateFin: '2026-03-04',
        source: 'world_taekwondo',
        sources: [{ source: 'world_taekwondo_results', sourceUrl: null }],
        availability: { entryCount: 0, matchCount: 120 },
      }),
    );
    api.getCoachCompetitionDetail.mockRejectedValue(new ApiError('Accès interdit à cette compétition', 403));

    render(<CompetitionDetailPage competitionId={COMPETITION_ID} />);

    expect(await screen.findByTestId('wt-results')).toHaveTextContent(`wt-results:${COMPETITION_ID}`);
    expect(screen.getByText("Aucun athlète de ton équipe n'a été lié à cette compétition.")).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Préparer/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Inscrits' })).not.toBeInTheDocument();
    expect(screen.queryByText(/^J-/)).not.toBeInTheDocument();
  });

  it('compétition liée à une préparation : fonctionnalités coach conservées, note privée jamais affichée dans la fiche', async () => {
    api.getCompetitionById.mockResolvedValue(publicDetail());
    api.getCoachCompetitionDetail.mockResolvedValue(coachDetail());

    render(<CompetitionDetailPage competitionId={COMPETITION_ID} />);

    expect(await screen.findByText('Lina Exemple')).toBeInTheDocument();
    expect(screen.getByText('Sélectionné')).toBeInTheDocument();
    expect(screen.getByText('Inscription officielle non confirmée')).toBeInTheDocument();
    expect(screen.getByText('Objectif : Viser le podium')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Ajouter un athlète' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Groupes' })).toHaveTextContent('Compétiteurs');
    const categories = screen.getByRole('region', { name: 'Catégories du groupe' });
    expect(await within(categories).findByText('2 inscrits')).toBeInTheDocument();
    // Hero : fiche publique prioritaire sur le nom de la vue coach.
    expect(screen.getByRole('heading', { level: 1, name: 'Open de Paris' })).toBeInTheDocument();
    expect(screen.queryByText('NOTE PRIVÉE DU COACH')).not.toBeInTheDocument();
  });

  it('fiche publique indisponible mais vue coach disponible : la page reste consultable', async () => {
    api.getCompetitionById.mockRejectedValue(new ApiError('Erreur serveur', 500));
    api.getCoachCompetitionDetail.mockResolvedValue(coachDetail());

    render(<CompetitionDetailPage competitionId={COMPETITION_ID} />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Open de Paris (vue coach)' })).toBeInTheDocument();
    expect(screen.getByText('Lina Exemple')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Sources des données' })).not.toBeInTheDocument();
  });

  it('compétition inexistante : message propre, jamais l’erreur technique', async () => {
    api.getCompetitionById.mockRejectedValue(new ApiError('Not Found', 404));
    api.getCoachCompetitionDetail.mockRejectedValue(new ApiError('Accès interdit à cette compétition', 403));

    render(<CompetitionDetailPage competitionId={COMPETITION_ID} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Compétition introuvable.');
    expect(screen.queryByText('Not Found')).not.toBeInTheDocument();
  });

  it('erreur coach inattendue : isolée dans la section équipe, le reste de la fiche s’affiche', async () => {
    api.getCompetitionById.mockResolvedValue(publicDetail());
    api.getCoachCompetitionDetail.mockRejectedValue(new ApiError('Une erreur est survenue (500)', 500));

    render(<CompetitionDetailPage competitionId={COMPETITION_ID} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Une erreur est survenue (500)');
    expect(screen.getByRole('heading', { level: 1, name: 'Open de Paris' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('region', { name: 'Inscrits' })).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Préparer cette compétition' })).not.toBeInTheDocument();
  });
});
