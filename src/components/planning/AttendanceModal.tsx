import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { getCoachTrainingAttendance, putCoachTrainingAttendance, ApiError } from '../../services/coach.api';
import type { AttendanceStatus, CoachTrainingAttendanceSheet } from '../../types/coach';
import { athleteName } from '../../utils/format';
import { formatDate } from '../../utils/date';
import { LoadingState, ErrorState } from '../ui/PageState';

// Volontairement un sous-ensemble minimal (pas CoachTrainingSummary ni
// CoachTrainingDetail en entier) : ce composant n'a besoin que de ces 4
// champs, présents identiquement dans les deux formes — reste utilisable
// depuis PlanningPage (CoachTrainingDetail) sans conversion.
interface AttendanceModalTraining {
  id: string;
  title: string;
  type: string | null;
  startAt: string;
}

interface AttendanceModalProps {
  training: AttendanceModalTraining;
  onClose: () => void;
  onSaved: () => void;
}

const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: 'present', label: 'Présent' },
  { value: 'absent', label: 'Absent' },
  { value: 'excuse', label: 'Excusé' },
];

// Ticket "Présences Coach V1" §19/§23/§25. État local jusqu'à "Enregistrer"
// (jamais d'autosave — §22, une erreur reste facile à corriger tant que
// rien n'est envoyé) : chaque changement de statut ne fait que muter le
// state local `entries`, une seule requête PUT batch au clic Enregistrer.
// Vrais <input type="radio"> groupés par athlète (§25 : pas un simple
// changement de couleur, un lecteur d'écran doit annoncer "Kais Dilmi —
// Présent sélectionné") — jamais un <select> comme PreparationDetailModal
// (le ticket demande explicitement 3 boutons, pas un dropdown, §23).
function AttendanceModal({ training, onClose, onSaved }: AttendanceModalProps) {
  const [sheet, setSheet] = useState<CoachTrainingAttendanceSheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [entries, setEntries] = useState<Map<string, { status: AttendanceStatus; note: string }>>(new Map());
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCoachTrainingAttendance(training.id)
      .then((data) => {
        if (cancelled) return;
        setSheet(data);
        const initial = new Map<string, { status: AttendanceStatus; note: string }>();
        for (const athlete of data.athletes) {
          if (athlete.attendance) {
            initial.set(athlete.athleteId, { status: athlete.attendance.status, note: athlete.attendance.note ?? '' });
          }
        }
        setEntries(initial);
      })
      .catch((err: Error) => {
        if (!cancelled) setLoadError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [training.id]);

  function setStatus(athleteId: string, status: AttendanceStatus) {
    setEntries((current) => {
      const next = new Map(current);
      next.set(athleteId, { status, note: current.get(athleteId)?.note ?? '' });
      return next;
    });
  }

  function setNote(athleteId: string, note: string) {
    setEntries((current) => {
      const existing = current.get(athleteId);
      if (!existing) return current;
      const next = new Map(current);
      next.set(athleteId, { ...existing, note });
      return next;
    });
  }

  // Ticket §20 : le workflow le plus rapide en club — marquer tout le monde
  // présent puis corriger les exceptions, plutôt que 20 clics répétitifs.
  function markAllPresent() {
    if (!sheet) return;
    setEntries((current) => {
      const next = new Map(current);
      for (const athlete of sheet.athletes) {
        next.set(athlete.athleteId, { status: 'present', note: next.get(athlete.athleteId)?.note ?? '' });
      }
      return next;
    });
  }

  async function handleSave() {
    if (!sheet) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const attendances = [...entries.entries()].map(([athleteId, entry]) => ({
        athleteId,
        status: entry.status,
        note: entry.note.trim() || undefined,
      }));
      await putCoachTrainingAttendance(training.id, { attendances });
      onSaved();
    } catch (err) {
      // Ticket §22 : la modal reste ouverte, les sélections locales sont
      // conservées (jamais réinitialisées sur erreur).
      setSubmitError(err instanceof ApiError ? err.message : 'Une erreur est survenue. Réessaie.');
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Présences" onClose={onClose} maxWidthClassName="max-w-lg">
      <div className="flex max-h-[75vh] flex-col overflow-hidden">
        <div className="border-b border-gray-100 px-5 pb-4 pt-5">
          <p className="text-sm text-ekvara-black/70">{formatDate(training.startAt)}</p>
          <p className="font-display text-base font-bold text-ekvara-black">
            {[training.title, training.type].filter(Boolean).join(' — ')}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && <LoadingState label="Chargement des présences..." />}
          {!loading && loadError && <ErrorState message={loadError} />}

          {!loading && !loadError && sheet && sheet.athletes.length === 0 && (
            <p className="text-sm text-ekvara-black/60">Aucun athlète assigné à cette séance.</p>
          )}

          {!loading && !loadError && sheet && sheet.athletes.length > 0 && (
            <div className="space-y-5">
              {sheet.athletes.map((athlete) => {
                const entry = entries.get(athlete.athleteId);
                return (
                  <fieldset key={athlete.athleteId} className="border-t border-gray-100 pt-4 first:border-t-0 first:pt-0">
                    <legend className="w-full">
                      <span className="font-display text-sm font-bold text-ekvara-black">{athleteName(athlete)}</span>
                      <span className="ml-2 text-xs text-ekvara-black/50">{athlete.groupName ?? 'Individuel'}</span>
                    </legend>

                    <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={`Présence — ${athleteName(athlete)}`}>
                      {STATUS_OPTIONS.map((option) => {
                        const checked = entry?.status === option.value;
                        return (
                          <label
                            key={option.value}
                            className={`inline-flex min-w-[92px] cursor-pointer items-center justify-center rounded-md border px-4 py-2.5 text-sm font-medium transition-colors ${
                              checked
                                ? option.value === 'present'
                                  ? 'border-ekvara-lime bg-ekvara-lime text-ekvara-black'
                                  : 'border-ekvara-black bg-ekvara-black text-ekvara-surface'
                                : 'border-ekvara-black/15 bg-ekvara-surface text-ekvara-black hover:border-ekvara-black/30'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`attendance-${athlete.athleteId}`}
                              value={option.value}
                              checked={checked}
                              onChange={() => setStatus(athlete.athleteId, option.value)}
                              className="sr-only"
                            />
                            {option.label}
                          </label>
                        );
                      })}
                    </div>

                    {entry && (
                      <input
                        type="text"
                        value={entry.note}
                        onChange={(event) => setNote(athlete.athleteId, event.target.value)}
                        placeholder="Note privée (facultatif)"
                        aria-label={`Note privée — ${athleteName(athlete)}`}
                        className="mt-2 w-full rounded-md border border-ekvara-black/15 bg-ekvara-surface px-3 py-2 text-sm text-ekvara-black outline-none focus:border-ekvara-black/40"
                      />
                    )}
                  </fieldset>
                );
              })}
            </div>
          )}
        </div>

        {!loading && !loadError && sheet && sheet.athletes.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-4">
            {submitError && (
              <p role="alert" className="mb-3 text-sm text-red-600">
                {submitError}
              </p>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={markAllPresent}
                disabled={submitting}
                className="text-sm text-ekvara-black underline decoration-ekvara-black/30 underline-offset-2 hover:decoration-ekvara-black disabled:opacity-50"
              >
                Tout marquer présent
              </button>
              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
                  Annuler
                </Button>
                <Button type="button" variant="primary" onClick={handleSave} disabled={submitting || entries.size === 0}>
                  {submitting ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default AttendanceModal;
