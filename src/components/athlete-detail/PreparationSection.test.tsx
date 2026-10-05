import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import PreparationSection from './PreparationSection';
import type { CoachAthleteDetailDashboard, NextCompetitionView } from '../../types/coach';

function next(overrides: Partial<NextCompetitionView> = {}): NextCompetitionView {
  return {
    id: 'comp-champ',
    name: 'Championnat de France seniors',
    startDate: '2027-03-13T00:00:00.000Z',
    city: 'Eaubonne',
    country: 'France',
    level: 'national',
    weightCategory: null,
    ageCategory: null,
    source: 'coach_preparation',
    preparation: { status: 'pret', targetAgeCategory: 'Senior', targetWeightCategory: '-68kg' },
    daysUntil: 173,
    ...overrides,
  };
}

function athlete(nextCompetition: NextCompetitionView | null, hasTraining = true): CoachAthleteDetailDashboard {
  return {
    id: 'a-kais',
    firstName: 'Kaïs',
    lastName: 'Dilmi',
    ageCategory: null,
    grade: null,
    sportLevel: null,
    condition: { status: 'actif', note: null, expectedReturn: null, updatedAt: null },
    wtProfile: null,
    groups: [],
    weight: { currentWeight: null, measuredAt: null, target: null, differenceToTarget: null, weeklyChange: null },
    progression: { improvedCount: 0, decliningCount: 0, unknownCount: 0, evaluatedCount: 0, overallStatus: null },
    nextCompetition,
    nextTraining: hasTraining ? { id: 't1', title: 'Taekwondo', startAt: '2026-09-21T18:30:00.000Z', endAt: null, type: null } : null,
    primaryGoal: null,
  } as CoachAthleteDetailDashboard;
}

describe('PreparationSection — prochaine compétition (fiche athlète coach)', () => {
  it('empty state réel : aucune compétition à venir', () => {
    render(<PreparationSection athlete={athlete(null)} />);

    expect(screen.getByText('Aucune compétition à venir.')).toBeInTheDocument();
  });

  it('cas Kaïs : nom, date, lieu, catégories prévues et statut affichés à la place de « Aucune compétition à venir »', () => {
    render(<PreparationSection athlete={athlete(next())} />);

    expect(screen.getByText('Championnat de France seniors')).toBeInTheDocument();
    expect(screen.getByText(/13 mars 2027/)).toBeInTheDocument();
    expect(screen.getByText(/Eaubonne, France/)).toBeInTheDocument();
    expect(screen.getByText('Senior · -68kg')).toBeInTheDocument();
    expect(screen.getByText('Prêt')).toBeInTheDocument();
    expect(screen.getByText('J-173')).toBeInTheDocument();
    expect(screen.queryByText('Aucune compétition à venir.')).not.toBeInTheDocument();
  });

  it('préparation seule : "Inscription officielle non confirmée" (jamais présentée comme une inscription)', () => {
    render(<PreparationSection athlete={athlete(next())} />);

    expect(screen.getByText('Inscription officielle non confirmée')).toBeInTheDocument();
  });

  it('participation : catégories OFFICIELLES, pas de mention "non confirmée"', () => {
    render(
      <PreparationSection
        athlete={athlete(
          next({ source: 'participation', weightCategory: '-74 kg', ageCategory: 'Cadet', preparation: null }),
        )}
      />,
    );

    expect(screen.getByText('Cadet · -74 kg')).toBeInTheDocument();
    expect(screen.queryByText('Inscription officielle non confirmée')).not.toBeInTheDocument();
  });

  it('participation + préparation : UNE seule compétition, catégories officielles prioritaires, statut de préparation visible', () => {
    render(
      <PreparationSection
        athlete={athlete(
          next({
            source: 'participation',
            weightCategory: '-74 kg',
            ageCategory: 'Cadet',
            preparation: { status: 'selectionne', targetAgeCategory: 'Senior', targetWeightCategory: '-68kg' },
          }),
        )}
      />,
    );

    expect(screen.getAllByText('Championnat de France seniors')).toHaveLength(1);
    expect(screen.getByText('Cadet · -74 kg')).toBeInTheDocument();
    expect(screen.queryByText(/Senior/)).not.toBeInTheDocument();
    expect(screen.getByText('Sélectionné')).toBeInTheDocument();
  });

  it('catégories partielles : pas de séparateur orphelin, et rien si aucune', () => {
    const { rerender } = render(
      <PreparationSection
        athlete={athlete(next({ preparation: { status: 'envisage', targetAgeCategory: null, targetWeightCategory: '-68kg' } }))}
      />,
    );
    expect(screen.getByText('-68kg')).toBeInTheDocument();
    expect(screen.getByText('Envisagé')).toBeInTheDocument();

    rerender(
      <PreparationSection
        athlete={athlete(next({ preparation: { status: 'envisage', targetAgeCategory: null, targetWeightCategory: null } }))}
      />,
    );
    expect(screen.queryByText(/·\s*$/)).not.toBeInTheDocument();
  });

  it('navigation : le nom mène à /competitions/:id (pattern existant <a href> + handleNavClick)', () => {
    render(<PreparationSection athlete={athlete(next())} />);

    const link = screen.getByRole('link', { name: 'Championnat de France seniors' });
    expect(link).toHaveAttribute('href', '/competitions/comp-champ');

    fireEvent.click(link);
    expect(window.location.pathname).toBe('/competitions/comp-champ');
  });

  it('aucune note/objectif coach rendu, même si la donnée en contenait par erreur', () => {
    const leaky = next({ preparation: { status: 'pret', targetAgeCategory: 'Senior', targetWeightCategory: '-68kg' } });
    (leaky.preparation as unknown as Record<string, string>).coachNote = 'NOTE-SECRETE';
    (leaky.preparation as unknown as Record<string, string>).note_coach = 'NOTE-SECRETE';

    const { container } = render(<PreparationSection athlete={athlete(leaky)} />);

    expect(container.textContent).not.toContain('NOTE-SECRETE');
  });

  it('prochain entraînement inchangé', () => {
    render(<PreparationSection athlete={athlete(next())} />);

    expect(screen.getByText('Taekwondo')).toBeInTheDocument();
  });

  it('rien du tout : "Rien de prévu pour le moment." (comportement existant)', () => {
    render(<PreparationSection athlete={athlete(null, false)} />);

    expect(screen.getByText('Rien de prévu pour le moment.')).toBeInTheDocument();
  });
});
