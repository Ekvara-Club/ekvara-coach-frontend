import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TrainingDetailModal from './TrainingDetailModal';
import CancelSeriesModal from './CancelSeriesModal';
import type { CoachTrainingDetail } from '../../types/coach';

const api = vi.hoisted(() => ({
  getCoachTrainingAttendance: vi.fn(),
  cancelCoachTrainingSeriesUpcoming: vi.fn(),
}));
vi.mock('../../services/coach.api', () => api);

function training(overrides: Partial<CoachTrainingDetail> = {}): CoachTrainingDetail {
  return {
    id: 't-1', title: 'Combat', type: null, subType: null, startAt: '2099-10-07T18:00:00.000Z', endAt: null,
    location: null, level: null, description: null, status: 'prevu', seriesId: null,
    assignments: { athleteCount: 0, athletes: [], groups: [] },
    ...overrides,
  };
}

function renderDetail(t: CoachTrainingDetail, onCancelSeries?: () => void) {
  const handlers = { onCancelTraining: vi.fn() };
  render(
    <TrainingDetailModal
      training={t}
      onClose={vi.fn()}
      onEditContent={vi.fn()}
      onEditAssignments={vi.fn()}
      onCancelTraining={handlers.onCancelTraining}
      onManageAttendance={vi.fn()}
      onCancelSeries={onCancelSeries}
    />,
  );
  return handlers;
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('TrainingDetailModal — séance récurrente', () => {
  it('séance isolée : aucune mention ni action de série', () => {
    renderDetail(training());

    expect(screen.queryByText('Séance récurrente')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Annuler la séance' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /séances à venir de la série/ })).not.toBeInTheDocument();
  });

  it('occurrence d\'une série : mention, annuler cette séance OU toute la suite', async () => {
    const onCancelSeries = vi.fn();
    const { onCancelTraining } = renderDetail(training({ seriesId: 's-1' }), onCancelSeries);

    expect(screen.getByText('Séance récurrente')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Annuler toutes les séances à venir de la série' }));
    expect(onCancelSeries).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole('button', { name: 'Annuler cette séance uniquement' }));
    expect(onCancelTraining).toHaveBeenCalledTimes(1);
  });

  it('occurrence annulée : plus aucune action', () => {
    renderDetail(training({ seriesId: 's-1', status: 'annule' }), vi.fn());

    expect(screen.queryByRole('button', { name: /Annuler/ })).not.toBeInTheDocument();
  });
});

describe('CancelSeriesModal', () => {
  it('confirmation : appelle l\'annulation de la suite puis prévient le parent', async () => {
    api.cancelCoachTrainingSeriesUpcoming.mockResolvedValue({ cancelledCount: 8 });
    const onCancelled = vi.fn();
    render(<CancelSeriesModal seriesId="s-1" trainingTitle="Combat" onClose={vi.fn()} onCancelled={onCancelled} />);

    expect(screen.getByText(/Les séances passées et leurs présences restent inchangées/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Annuler la série' }));

    expect(api.cancelCoachTrainingSeriesUpcoming).toHaveBeenCalledWith('s-1');
    expect(onCancelled).toHaveBeenCalled();
  });

  it('échec : message affiché, la modale reste ouverte', async () => {
    api.cancelCoachTrainingSeriesUpcoming.mockRejectedValue(new Error('Accès interdit à cette série'));
    const onCancelled = vi.fn();
    render(<CancelSeriesModal seriesId="s-1" trainingTitle="Combat" onClose={vi.fn()} onCancelled={onCancelled} />);

    await userEvent.click(screen.getByRole('button', { name: 'Annuler la série' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Accès interdit à cette série');
    expect(onCancelled).not.toHaveBeenCalled();
  });
});
