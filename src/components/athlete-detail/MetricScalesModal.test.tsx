import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MetricScalesModal from './MetricScalesModal';
import type { ClubMetricScale } from '../../types/coach';

const api = vi.hoisted(() => ({ getClubMetricScales: vi.fn(), saveClubMetricScales: vi.fn() }));
vi.mock('../../services/coach.api', () => api);

const REACTION: ClubMetricScale = {
  metricTypeId: 'm-reaction', code: 'temps_reaction', name: 'Temps de réaction', unit: 'ms', direction: 'lower',
  default: { scoreZero: 600, scoreHundred: 250 }, club: { scoreZero: 500, scoreHundred: 300 }, effective: { scoreZero: 500, scoreHundred: 300 },
};
const FORCE: ClubMetricScale = {
  metricTypeId: 'm-force', code: 'force', name: 'Force', unit: 'kg', direction: 'higher',
  default: { scoreZero: 40, scoreHundred: 140 }, club: null, effective: { scoreZero: 40, scoreHundred: 140 },
};

function group(name: string) {
  return within(screen.getByRole('group', { name: new RegExp(name) }));
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('MetricScalesModal — barème du club', () => {
  it('pré-remplit le barème du club, le défaut en indication, le sens de chaque capacité', async () => {
    api.getClubMetricScales.mockResolvedValue({ scales: [REACTION, FORCE] });
    render(<MetricScalesModal onClose={vi.fn()} onSaved={vi.fn()} />);

    await screen.findByRole('group', { name: /Temps de réaction/ });
    expect(group('Temps de réaction').getByLabelText('0/100 (ms)')).toHaveValue('500');
    expect(group('Temps de réaction').getByText('plus bas = mieux')).toBeInTheDocument();
    expect(group('Force').getByLabelText('0/100 (kg)')).toHaveValue('');
    expect(group('Force').getByLabelText('0/100 (kg)')).toHaveAttribute('placeholder', '40');
  });

  it('n\'envoie que les capacités modifiées ; champs vidés = retour au défaut (null/null)', async () => {
    api.getClubMetricScales.mockResolvedValue({ scales: [REACTION, FORCE] });
    api.saveClubMetricScales.mockResolvedValue({ scales: [] });
    const onSaved = vi.fn();
    render(<MetricScalesModal onClose={vi.fn()} onSaved={onSaved} />);

    await screen.findByRole('group', { name: /Temps de réaction/ });
    await userEvent.clear(group('Temps de réaction').getByLabelText('0/100 (ms)'));
    await userEvent.clear(group('Temps de réaction').getByLabelText('100/100 (ms)'));
    await userEvent.type(group('Force').getByLabelText('0/100 (kg)'), '50');
    await userEvent.type(group('Force').getByLabelText('100/100 (kg)'), '150,5');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(api.saveClubMetricScales).toHaveBeenCalledWith([
      { metricTypeId: 'm-reaction', scoreZero: null, scoreHundred: null },
      { metricTypeId: 'm-force', scoreZero: 50, scoreHundred: 150.5 },
    ]);
    expect(onSaved).toHaveBeenCalled();
  });

  it('une seule valeur saisie : message, aucun envoi ; rien modifié : ferme sans envoyer', async () => {
    api.getClubMetricScales.mockResolvedValue({ scales: [FORCE] });
    const onClose = vi.fn();
    render(<MetricScalesModal onClose={onClose} onSaved={vi.fn()} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Enregistrer' }));
    expect(onClose).toHaveBeenCalled();
    expect(api.saveClubMetricScales).not.toHaveBeenCalled();

    await userEvent.type(group('Force').getByLabelText('0/100 (kg)'), '50');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Force : renseigne les deux valeurs');
    expect(api.saveClubMetricScales).not.toHaveBeenCalled();
  });

  it('refus du backend (mauvais sens) : message lisible, fenêtre ouverte', async () => {
    api.getClubMetricScales.mockResolvedValue({ scales: [REACTION] });
    api.saveClubMetricScales.mockRejectedValue(new Error('Temps de réaction : plus bas = meilleur, la valeur 100/100 doit être inférieure à la valeur 0/100'));
    const onSaved = vi.fn();
    render(<MetricScalesModal onClose={vi.fn()} onSaved={onSaved} />);

    await screen.findByRole('group', { name: /Temps de réaction/ });
    const zero = group('Temps de réaction').getByLabelText('0/100 (ms)');
    await userEvent.clear(zero);
    await userEvent.type(zero, '200');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('plus bas = meilleur');
    expect(onSaved).not.toHaveBeenCalled();
  });
});
