import type { CoachTrainingSummary } from '../../types/coach';
import { formatDayHeader, formatDayLong, isSameLocalDay } from '../../utils/week';
import TrainingRow from './TrainingRow';

interface PlanningTimelineProps {
  days: Date[];
  trainings: CoachTrainingSummary[];
  onOpenDetail: (training: CoachTrainingSummary) => void;
  onRequestCancel: (training: CoachTrainingSummary) => void;
}

function trainingsForDay(trainings: CoachTrainingSummary[], day: Date): CoachTrainingSummary[] {
  return trainings.filter((training) => isSameLocalDay(new Date(training.startAt), day));
}

// Porté depuis WeekTimeline.tsx (EkvaraFrontend, ticket #4 §5) : grille 7
// colonnes reliées sur desktop, timeline verticale sur mobile — jamais une
// grille calendrier dense. Aujourd'hui = seul jour signalé en lime, jamais
// une colonne entière colorée (§27).
function PlanningTimeline({ days, trainings, onOpenDetail, onRequestCancel }: PlanningTimelineProps) {
  return (
    <>
      <div className="hidden md:block">
        <div className="grid grid-cols-7 gap-4">
          {days.map((day) => {
            const isToday = isSameLocalDay(new Date(), day);
            return (
              <div key={day.toISOString()} className="flex flex-col gap-0.5">
                <p
                  className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${
                    isToday ? 'text-ekvara-black' : 'text-ekvara-muted'
                  }`}
                >
                  {isToday && <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-ekvara-lime" aria-hidden="true" />}
                  {formatDayHeader(day)}
                </p>
                {isToday && (
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-ekvara-black/40">Aujourd'hui</p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-3 border-t border-gray-200" aria-hidden="true" />

        <div className="mt-4 grid grid-cols-7 gap-4">
          {days.map((day) => (
            <div key={day.toISOString()} className="flex flex-col gap-3">
              {trainingsForDay(trainings, day).map((training) => (
                <TrainingRow
                  key={training.id}
                  training={training}
                  onOpenDetail={() => onOpenDetail(training)}
                  onRequestCancel={() => onRequestCancel(training)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <ul className="flex flex-col md:hidden">
        {days.map((day, index) => {
          const isToday = isSameLocalDay(new Date(), day);
          const dayTrainings = trainingsForDay(trainings, day);
          const isLast = index === days.length - 1;

          return (
            <li key={day.toISOString()} className="relative pb-6 pl-6 last:pb-0">
              {!isLast && (
                <span className="absolute left-[5px] top-5 h-[calc(100%-1.25rem)] w-px bg-gray-200" aria-hidden="true" />
              )}
              <span
                className={`absolute left-0 top-1 h-2.5 w-2.5 rounded-full ${
                  isToday ? 'bg-ekvara-lime' : 'border border-gray-300 bg-ekvara-surface'
                }`}
                aria-hidden="true"
              />

              <div className="flex items-center gap-2">
                <p className={`text-sm font-semibold ${isToday ? 'text-ekvara-black' : 'text-ekvara-black/80'}`}>
                  {formatDayLong(day)}
                </p>
                {isToday && (
                  <span className="text-xs font-semibold uppercase tracking-wide text-ekvara-muted">Aujourd'hui</span>
                )}
              </div>

              {dayTrainings.length === 0 ? (
                <p className="mt-1 text-sm text-ekvara-muted">&mdash;</p>
              ) : (
                <div className="mt-2 flex flex-col gap-3">
                  {dayTrainings.map((training) => (
                    <TrainingRow
                      key={training.id}
                      training={training}
                      onOpenDetail={() => onOpenDetail(training)}
                      onRequestCancel={() => onRequestCancel(training)}
                    />
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

export default PlanningTimeline;
