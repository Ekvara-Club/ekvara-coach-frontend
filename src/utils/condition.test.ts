import { describe, expect, it } from 'vitest';
import { conditionDetails, conditionLabel, isUnavailable } from './condition';
import { deepLinkFor } from '../services/notifications.api';
import { attentionReasonLabel } from './attentionReasons';
import type { NotificationItem } from '../types/notification';

describe('état de forme athlète — côté coach', () => {
  it('libellés, indisponibilité et détails (date métier sans décalage de jour)', () => {
    expect(conditionLabel('blesse')).toBe('Blessé');
    expect(isUnavailable({ status: 'actif', note: null, expectedReturn: null, updatedAt: null })).toBe(false);
    expect(isUnavailable({ status: 'malade', note: null, expectedReturn: null, updatedAt: null })).toBe(true);
    expect(
      conditionDetails({ status: 'blesse', note: 'Entorse cheville', expectedReturn: '2026-10-20', updatedAt: null }),
    ).toBe('Entorse cheville · retour prévu le 20 octobre');
    expect(conditionDetails({ status: 'absent', note: null, expectedReturn: null, updatedAt: null })).toBe('');
  });

  it('raisons « À surveiller » traduites', () => {
    expect(attentionReasonLabel('CONDITION_INJURED')).toBe('Déclaré blessé');
    expect(attentionReasonLabel('CONDITION_SICK')).toBe('Déclaré malade');
    expect(attentionReasonLabel('CONDITION_ABSENT')).toBe('Déclaré absent');
    expect(attentionReasonLabel('WT_LINK_PENDING')).toBe('Profil World Taekwondo à confirmer');
  });

  it('notification de changement d\'état -> fiche de l\'athlète ; autres -> tableau de bord', () => {
    const base: NotificationItem = {
      id: 'n-1', actorUserId: 'u-a', type: 'ATHLETE_CONDITION_UPDATED', title: 't', message: null,
      resourceType: 'ATHLETE', resourceId: 'a-kais', isRead: false, createdAt: '2026-10-05T10:00:00.000Z', readAt: null,
    };
    expect(deepLinkFor(base)).toBe('/athletes/a-kais');
    expect(deepLinkFor({ ...base, type: 'TRAINING_ASSIGNED', resourceType: 'TRAINING', resourceId: 't-1' })).toBe('/');
    expect(deepLinkFor({ ...base, type: 'COMPETITION_UPDATED', resourceType: 'COMPETITION', resourceId: 'c-1' })).toBe('/competitions/c-1');
  });
});
