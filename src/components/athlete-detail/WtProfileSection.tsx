import { useEffect, useState } from 'react';
import Button from '../ui/Button';
import SectionLabel from '../ui/SectionLabel';
import { decideAthleteWtProfile, getWtAthleteRecord } from '../../services/coach.api';
import type { CoachAthleteWtProfile, WtAthleteRecord } from '../../types/coach';

interface WtProfileSectionProps {
  athleteId: string;
  athleteFirstName: string | null;
  wtProfile: CoachAthleteWtProfile | null;
  onChanged: () => void;
}

function label(profile: CoachAthleteWtProfile): string {
  return profile.countryCode ? `${profile.displayName} (${profile.countryCode})` : profile.displayName;
}

// Profil World Taekwondo de l'athlète : le coach confirme ou refuse la
// demande (il connaît son athlète — un profil public n'est jamais relié sur
// la seule foi d'un nom). Une fois confirmé : bilan international. Rien
// d'affiché si l'athlète n'a rien demandé.
function WtProfileSection({ athleteId, athleteFirstName, wtProfile, onChanged }: WtProfileSectionProps) {
  const [record, setRecord] = useState<WtAthleteRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const confirmedId = wtProfile?.status === 'confirmed' ? wtProfile.externalAthleteId : null;
  useEffect(() => {
    if (!confirmedId) return;
    let cancelled = false;
    getWtAthleteRecord(confirmedId)
      .then((data) => {
        if (!cancelled) setRecord(data);
      })
      .catch(() => {
        // Section indépendante : le bilan manquant ne bloque jamais la fiche.
      });
    return () => {
      cancelled = true;
    };
  }, [confirmedId]);

  if (!wtProfile) return null;

  async function decide(decision: 'confirm' | 'reject') {
    setBusy(true);
    setError(null);
    try {
      await decideAthleteWtProfile(athleteId, decision);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue. Réessaie.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="wt-profile-heading">
      <SectionLabel id="wt-profile-heading">Palmarès international</SectionLabel>

      {wtProfile.status === 'pending' ? (
        <div className="mt-3">
          <p className="text-sm text-ekvara-black/70">
            {athleteFirstName ?? "L'athlète"} indique être <span className="font-semibold text-ekvara-black">{label(wtProfile)}</span>{' '}
            sur World Taekwondo. Est-ce bien lui ou elle ?
          </p>
          <div className="mt-3 flex gap-3">
            <Button type="button" variant="primary" disabled={busy} onClick={() => decide('confirm')}>
              Confirmer
            </Button>
            <Button type="button" variant="secondary" disabled={busy} onClick={() => decide('reject')}>
              Refuser
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-3">
          <p className="text-sm text-ekvara-black/70">
            Profil World Taekwondo : <span className="font-semibold text-ekvara-black">{label(wtProfile)}</span>
          </p>
          {record && (
            <p className="mt-1 text-sm text-ekvara-black/70">
              {record.stats.recorded.competitions} compétition{record.stats.recorded.competitions > 1 ? 's' : ''} ·{' '}
              {record.stats.recorded.wins} V · {record.stats.recorded.losses} D
            </p>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </section>
  );
}

export default WtProfileSection;
