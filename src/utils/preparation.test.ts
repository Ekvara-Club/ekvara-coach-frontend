import { describe, expect, it } from 'vitest';
import { formatPlannedCategories, formatPreparationStatus } from './preparation';

describe('formatPreparationStatus', () => {
  it('libellés coach des statuts réels (jamais "Inscrit")', () => {
    expect(formatPreparationStatus('envisage')).toBe('Envisagé');
    expect(formatPreparationStatus('selectionne')).toBe('Sélectionné');
    expect(formatPreparationStatus('pret')).toBe('Prêt');
    expect(formatPreparationStatus('forfait')).toBe('Forfait');
  });

  it('statut inconnu : affiché tel quel, capitalisé', () => {
    expect(formatPreparationStatus('autre')).toBe('Autre');
  });
});

describe('formatPlannedCategories', () => {
  it('joint âge et poids sans séparateur orphelin', () => {
    expect(formatPlannedCategories('Senior', '-68kg')).toBe('Senior · -68kg');
    expect(formatPlannedCategories('Senior', null)).toBe('Senior');
    expect(formatPlannedCategories(null, '-68kg')).toBe('-68kg');
    expect(formatPlannedCategories(null, null)).toBeNull();
  });
});
