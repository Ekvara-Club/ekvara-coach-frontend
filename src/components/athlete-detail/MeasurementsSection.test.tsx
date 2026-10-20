import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MeasurementsSection from './MeasurementsSection';

const api = vi.hoisted(() => ({ getCoachAthleteMeasurements: vi.fn() }));
vi.mock('../../services/coach.api', () => api);

afterEach(() => {
  vi.clearAllMocks();
});

describe('MeasurementsSection (coach, lecture seule)', () => {
  it("affiche la taille et la longueur de bras déclarées par l'athlète", async () => {
    api.getCoachAthleteMeasurements.mockResolvedValue({ tailleCm: 178, longueurBrasCm: 72 });
    render(<MeasurementsSection athleteId="a-1" />);

    expect(await screen.findByText('178 cm')).toBeInTheDocument();
    expect(screen.getByText('72 cm')).toBeInTheDocument();
    expect(api.getCoachAthleteMeasurements).toHaveBeenCalledWith('a-1');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it("une seule valeur renseignée : tiret pour l'autre, jamais une valeur inventée", async () => {
    api.getCoachAthleteMeasurements.mockResolvedValue({ tailleCm: 165, longueurBrasCm: null });
    render(<MeasurementsSection athleteId="a-1" />);
    expect(await screen.findByText('165 cm')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('rien de renseigné : message', async () => {
    api.getCoachAthleteMeasurements.mockResolvedValue({ tailleCm: null, longueurBrasCm: null });
    render(<MeasurementsSection athleteId="a-1" />);
    expect(await screen.findByText("Non renseignées par l'athlète.")).toBeInTheDocument();
  });

  it("erreur de chargement : message, le reste de la fiche n'est pas concerné", async () => {
    api.getCoachAthleteMeasurements.mockRejectedValue(new Error('Accès refusé'));
    render(<MeasurementsSection athleteId="a-1" />);
    expect(await screen.findByText('Accès refusé')).toBeInTheDocument();
  });
});
