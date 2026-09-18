import type { CoachInvitationListItem } from '../../types/coach';
import { formatDate } from '../../utils/date';
import Button from '../ui/Button';

interface PendingInvitationsListProps {
  invitations: CoachInvitationListItem[];
  onRevoke: (invitationId: string) => void;
  revokingId: string | null;
}

// Présentationnel : la page fournit déjà les invitations par props (voir
// AthletesPage), aucun fetch ici. N'affiche QUE les invitations "active"
// (voir AthletesPage.pendingInvitations) : le backend ne renvoie jamais le
// code brut au-delà de sa création (voir InviteAthleteModal), donc rien
// d'utile à montrer ici pour une invitation déjà utilisée/révoquée/expirée.
function PendingInvitationsList({ invitations, onRevoke, revokingId }: PendingInvitationsListProps) {
  if (invitations.length === 0) {
    return <p className="text-sm text-ekvara-black/60">Aucune invitation en attente.</p>;
  }

  return (
    <ul className="divide-y divide-gray-100">
      {invitations.map((invitation) => (
        <li key={invitation.id} className="flex items-center justify-between gap-4 py-3">
          <p className="text-sm text-ekvara-black/70">Expire le {formatDate(invitation.expiresAt)}</p>
          <Button
            variant="secondary"
            disabled={revokingId === invitation.id}
            onClick={() => onRevoke(invitation.id)}
          >
            {revokingId === invitation.id ? 'Révocation...' : 'Révoquer'}
          </Button>
        </li>
      ))}
    </ul>
  );
}

export default PendingInvitationsList;
