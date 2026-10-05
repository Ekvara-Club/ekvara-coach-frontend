import { useCallback, useEffect, useState } from 'react';
import {
  getCoachTrainings,
  getCoachTraining,
  getCoachGroups,
  getCoachDashboardAthletes,
  getCoachAthletes,
} from '../services/coach.api';
import type {
  AthleteGroupRef,
  CoachAthleteRosterItem,
  CoachGroupListItem,
  CoachTrainingDetail,
  CoachTrainingSummary,
} from '../types/coach';
import { addWeeks, getDaysOfWeek, getWeekRange, isCurrentWeek } from '../utils/week';
import { LoadingState, ErrorState } from '../components/ui/PageState';
import Button from '../components/ui/Button';
import SectionLabel from '../components/ui/SectionLabel';
import WeekControl from '../components/planning/WeekControl';
import PlanningTimeline from '../components/planning/PlanningTimeline';
import TrainingFormModal from '../components/planning/TrainingFormModal';
import TrainingDetailModal from '../components/planning/TrainingDetailModal';
import AssignmentsModal from '../components/planning/AssignmentsModal';
import CancelTrainingModal from '../components/planning/CancelTrainingModal';
import CancelSeriesModal from '../components/planning/CancelSeriesModal';
import AttendanceModal from '../components/planning/AttendanceModal';
import Modal from '../components/ui/Modal';

type DetailView = 'view' | 'edit-content' | 'edit-assignments' | 'attendance';

