import type { NotificationItem, PaginatedNotifications, UnreadCountResponse } from '../types/notification';
import { apiFetch } from './apiClient';

// context=COACH systématique (ticket "NOTIFICATION CONTEXT") : ce frontend ne
// doit jamais afficher une notification rédigée pour l'interface athlète,
// même sur un compte hybride athlète+coach. Aucun type COACH n'est encore
// produit en V1 (voir rapport final) : le panneau reste fonctionnel mais
// vide tant qu'aucune mutation coach n'émet de notification COACH.
const CONTEXT = 'COACH';

export async function getNotifications(page = 1, limit = 20): Promise<PaginatedNotifications> {
  const response = await apiFetch(`/notifications?context=${CONTEXT}&page=${page}&limit=${limit}`);

  if (!response.ok) {
    throw new Error(`Impossible de récupérer les notifications (${response.status})`);
  }

  const data: PaginatedNotifications = await response.json();
  return data;
}

export async function getUnreadCount(): Promise<UnreadCountResponse> {
  const response = await apiFetch(`/notifications/unread-count?context=${CONTEXT}`);

  if (!response.ok) {
    throw new Error(`Impossible de récupérer le nombre de notifications non lues (${response.status})`);
  }

  const data: UnreadCountResponse = await response.json();
  return data;
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const response = await apiFetch(`/notifications/${notificationId}/read`, { method: 'PATCH' });

  if (!response.ok) {
    throw new Error(`Impossible de marquer la notification comme lue (${response.status})`);
  }
}

export async function markAllNotificationsRead(): Promise<{ updated: number }> {
  const response = await apiFetch(`/notifications/read-all?context=${CONTEXT}`, { method: 'PATCH' });

  if (!response.ok) {
    throw new Error(`Impossible de marquer les notifications comme lues (${response.status})`);
  }

  const data: { updated: number } = await response.json();
  return data;
}

// Deep link (ticket "DEEP LINKS") : premier type COACH réellement produit =
// changement d'état de forme d'un athlète (resourceType ATHLETE) -> sa
// fiche. Tout le reste -> dashboard, seule page toujours pertinente.
export function deepLinkFor(notification: NotificationItem): string {
  if (notification.resourceType === 'ATHLETE' && notification.resourceId) {
    return `/athletes/${notification.resourceId}`;
  }
  // Synchro des sources : compétition modifiée -> sa fiche.
  if (notification.resourceType === 'COMPETITION' && notification.resourceId) {
    return `/competitions/${notification.resourceId}`;
  }
  return '/';
}
