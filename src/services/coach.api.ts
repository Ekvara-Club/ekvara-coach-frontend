import type {
  AddCoachAthleteResult,
  AttendanceStatus,
  CoachAthleteDashboardSummary,
  CoachAthleteDetailDashboard,
  CoachAthleteRosterItem,
  CoachAttendanceSummary,
  CoachCompetitionDetailView,
  CoachCompetitionPreparationSummary,
  CoachCompetitionsListView,
  CoachDashboard,
  CompetitionCatalogItem,
  CoachExerciseDetail,
  CoachExerciseSummary,
  CoachGroupDashboard,
  CoachGroupDetail,
  CoachGroupListItem,
  CoachTrainingAttendanceSheet,
  CoachTrainingDetail,
  CoachTrainingSummary,
  CreateCoachExerciseInput,
  Goal,
  GoalStatus,
  GoalStepView,
  MetricMeasurement,
  MetricsOverviewResponse,
  ReplaceCoachExerciseAssignmentsInput,
  UpdateCoachExerciseInput,
} from '../types/coach';
import type { CompetitionEntriesResponse } from '../types/competition-entries';
import { notifyUnauthorized } from './session';

const API_URL = import.meta.env.VITE_API_URL;

// Le statut HTTP est conservé (pas seulement le message texte) : permet aux
// appelants (ex. AddAthleteModal) de mapper vers un wording propre par code,
// plutôt que de dépendre du texte exact renvoyé par le backend (ticket #2 §8
// — ne jamais afficher un message backend brut tel quel).
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (typeof body?.message === 'string') return body.message;
  } catch {
    // corps non-JSON ou vide.
  }
  return `Une erreur est survenue (${response.status})`;
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { credentials: 'include', ...init });
  if (response.status === 401) {
    notifyUnauthorized();
  }
  if (!response.ok) {
    throw new ApiError(await extractErrorMessage(response), response.status);
  }
  // Les routes de membership (POST/DELETE .../athletes/:athleteId) renvoient
  // un corps vide sans forcément passer par 204 — POST reste au défaut
  // Nest 201 alors que le service ne renvoie rien (voir
  // CoachGroupsController.addAthlete, aucun @HttpCode) : se fier au corps
  // réellement reçu plutôt qu'au seul statut évite un
  // "Unexpected end of JSON input" sur response.json().
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