// Ticket #4 §5-6/§19 : une seule vue, pilotée par la semaine sélectionnée —
// naviguer vers une semaine passée montre des séances passées, vers une
// semaine future montre des séances à venir. Pas de deuxième liste "à venir"
// parallèle et sans bornes : ça duplicierait l'affichage et chargerait
// potentiellement tout l'historique (explicitement à éviter, §6).
function PlanningPage() {
  const [anchorDate, setAnchorDate] = useState(new Date());
  const { monday, sunday } = getWeekRange(anchorDate);
  const days = getDaysOfWeek(monday);

  const [trainings, setTrainings] = useState<CoachTrainingSummary[] | null>(null);
  const [trainingsLoading, setTrainingsLoading] = useState(true);
  const [trainingsError, setTrainingsError] = useState<string | null>(null);

  const [groups, setGroups] = useState<CoachGroupListItem[]>([]);
  const [roster, setRoster] = useState<CoachAthleteRosterItem[]>([]);
  const [membershipMap, setMembershipMap] = useState<Map<string, Set<string>>>(new Map());
  const [refDataLoading, setRefDataLoading] = useState(true);
  const [refDataError, setRefDataError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);

  const [detailTrainingId, setDetailTrainingId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<CoachTrainingDetail | null>(null);
  const [detailView, setDetailView] = useState<DetailView>('view');
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  // Incrémenté après un enregistrement de présences réussi : force
  // TrainingDetailModal à refaire son fetch léger du compteur "X / Y
  // renseignées" (son useEffect ne dépend pas de training.id seul, qui ne
  // change jamais au retour depuis AttendanceModal).
  const [attendanceRefreshKey, setAttendanceRefreshKey] = useState(0);

  const [cancelTarget, setCancelTarget] = useState<{ id: string; title: string } | null>(null);
  const [seriesCancelTarget, setSeriesCancelTarget] = useState<{ seriesId: string; title: string } | null>(null);

  const loadTrainings = useCallback(() => {
    setTrainingsLoading(true);
    setTrainingsError(null);
    return getCoachTrainings({ from: monday, to: sunday })
      .then(setTrainings)
      .catch((err: Error) => setTrainingsError(err.message))
      .finally(() => setTrainingsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monday.getTime(), sunday.getTime()]);

  useEffect(() => {
    loadTrainings();
  }, [loadTrainings]);

  // Ticket #4 §20-21 : GET /coach/dashboard/athletes est déjà chargé pour
  // construire le mapping groupe -> membres (chaque athlète y porte ses
  // groupes, voir ticket #2 §4) — jamais un GET group detail par groupe.
  useEffect(() => {
    let cancelled = false;
    setRefDataLoading(true);
    setRefDataError(null);

    Promise.all([getCoachGroups(), getCoachDashboardAthletes(), getCoachAthletes()])
      .then(([groupsData, dashboardAthletes, rosterData]) => {
        if (cancelled) return;
        setGroups(groupsData);
        setRoster(rosterData);
        const map = new Map<string, Set<string>>();
        for (const athlete of dashboardAthletes) {
          for (const group of athlete.groups as AthleteGroupRef[]) {
            if (!map.has(group.id)) map.set(group.id, new Set());
            map.get(group.id)!.add(athlete.id);
          }
        }
        setMembershipMap(map);
      })
      .catch((err: Error) => {
        if (!cancelled) setRefDataError(err.message);
      })
      .finally(() => {
        if (!cancelled) setRefDataLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function openDetail(training: CoachTrainingSummary) {
    setDetailError(null);
    setDetailLoading(true);
    setDetailView('view');
    setDetailTrainingId(training.id);
    getCoachTraining(training.id)
      .then(setDetailData)
      .catch((err: Error) => setDetailError(err.message))
      .finally(() => setDetailLoading(false));
  }

  function closeDetail() {
    setDetailTrainingId(null);
    setDetailData(null);
    setDetailView('view');
    setDetailError(null);
  }

  function afterMutation() {
    closeDetail();
    setCancelTarget(null);
    setSeriesCancelTarget(null);
    loadTrainings();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-ekvara-black sm:text-3xl">
            Planning
          </h1>
          <p className="mt-1 text-sm text-ekvara-black/60">Organise les séances de tes groupes.</p>
        </div>
        <Button variant="primary" onClick={() => setCreateOpen(true)} disabled={refDataLoading}>
          + Nouvelle séance
        </Button>
      </div>

      <div className="mt-6">
        <WeekControl
          monday={monday}
          sunday={sunday}
          onPrevious={() => setAnchorDate((current) => addWeeks(current, -1))}
          onNext={() => setAnchorDate((current) => addWeeks(current, 1))}
          onToday={() => setAnchorDate(new Date())}
        />
      </div>

      <div className="mt-6">
        <SectionLabel>{isCurrentWeek(monday) ? 'Cette semaine' : 'Semaine sélectionnée'}</SectionLabel>
      </div>

      <div className="mt-4">
        {trainingsError && <ErrorState message={trainingsError} />}
        {!trainingsError && trainingsLoading && <LoadingState />}
        {!trainingsError && !trainingsLoading && trainings && (
          <PlanningTimeline
            days={days}
            trainings={trainings}
            onOpenDetail={openDetail}
            onRequestCancel={(training) => setCancelTarget({ id: training.id, title: training.title })}
          />
        )}
      </div>

      {refDataError && <p className="mt-4 text-sm text-red-600">{refDataError}</p>}

      {createOpen && !refDataLoading && (
        <TrainingFormModal
          mode="create"
          groups={groups}
          roster={roster}
          membershipMap={membershipMap}
          onClose={() => setCreateOpen(false)}
          onSaved={() => {
            setCreateOpen(false);
            loadTrainings();
          }}
        />
      )}

      {detailTrainingId && detailLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ekvara-black/60">
          <p className="rounded-md bg-ekvara-surface px-4 py-3 text-sm text-ekvara-black/70">Chargement...</p>
        </div>
      )}

      {detailTrainingId && !detailLoading && detailError && (
        <Modal title="Séance" onClose={closeDetail}>
          <div className="p-5">
            <ErrorState message={detailError} />
          </div>
        </Modal>
      )}

      {detailData && detailView === 'view' && (
        <TrainingDetailModal
          key={attendanceRefreshKey}
          training={detailData}
          onClose={closeDetail}
          onEditContent={() => setDetailView('edit-content')}
          onEditAssignments={() => setDetailView('edit-assignments')}
          onManageAttendance={() => setDetailView('attendance')}
          onCancelTraining={() => {
            const target = { id: detailData.id, title: detailData.title };
            closeDetail();
            setCancelTarget(target);
          }}
          onCancelSeries={
            detailData.seriesId
              ? () => {
                  const target = { seriesId: detailData.seriesId!, title: detailData.title };
                  closeDetail();
                  setSeriesCancelTarget(target);
                }
              : undefined
          }
        />
      )}

      {detailData && detailView === 'attendance' && (
        <AttendanceModal
          training={detailData}
          onClose={() => setDetailView('view')}
          onSaved={() => {
            setAttendanceRefreshKey((key) => key + 1);
            setDetailView('view');
          }}
        />
      )}

      {detailData && detailView === 'edit-content' && (
        <TrainingFormModal
          mode="edit"
          training={detailData}
          groups={groups}
          roster={roster}
          membershipMap={membershipMap}
          onClose={closeDetail}
          onSaved={afterMutation}
        />
      )}

      {detailData && detailView === 'edit-assignments' && (
        <AssignmentsModal
          training={detailData}
          groups={groups}
          roster={roster}
          membershipMap={membershipMap}
          onClose={closeDetail}
          onSaved={afterMutation}
        />
      )}

      {cancelTarget && (
        <CancelTrainingModal
          trainingId={cancelTarget.id}
          trainingTitle={cancelTarget.title}
          onClose={() => setCancelTarget(null)}
          onCancelled={afterMutation}
        />
      )}

      {seriesCancelTarget && (
        <CancelSeriesModal
          seriesId={seriesCancelTarget.seriesId}
          trainingTitle={seriesCancelTarget.title}
          onClose={() => setSeriesCancelTarget(null)}
          onCancelled={afterMutation}
        />
      )}
    </div>
  );
}

export default PlanningPage;
