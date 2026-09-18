import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { createCoachInvitation } from '../../services/coach.api';
import { formatDate } from '../../utils/date';
import type { CoachGroupListItem } from '../../types/coach';

interface InviteAthleteModalProps {
  groups: CoachGroupListItem[];
  onClose: () => void;
  onCreated: () => void;
}

// Le code brut n'est affiché qu'ICI, une seule fois, immédiatement après
// génération (voir ticket "Clubs, invitations & inscription Athlete
// contrôlée V1" §"LISTE DES INVITATIONS") : le backend ne le stocke jamais
// en clair, il ne peut donc plus jamais être réaffiché après fermeture de
// cette modale — si le coach le perd, il révoque et en génère un autre.
function InviteAthleteModal({ groups, onClose, onCreated }: InviteAthleteModalProps) {
  const [groupId, setGroupId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ code: string; expiresAt: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setError(null);
    setSubmitting(true);
    try {
      const created = await createCoachInvitation(groupId || undefined);
      setResult({ code: created.code, expiresAt: created.expiresAt });
      onCreated();
    } catch {
      setError('Une erreur est survenue. Réessaie.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard indisponible (permissions, contexte non sécurisé) : le
      // code reste affiché à l'écran, copiable manuellement — pas une
      // erreur bloquante pour ce simple confort.
    }
  }

  return (
    <Modal title="Inviter un athlète" onClose={onClose}>
      {!result ? (
        <div className="space-y-4 p-5">
          <p className="text-sm text-ekvara-black/70">
            Génère un code d'invitation pour permettre à un membre du club de créer son compte EKVARA.
          </p>

          {groups.length > 0 && (
            <div>
              <label htmlFor="invite-group" className="mb-1.5 block text-sm font-medium text-ekvara-black">
                Groupe (optionnel)
              </label>
              <select
                id="invite-group"
                value={groupId}
                onChange={(event) => setGroupId(event.target.value)}
                className="w-full rounded-md border border-ekvara-black/15 bg-ekvara-surface px-3 py-2.5 text-sm text-ekvara-black outline-none focus:border-ekvara-black/40"
              >
                <option value="">Aucun groupe</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <Button variant="primary" disabled={submitting} className="w-full" onClick={handleGenerate}>
            {submitting ? 'Génération...' : 'Générer un code'}
          </Button>
        </div>
      ) : (
        <div className="space-y-4 p-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ekvara-black/50">Code d'invitation</p>
            <p className="mt-1 font-display text-3xl font-extrabold tracking-wide text-ekvara-black">
              {result.code}
            </p>
            <p className="mt-1 text-xs text-ekvara-black/50">Expire le {formatDate(result.expiresAt)}</p>
          </div>

          <Button variant="secondary" className="w-full" onClick={handleCopy}>
            {copied ? 'Code copié' : 'Copier le code'}
          </Button>

          <Button variant="primary" className="w-full" onClick={onClose}>
            Terminé
          </Button>
        </div>
      )}
    </Modal>
  );
}

export default InviteAthleteModal;