function jsonInit(method: string, body: unknown): RequestInit {
  return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

export async function getCoachDashboard(): Promise<CoachDashboard> {
  return apiRequest('/coach/dashboard');
}

export async function getCoachDashboardAthletes(groupId?: string): Promise<CoachAthleteDashboardSummary[]> {
  const query = groupId ? `?groupId=${encodeURIComponent(groupId)}` : '';
  return apiRequest(`/coach/dashboard/athletes${query}`);
}

export async function getCoachAthletes(): Promise<CoachAthleteRosterItem[]> {
  return apiRequest('/coach/athletes');
}

export async function addCoachAthlete(email: string): Promise<AddCoachAthleteResult> {
  return apiRequest('/coach/athletes', jsonInit('POST', { email }));
}

export async function removeCoachAthlete(athleteId: string): Promise<void> {
  return apiRequest(`/coach/athletes/${athleteId}`, { method: 'DELETE' });
}

export async function getCoachGroups(): Promise<CoachGroupListItem[]> {
  return apiRequest('/coach/groups');
}

export async function createCoachGroup(name: string): Promise<CoachGroupListItem> {
  return apiRequest('/coach/groups', jsonInit('POST', { name }));
}

export async function getCoachGroupDetail(groupId: string): Promise<CoachGroupDetail> {
  return apiRequest(`/coach/groups/${groupId}`);
}

export async function renameCoachGroup(groupId: string, name: string): Promise<CoachGroupListItem> {
  return apiRequest(`/coach/groups/${groupId}`, jsonInit('PATCH', { name }));
}

export async function deleteCoachGroup(groupId: string): Promise<void> {
  return apiRequest(`/coach/groups/${groupId}`, { method: 'DELETE' });
}

export async function addAthleteToGroup(groupId: string, athleteId: string): Promise<void> {
  return apiRequest(`/coach/groups/${groupId}/athletes/${athleteId}`, { method: 'POST' });
}

export async function removeAthleteFromGroup(groupId: string, athleteId: string): Promise<void> {
  return apiRequest(`/coach/groups/${groupId}/athletes/${athleteId}`, { method: 'DELETE' });
}

export async function getCoachGroupDashboard(groupId: string): Promise<CoachGroupDashboard> {
  return apiRequest(`/coach/groups/${groupId}/dashboard`);
}

// Ticket #3 §3 : source primaire de la fiche athlète (identité, groupes,
// poids, progression agrégée, préparation, objectif principal résumé) — un
// seul appel couvre tout sauf le détail des métriques et des objectifs
// (steps), volontairement absents de cet agrégat (voir CoachDashboardService.
// toAthleteDashboardSummary). GET /coach/athletes/:athleteId (brut) et
// GET /coach/athletes/:athleteId/weight ne sont donc jamais appelés ici :
// le premier n'apporte rien de plus (et expose email/club inutiles), le
// second est un doublon exact de `dashboard.weight`.
export async function getCoachAthleteDashboard(athleteId: string): Promise<CoachAthleteDetailDashboard> {
  return apiRequest(`/coach/athletes/${athleteId}/dashboard`);
}

export async function createCoachWeightTarget(
  athleteId: string,
  payload: { weight: number; targetDate?: string },
): Promise<void> {
  return apiRequest(`/coach/athletes/${athleteId}/weight-targets`, jsonInit('POST', payload));
}

export async function getCoachAthleteMetricsOverview(athleteId: string): Promise<MetricsOverviewResponse> {
  return apiRequest(`/coach/athletes/${athleteId}/metrics/overview`);
}

export async function getCoachAthleteMetricMeasurements(
  athleteId: string,
  metricTypeId: string,
): Promise<MetricMeasurement[]> {
  return apiRequest(`/coach/athletes/${athleteId}/metrics/${metricTypeId}/measurements`);
}

export async function createCoachAthleteMeasurement(
  athleteId: string,
  metricTypeId: string,
  payload: { value: number; measuredAt?: string; comment?: string },
): Promise<MetricMeasurement> {
  return apiRequest(`/coach/athletes/${athleteId}/metrics/${metricTypeId}/measurements`, jsonInit('POST', payload));
}

export async function getCoachAthleteGoals(athleteId: string): Promise<Goal[]> {
  return apiRequest(`/coach/athletes/${athleteId}/goals`);
}

export async function createCoachGoal(
  athleteId: string,
  payload: { titre: string; type?: string; description?: string; dateCible?: string },
): Promise<Goal> {
  return apiRequest(`/coach/athletes/${athleteId}/goals`, jsonInit('POST', payload));
}

export async function updateCoachGoalStatus(
  athleteId: string,
  goalId: string,
  statut: GoalStatus,
): Promise<Goal> {
  return apiRequest(`/coach/athletes/${athleteId}/goals/${goalId}`, jsonInit('PATCH', { statut }));
}

export async function addCoachGoalStep(
  athleteId: string,
  goalId: string,
  payload: { titre: string; ordre?: number },
): Promise<GoalStepView> {
  return apiRequest(`/coach/athletes/${athleteId}/goals/${goalId}/steps`, jsonInit('POST', payload));
}

export async function updateCoachGoalStep(
  athleteId: string,
  goalId: string,
  stepId: string,
  completed: boolean,
): Promise<GoalStepView> {
  return apiRequest(
    `/coach/athletes/${athleteId}/goals/${goalId}/steps/${stepId}`,
    jsonInit('PATCH', { completed }),
  );
}

export interface CoachTrainingContentPayload {
  title?: string;
  type?: string;
  subType?: string;
  startAt?: string;
  endAt?: string;
  location?: string;
  level?: string;
  description?: string;
}

export interface CoachTrainingAssignmentsPayload {
  groupIds: string[];
  athleteIds: string[];
}

// Ticket #4 §6 : from/to réellement supportés par le backend (voir
// CoachTrainingsController.parseRange) — les deux doivent être fournis
// ensemble ou omis ensemble, jamais l'un sans l'autre.
export async function getCoachTrainings(range?: { from: Date; to: Date }): Promise<CoachTrainingSummary[]> {
  const query = range
    ? `?${new URLSearchParams({ from: range.from.toISOString(), to: range.to.toISOString() }).toString()}`
    : '';
  return apiRequest(`/coach/trainings${query}`);
}

export async function getCoachTraining(trainingId: string): Promise<CoachTrainingDetail> {
  return apiRequest(`/coach/trainings/${trainingId}`);
}

export async function createCoachTraining(
  payload: CoachTrainingContentPayload & { title: string; startAt: string; groupIds?: string[]; athleteIds?: string[] },
): Promise<CoachTrainingDetail> {
  return apiRequest('/coach/trainings', jsonInit('POST', payload));
}

export async function updateCoachTraining(
  trainingId: string,
  payload: CoachTrainingContentPayload,
): Promise<CoachTrainingDetail> {
  return apiRequest(`/coach/trainings/${trainingId}`, jsonInit('PATCH', payload));
}

export async function replaceCoachTrainingAssignments(
  trainingId: string,
  payload: CoachTrainingAssignmentsPayload,
): Promise<CoachTrainingDetail> {
  return apiRequest(`/coach/trainings/${trainingId}/assignments`, jsonInit('PUT', payload));
}

// Annulation douce (voir CoachTrainingsController.cancel) : renvoie 200 avec
// le detail view à jour, jamais 204 — apiRequest gère déjà les deux cas
// via response.text() (voir plus haut, ticket #2 §fix).
export async function cancelCoachTraining(trainingId: string): Promise<CoachTrainingDetail> {
  return apiRequest(`/coach/trainings/${trainingId}`, { method: 'DELETE' });
}

export interface PutAttendancePayload {
  attendances: { athleteId: string; status: AttendanceStatus; note?: string }[];
}

export async function getCoachTrainingAttendance(trainingId: string): Promise<CoachTrainingAttendanceSheet> {
  return apiRequest(`/coach/trainings/${trainingId}/attendance`);
}

// Batch (ticket §11 : une feuille de présence = une action collective,
// jamais 1 requête par athlète) — liste complète du roster de la séance
// (ticket §12, décision V1), pas un delta. 409 si la séance est annulée ou
// pas encore commencée (voir CoachTrainingAttendanceService.putAttendance) :
// l'appelant (AttendanceModal) doit garder la modal ouverte sur erreur.
export async function putCoachTrainingAttendance(
  trainingId: string,
  payload: PutAttendancePayload,
): Promise<CoachTrainingAttendanceSheet> {
  return apiRequest(`/coach/trainings/${trainingId}/attendance`, jsonInit('PUT', payload));
}

export async function getCoachAthleteAttendanceSummary(athleteId: string): Promise<CoachAttendanceSummary> {
  return apiRequest(`/coach/athletes/${athleteId}/attendance/summary`);
}

export async function getCoachExercises(): Promise<CoachExerciseSummary[]> {
  return apiRequest('/coach/exercises');
}

export async function getCoachExercise(exerciseId: string): Promise<CoachExerciseDetail> {
  return apiRequest(`/coach/exercises/${exerciseId}`);
}

export async function createCoachExercise(payload: CreateCoachExerciseInput): Promise<CoachExerciseDetail> {
  return apiRequest('/coach/exercises', jsonInit('POST', payload));
}

export async function updateCoachExercise(
  exerciseId: string,
  payload: UpdateCoachExerciseInput,
): Promise<CoachExerciseDetail> {
  return apiRequest(`/coach/exercises/${exerciseId}`, jsonInit('PATCH', payload));
}

export async function replaceCoachExerciseAssignments(
  exerciseId: string,
  payload: ReplaceCoachExerciseAssignmentsInput,
): Promise<CoachExerciseDetail> {
  return apiRequest(`/coach/exercises/${exerciseId}/assignments`, jsonInit('PUT', payload));
}

// Suppression physique (voir CoachExercisesController.remove, 204) —
// contrairement à cancelCoachTraining, aucun corps à parser : apiRequest
// gère déjà ce cas via response.text().
export async function deleteCoachExercise(exerciseId: string): Promise<void> {
  return apiRequest(`/coach/exercises/${exerciseId}`, { method: 'DELETE' });
}

export async function getCoachCompetitions(): Promise<CoachCompetitionsListView> {
  return apiRequest('/coach/competitions');
}

export async function getCoachCompetitionDetail(competitionId: string): Promise<CoachCompetitionDetailView> {
  return apiRequest(`/coach/competitions/${competitionId}`);
}

// GET /competitions/:competitionId/entries — PAS un endpoint /coach/... :
// c'est l'endpoint global déjà utilisé par l'app athlète (JwtAuthGuard
// uniquement, confirmé côté backend), volontairement réutilisé tel quel
// plutôt que dupliqué sous /coach — aucune protection supplémentaire n'est
// réellement nécessaire ici (données publiques d'inscription, jamais liées
// à un athlete EKVARA ni à des données de coaching privées), voir rapport
// final pour la justification complète de ce choix.
export async function getCompetitionEntries(competitionId: string): Promise<CompetitionEntriesResponse> {
  return apiRequest(`/competitions/${competitionId}/entries`);
}

// GET /competitions?search= — même endpoint global que getCompetitionEntries
// ci-dessus, jamais un second catalogue Coach (ticket "Sélection &
// préparation V1" §22/§23) : le coach choisit toujours un competition.id
// canonique existant.
export async function searchCompetitions(search: string): Promise<CompetitionCatalogItem[]> {
  return apiRequest(`/competitions?search=${encodeURIComponent(search)}`);
}

export interface CreateCoachCompetitionPreparationPayload {
  athleteId: string;
  status?: string;
  targetAgeCategory?: string;
  targetWeightCategory?: string;
  objective?: string;
  coachNote?: string;
}

export interface UpdateCoachCompetitionPreparationPayload {
  status?: string;
  targetAgeCategory?: string;
  targetWeightCategory?: string;
  objective?: string;
  coachNote?: string;
}

export async function createCoachCompetitionPreparation(
  competitionId: string,
  payload: CreateCoachCompetitionPreparationPayload,
): Promise<CoachCompetitionPreparationSummary> {
  return apiRequest(`/coach/competitions/${competitionId}/preparations`, jsonInit('POST', payload));
}

export async function updateCoachCompetitionPreparation(
  competitionId: string,
  preparationId: string,
  payload: UpdateCoachCompetitionPreparationPayload,
): Promise<CoachCompetitionPreparationSummary> {
  return apiRequest(`/coach/competitions/${competitionId}/preparations/${preparationId}`, jsonInit('PATCH', payload));
}

// Suppression physique (voir CoachCompetitionPreparationsController.remove,
// 204) : "Retirer de la préparation" — ne touche jamais la participation
// officielle (ticket §15, CRITIQUE).
export async function deleteCoachCompetitionPreparation(competitionId: string, preparationId: string): Promise<void> {
  return apiRequest(`/coach/competitions/${competitionId}/preparations/${preparationId}`, { method: 'DELETE' });
}
