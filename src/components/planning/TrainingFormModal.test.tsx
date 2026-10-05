import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TrainingFormModal from './TrainingFormModal';
import type { CoachGroupListItem } from '../../types/coach';

const api = vi.hoisted(() => ({
  createCoachTraining: vi.fn(),
  createCoachTrainingSeries: vi.fn(),
  updateCoachTraining: vi.fn(),
}));
vi.mock('../../services/coach.api', () => api);

const GROUP: CoachGroupListItem = { id: 'g-elite', name: 'Élite', athleteCount: 2 };
const MEMBERSHIP = new Map([['g-elite', new Set(['a-1', 'a-2'])]]);

function renderCreate(onSaved = vi.fn()) {
  render(
    <TrainingFormModal
      mode="create"
      groups={[GROUP]}
      roster={[]}
      membershipMap={MEMBERSHIP}
      onClose={vi.fn()}
      onSaved={onSaved}
    />,
  );
  return onSaved;
}

async function fillBase() {
  await userEvent.type(screen.getByLabelText('Titre'), 'Combat');
  fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-10-07' } });
  fireEvent.change(screen.getByLabelText('Heure de début'), { target: { value: '20:00' } });
  fireEvent.change(screen.getByLabelText('Heure de fin'), { target: { value: '21:30' } });
  await userEvent.click(screen.getByRole('checkbox', { name: 'Élite' }));
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('TrainingFormModal — séance récurrente', () => {
  it('"Répéter" pré-coche le jour de la date, aperçu du nombre de séances, envoi de la série (heure murale, jamais une liste d\'instants)', async () => {
    api.createCoachTrainingSeries.mockResolvedValue({ seriesId: 's-1', occurrenceCount: 14 });
    const onSaved = renderCreate();
    await fillBase();

    await userEvent.click(screen.getByRole('checkbox', { name: 'Répéter chaque semaine' }));

    expect(screen.getByRole('button', { name: 'Mercredi' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('À partir du')).toHaveValue('2026-10-07');
    // 3 mois par défaut : 7 oct. inclus -> 7 janv. exclu = 14 mercredis
    // (le dernier est le 6 janvier 2027).
    expect(screen.getByText('14 séances, du 7 octobre 2026 au 6 janvier 2027')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Vendredi' }));
    await userEvent.selectOptions(screen.getByLabelText('Pendant'), '1 an');
    expect(screen.getByRole('button', { name: /^Créer \d+ séances$/ })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /^Créer \d+ séances$/ }));

    expect(api.createCoachTrainingSeries).toHaveBeenCalledWith({
      title: 'Combat',
      type: undefined,
      subType: undefined,
      location: undefined,
      level: undefined,
      description: undefined,
      startDate: '2026-10-07',
      startTime: '20:00',
      endTime: '21:30',
      weekdays: [3, 5],
      durationMonths: 12,
      groupIds: ['g-elite'],
      athleteIds: [],
    });
    expect(api.createCoachTraining).not.toHaveBeenCalled();
    expect(onSaved).toHaveBeenCalled();
  });

  it('aucun jour coché : message de validation, aucun appel', async () => {
    renderCreate();
    await fillBase();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Répéter chaque semaine' }));
    await userEvent.click(screen.getByRole('button', { name: 'Mercredi' }));

    await userEvent.click(screen.getByRole('button', { name: 'Créer' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Choisis au moins un jour de la semaine.');
    expect(api.createCoachTrainingSeries).not.toHaveBeenCalled();
  });

  it('erreur backend : message affiché, formulaire conservé', async () => {
    api.createCoachTrainingSeries.mockRejectedValue(new Error('Un ou plusieurs groupes n\'appartiennent pas à ce coach'));
    const onSaved = renderCreate();
    await fillBase();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Répéter chaque semaine' }));

    await userEvent.click(screen.getByRole('button', { name: /^Créer \d+ séances$/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent("Un ou plusieurs groupes n'appartiennent pas à ce coach");
    expect(screen.getByRole('button', { name: 'Mercredi' })).toHaveAttribute('aria-pressed', 'true');
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('sans "Répéter" : séance unique via l\'endpoint existant (inchangé)', async () => {
    api.createCoachTraining.mockResolvedValue({ id: 't-1' });
    renderCreate();
    await fillBase();

    await userEvent.click(screen.getByRole('button', { name: 'Créer' }));

    expect(api.createCoachTraining).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Combat', startAt: expect.any(String), groupIds: ['g-elite'] }),
    );
    expect(api.createCoachTrainingSeries).not.toHaveBeenCalled();
  });

  it('mode édition : pas d\'option de répétition (une occurrence se modifie seule)', () => {
    render(
      <TrainingFormModal
        mode="edit"
        training={{
          id: 't-1', title: 'Combat', type: null, subType: null, startAt: '2026-10-07T18:00:00.000Z', endAt: null,
          location: null, level: null, description: null, status: 'prevu', seriesId: 's-1',
          assignments: { athleteCount: 0, athletes: [], groups: [] },
        }}
        groups={[]}
        roster={[]}
        membershipMap={new Map()}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    expect(screen.queryByRole('checkbox', { name: 'Répéter chaque semaine' })).not.toBeInTheDocument();
  });
});
