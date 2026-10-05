import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WtProfileSection from './WtProfileSection';
import type { CoachAthleteWtProfile } from '../../types/coach';

const api = vi.hoisted(() => ({ decideAthleteWtProfile: vi.fn(), getWtAthleteRecord: vi.fn() }));
vi.mock('../../services/coach.api', () => api);

const profile = (status: 'pending' | 'confirmed'): CoachAthleteWtProfile => ({
  status, externalAthleteId: 'ext-1', displayName: 'Kais DILMI', countryCode: 'FRA',
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('WtProfileSection (coach)', () => {
  it('aucune demande : section absente', () => {
    const { container } = render(<WtProfileSection athleteId="a-1" athleteFirstName="Kaïs" wtProfile={null} onChanged={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('demande en attente : confirmer ou refuser, puis la fiche est rechargée ; aucun bilan chargé avant confirmation', async () => {
    api.decideAthleteWtProfile.mockResolvedValue({ status: 'confirmed' });
    const onChanged = vi.fn();
    render(<WtProfileSection athleteId="a-1" athleteFirstName="Kaïs" wtProfile={profile('pending')} onChanged={onChanged} />);

    expect(screen.getByText(/Kaïs indique être/)).toHaveTextContent('Kais DILMI (FRA)');
    expect(api.getWtAthleteRecord).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Confirmer' }));
    expect(api.decideAthleteWtProfile).toHaveBeenCalledWith('a-1', 'confirm');
    expect(onChanged).toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Refuser' }));
    expect(api.decideAthleteWtProfile).toHaveBeenLastCalledWith('a-1', 'reject');
  });

  it('échec de la décision : message lisible, rien rechargé', async () => {
    api.decideAthleteWtProfile.mockRejectedValue(new Error('Ce profil World Taekwondo est déjà relié à un autre compte.'));
    const onChanged = vi.fn();
    render(<WtProfileSection athleteId="a-1" athleteFirstName="Kaïs" wtProfile={profile('pending')} onChanged={onChanged} />);

    await userEvent.click(screen.getByRole('button', { name: 'Confirmer' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('déjà relié à un autre compte');
    expect(onChanged).not.toHaveBeenCalled();
  });

  it('profil confirmé : bilan international (compétitions, V, D)', async () => {
    api.getWtAthleteRecord.mockResolvedValue({ stats: { recorded: { fights: 12, wins: 8, losses: 4, competitions: 5 } } });
    render(<WtProfileSection athleteId="a-1" athleteFirstName="Kaïs" wtProfile={profile('confirmed')} onChanged={vi.fn()} />);

    expect(await screen.findByText('5 compétitions · 8 V · 4 D')).toBeInTheDocument();
    expect(api.getWtAthleteRecord).toHaveBeenCalledWith('ext-1');
    expect(screen.queryByRole('button', { name: 'Confirmer' })).not.toBeInTheDocument();
  });
});
