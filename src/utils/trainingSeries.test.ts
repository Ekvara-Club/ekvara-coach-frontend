import { describe, expect, it } from 'vitest';
import { isoWeekdayOf, previewSeries } from './trainingSeries';

describe('trainingSeries — aperçu', () => {
  it('jour ISO d\'une date (mercredi = 3, dimanche = 7)', () => {
    expect(isoWeekdayOf('2026-10-07')).toBe(3);
    expect(isoWeekdayOf('2026-10-11')).toBe(7);
  });

  it('tous les mercredis pendant 1 mois : début inclus, même quantième un mois plus tard exclu', () => {
    const preview = previewSeries('2026-10-07', [3], 1);

    expect(preview.count).toBe(5);
    expect(preview.first?.toDateString()).toBe(new Date(2026, 9, 7).toDateString());
    expect(preview.last?.toDateString()).toBe(new Date(2026, 10, 4).toDateString());
  });

  it('mardi + jeudi pendant 1 an', () => {
    expect(previewSeries('2026-10-05', [2, 4], 12).count).toBe(104);
  });

  it('31 janvier + 1 mois : fenêtre ramenée à fin février, jamais sur mars', () => {
    const preview = previewSeries('2027-01-31', [1, 2, 3, 4, 5, 6, 7], 1);

    expect(preview.count).toBe(28);
    expect(preview.last?.toDateString()).toBe(new Date(2027, 1, 27).toDateString());
  });

  it('aucun jour coché : 0 séance', () => {
    expect(previewSeries('2026-10-07', [], 3)).toEqual({ count: 0, first: null, last: null });
  });
});
