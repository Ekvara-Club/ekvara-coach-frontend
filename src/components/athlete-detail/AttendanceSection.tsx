import { useEffect, useState } from 'react';
import { getCoachAthleteAttendanceSummary } from '../../services/coach.api';
import type { CoachAttendanceSummary } from '../../types/coach';
import SectionLabel from '../ui/SectionLabel';
import { LoadingState, ErrorState } from '../ui/PageState';

interface AttendanceSectionProps {
  athleteId: string;
}

// Ticket "Présences Coach V1" §30 : résumé simple (taux + 3 compteurs), pas
// de graphique, pas d'historique par séance (reporté à V1.1 par décision
// explicite du ticket §31). Section indépendante et auto-chargée (comme
// WeightSection/GoalsSection, jamais depuis GET /coach/athletes/:id/dashboard
// — endpoint dédié, voir CoachTrainingAttendanceService.getAthleteSummary) :
// une erreur ici ne doit jamais casser le reste de la fiche (§57).
function AttendanceSection({ athleteId }: AttendanceSectionProps) {
  const [summary, setSummary] = useState<CoachAttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getCoachAthleteAttendanceSummary(athleteId)
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [athleteId]);

  const { last30Days } = summary ?? {};

  return (
    <section aria-labelledby="attendance-heading">
      <SectionLabel id="attendance-heading">Assiduité</SectionLabel>

      {loading && <LoadingState label="Chargement de l'assiduité..." />}
      {!loading && error && <ErrorState message={error} />}

      {!loading && !error && last30Days && (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ekvara-black/50">30 derniers jours</p>

          {last30Days.recordedSessions === 0 ? (
            <p className="mt-2 text-sm text-ekvara-black/60">Aucune présence enregistrée pour le moment.</p>
          ) : (
            <>
              <p className="mt-1 font-display text-3xl font-extrabold text-ekvara-black">
                {Math.round((last30Days.attendanceRate ?? 0) * 100)}%
              </p>
              <p className="text-sm text-ekvara-black/60">
                {last30Days.present} / {last30Days.recordedSessions} séances
              </p>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-ekvara-black/70">
                <span>Présent {last30Days.present}</span>
                <span>Absent {last30Days.absent}</span>
                <span>Excusé {last30Days.excused}</span>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}

export default AttendanceSection;
