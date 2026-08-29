// Types calqués sur les réponses HTTP réelles du backend coach (voir
// src/coach/coach-dashboard.service.ts, coach-groups.service.ts côté
// backend) — pas reconstruits depuis les rapports de ticket uniquement.

export interface AthleteGroupRef {
  id: string;
  name: string;
}

export interface WeightTargetView {
  weight: number;
  targetDate: string | null;
  competitionId: string | null;
}

export interface WeightSummaryView {
  currentWeight: number | null;
  measuredAt: string | null;
  target: WeightTargetView | null;
  differenceToTarget: number | null;
  weeklyChange: number | null;
}

export interface ProgressionView {
  improvedCount: number;
  decliningCount: number;
  unknownCount: number;
  evaluatedCount: number;
  overallStatus: null;
}

export interface NextCompetitionView {
  id: string;
  name: string;
  startDate: string;
  city: string | null;
  country: string | null;
  level: string | null;
  weightCategory: string | null;
  daysUntil: number;
}

export interface NextTrainingView {
  id: string;
  title: string;
  startAt: string;
  endAt: string | null;
  type: string | null;
}

export interface PrimaryGoalView {
  id: string;
  title: string;
  targetDate: string | null;
  daysUntil: number | null;
  progressPercentage: number | null;
  completedSteps: number;
  totalSteps: number;
}

export interface CoachAthleteDashboardSummary {
  id: string;
  firstName: string | null;
  lastName: string | null;
  ageCategory: string | null;
  grade: string | null;
  sportLevel: string | null;
  groups: AthleteGroupRef[];
  weight: WeightSummaryView;
  progression: ProgressionView;
  nextCompetition: NextCompetitionView | null;
  nextTraining: NextTrainingView | null;
  primaryGoal: PrimaryGoalView | null;
}

// Exactement les 5 raisons exposées par le backend (voir
// AttentionReasonType côté CoachDashboardService) — n'en invente jamais une
// nouvelle côté frontend (ticket §19).
export type CoachAttentionReasonType =
  | 'WEIGHT_ABOVE_TARGET'
  | 'WEIGHT_BELOW_TARGET'
  | 'NO_WEIGHT_TARGET'
  | 'METRIC_DECLINING'
  | 'NO_METRIC_DATA';

export interface CoachAttentionReason {
  type: CoachAttentionReasonType;
  value?: number;
}

export interface CoachAthleteNeedingAttention {
  athlete: { id: string; firstName: string | null; lastName: string | null };
  reasons: CoachAttentionReason[];
}

export interface CoachUpcomingCompetition {
  competition: {
    id: string;
    name: string;
    startDate: string;
    city: string | null;
    country: string | null;
    level: string | null;
  };
  athleteCount: number;
  athletes: { id: string; firstName: string | null; lastName: string | null; weightCategory: string | null }[];
}

export interface CoachGroupSummary {
  id: string;
  name: string;
  athleteCount: number;
  upcomingCompetitionCount: number;
  weight: { withTarget: number; aboveTarget: number; belowTarget: number; onTarget: number };
  progression: { improving: number; declining: number; unknown: number };
}

export interface CoachDashboardSummary {
  athleteCount: number;
  groupCount: number;
  athletesWithUpcomingCompetition: number;
  athletesOnTargetWeight: number;
  athletesAboveTargetWeight: number;
  athletesBelowTargetWeight: number;
  athletesWithoutWeightTarget: number;
  athletesImproving: number;
  athletesDeclining: number;
  athletesWithoutRecentMetrics: number;
}

export interface CoachDashboard {
  summary: CoachDashboardSummary;
  groups: CoachGroupSummary[];
  upcomingCompetitions: CoachUpcomingCompetition[];
  athletesNeedingAttention: CoachAthleteNeedingAttention[];
  recentActivity: never[];
}

// Forme de GET /coach/groups (ticket #1 — liste légère, distincte de
// CoachGroupSummary du dashboard qui porte des agrégats poids/progression).
export interface CoachGroupListItem {
  id: string;
  name: string;
  athleteCount: number;
}

// Forme de GET /coach/athletes (voir CoachService.toCoachAthleteSummaryView
// côté backend) — champs bruts prénom/nom, pas les mêmes noms que
// CoachAthleteDashboardSummary (firstName/lastName). Ne contient PAS les
// groupes : la page /athletes les obtient via getCoachDashboardAthletes()
// (ticket #2 §4 — éviter une requête par athlète).
export interface CoachAthleteRosterItem {
  id: string;
  prenom: string | null;
  nom: string | null;
  categorieAge: string | null;
  categoriePoids: string | null;
  grade: string | null;
  niveauSportif: string | null;
}

export interface AddCoachAthleteResult {
  athleteId: string;
}

// Forme d'un membre dans GET /coach/groups/:groupId (voir
// CoachGroupsService.toGroupMemberView) — pas de grade/niveauSportif ici,
// seulement ce que le backend expose réellement pour cette route.
export interface CoachGroupMember {
  id: string;
  prenom: string | null;
  nom: string | null;
  categorieAge: string | null;
  categoriePoids: string | null;
}

// Forme de GET /coach/groups/:groupId (voir CoachGroupsService.getGroupDetail)
// — pas de champ athleteCount séparé, dérivé côté frontend via
// athletes.length (confirmé par lecture directe du service backend).
export interface CoachGroupDetail {
  id: string;
  name: string;
  athletes: CoachGroupMember[];
}

// GET /coach/athletes/:athleteId/dashboard (voir
// CoachDashboardService.getAthleteDashboard -> toAthleteDashboardSummary)
// renvoie EXACTEMENT la même forme qu'un élément de
// GET /coach/dashboard/athletes — confirmé par lecture directe du service,
// jamais un type dupliqué en apparence identique mais divergent en silence.
export type CoachAthleteDetailDashboard = CoachAthleteDashboardSummary;

// Ticket #3 §8-11 : forme de GET /coach/athletes/:athleteId/metrics/overview
// (voir MetricsService.getOverview -> toOverviewEntry). `direction` reste
// `string | null` (pas un union étroit) : improvement_direction est une
// colonne VARCHAR(10) nullable non contrainte par un enum Prisma (voir
// src/metrics/improvement-direction.ts), toute valeur hors "higher"/"lower"
// signifie "direction inconnue".
export type MetricStatus = 'improved' | 'stable' | 'regressed' | 'unknown';

export interface MetricOverviewEntry {
  id: string;
  code: string;
  name: string;
  unit: string | null;
  direction: string | null;
  currentValue: number | null;
  previousValue: number | null;
  delta: number | null;
  percentage: number | null;
  status: MetricStatus;
  measuredAt: string | null;
}

export interface MetricsOverviewResponse {
  metrics: MetricOverviewEntry[];
}

// GET/POST .../metrics/:metricTypeId/measurements (voir
// MetricsService.toMeasurementView).
export interface MetricMeasurement {
  id: string;
  value: number;
  measuredAt: string;
  coachUserId: string | null;
  comment: string | null;
}

// Ticket #3 §12-17 : forme de GET/POST/PATCH .../goals (voir
// GoalsService.toGoalView/toStepView). Champs volontairement en français
// (titre, dateCible, ordre, statut) : ce sont les noms RÉELS renvoyés par le
// backend, pas une traduction — ne jamais les renommer côté frontend, ce
// serait diverger silencieusement du contrat réel.
export type GoalStatus = 'en_cours' | 'atteint' | 'abandonne';

export interface GoalStepView {
  id: string;
  titre: string;
  ordre: number | null;
  completed: boolean | null;
}

export interface GoalProgress {
  completed: number;
  total: number;
  percentage: number | null;
}

export interface Goal {
  id: string;
  type: string | null;
  titre: string;
  description: string | null;
  dateCible: string | null;
  statut: GoalStatus;
  progress: GoalProgress;
  steps: GoalStepView[];
}

// Ticket #4 : forme de GET /coach/trainings (voir CoachTrainingsService.
// toSummaryView). `status` reste `string | null` — statut est un VARCHAR(30)
// nullable en base (default "prevu"), seule la valeur "annule"
// (CANCELLED_TRAINING_STATUS côté backend) a un sens particulier à traiter,
// jamais une liste fermée de statuts inventée côté frontend.
export interface CoachTrainingSummary {
  id: string;
  title: string;
  type: string | null;
  subType: string | null;
  startAt: string;
  endAt: string | null;
  location: string | null;
  level: string | null;
  description: string | null;
  status: string | null;
  athleteCount: number;
}

export interface CoachTrainingAthleteRef {
  id: string;
  firstName: string | null;
  lastName: string | null;
}

export interface CoachTrainingGroupRef {
  id: string;
  name: string;
}

// Forme de GET /coach/trainings/:id (identique après POST/PATCH/PUT
// assignments/DELETE-annulation : les 5 endpoints renvoient tous
// CoachTrainingsService.toDetailView, voir coach-trainings.service.ts).
export interface CoachTrainingDetail {
  id: string;
  title: string;
  type: string | null;
  subType: string | null;
  startAt: string;
  endAt: string | null;
  location: string | null;
  level: string | null;
  description: string | null;
  status: string | null;
  assignments: {
    athleteCount: number;
    athletes: CoachTrainingAthleteRef[];
    groups: CoachTrainingGroupRef[];
  };
}

// Ticket "Présences Coach V1" : statut fermé côté backend (varchar contrôlé,
// jamais accentué) — contrairement à CoachTrainingDetail.status, celui-ci
// est une liste réellement fermée (present/absent/excuse), reprise telle
// quelle du contrat backend (voir training-attendance-status.ts côté API).
export type AttendanceStatus = 'present' | 'absent' | 'excuse';

// Forme de GET /coach/trainings/:id/attendance (voir
// CoachTrainingAttendanceService.getAttendanceSheet). `groupName` = libellé
// snapshotté à la publication (coach_training_assignment.group_id), jamais
// recalculé depuis la composition actuelle du groupe — null si assignation
// individuelle. `attendance` null = non renseigné, JAMAIS confondu avec
// absent (ticket §21, CRITIQUE).
export interface CoachTrainingAttendanceAthlete {
  athleteId: string;
  firstName: string | null;
  lastName: string | null;
  groupName: string | null;
  attendance: { status: AttendanceStatus; note: string | null; recordedAt: string } | null;
}

export interface CoachTrainingAttendanceSheet {
  training: {
    id: string;
    title: string;
    type: string | null;
    startAt: string;
    endAt: string | null;
    status: string | null;
  };
  athletes: CoachTrainingAttendanceAthlete[];
}

// Forme de GET /coach/athletes/:athleteId/attendance/summary (voir
// CoachTrainingAttendanceService.getAthleteSummary). Un seul horizon en V1
// (ticket §27, décision explicite : pas de last90Days/allTime pour l'instant).
// attendanceRate = present / recordedSessions (jamais / eligibleSessions,
// voir ticket §28-29) — null si aucune séance renseignée (jamais 0, qui
// suggérerait à tort "0% de présence").
export interface CoachAttendanceSummary {
  last30Days: {
    eligibleSessions: number;
    recordedSessions: number;
    present: number;
    absent: number;
    excused: number;
    attendanceRate: number | null;
  };
}

// Ticket #5 : forme de GET /coach/exercises (voir CoachExercisesService.
// toLibraryView) — contrairement aux séances, la liste porte déjà
// athleteCount ET groups directement, jamais besoin d'un GET détail par
// ligne (confirmé par lecture directe du service backend).
export interface CoachExerciseAthleteRef {
  id: string;
  firstName: string | null;
  lastName: string | null;
}

export interface CoachExerciseGroupRef {
  id: string;
  name: string;
}

export interface CoachExerciseSummary {
  id: string;
  title: string;
  type: string | null;
  panelTechnique: string | null;
  level: string | null;
  description: string | null;
  videoUrl: string | null;
  athleteCount: number;
  groups: CoachExerciseGroupRef[];
}

// Forme de GET /coach/exercises/:id (identique après POST/PATCH/PUT
// assignments, voir CoachExercisesService.toDetailView) — assignments/groups
// nichés ici, à plat sur le résumé liste : deux formes distinctes, jamais
// unifiées artificiellement.
export interface CoachExerciseDetail {
  id: string;
  title: string;
  type: string | null;
  panelTechnique: string | null;
  level: string | null;
  description: string | null;
  videoUrl: string | null;
  assignments: {
    athleteCount: number;
    athletes: CoachExerciseAthleteRef[];
    groups: CoachExerciseGroupRef[];
  };
}

// Ticket #5 §8 : CreateCoachExerciseDto n'accepte AUCUN champ destinataire
// (confirmé par lecture directe du DTO backend) — création et publication
// sont deux endpoints distincts, jamais mélangés ici.
export interface CreateCoachExerciseInput {
  title: string;
  type?: string;
  panelTechnique?: string;
  level?: string;
  description?: string;
  videoUrl?: string;
}

export interface UpdateCoachExerciseInput {
  title?: string;
  type?: string;
  panelTechnique?: string;
  level?: string;
  description?: string;
  videoUrl?: string;
}

export interface ReplaceCoachExerciseAssignmentsInput {
  groupIds: string[];
  athleteIds: string[];
}

// Ticket #7 (Compétitions Coach V1) — formes de GET /coach/competitions et
// GET /coach/competitions/:competitionId (voir CoachCompetitionsService côté
// backend). result reste TOUJOURS présent (jamais omis conditionnellement) :
// c'est au frontend de décider via hasCompetitionResult/isPodium (voir
// utils/competitionResults.ts) si la compétition est passée sans résultat,
// jamais au backend de le déduire à sa place.
export interface CoachCompetitionRef {
  id: string;
  name: string;
  startDate: string;
  endDate: string | null;
  city: string | null;
  country: string | null;
  level: string | null;
}

export interface CoachCompetitionResultView {
  classement: number | null;
  medaille: string | null;
  victoires: number | null;
  defaites: number | null;
}

// Forme d'un athlète dans GET /coach/competitions (liste groupée) — jamais
// de groupes ici, uniquement présents sur la fiche détail (voir
// CoachCompetitionDetailAthleteView).
export interface CoachCompetitionListAthleteView {
  id: string;
  firstName: string | null;
  lastName: string | null;
  ageCategory: string | null;
  weightCategory: string | null;
  participationStatus: string | null;
  result: CoachCompetitionResultView;
}

export interface CoachCompetitionGroupView {
  competition: CoachCompetitionRef;
  athleteCount: number;
  athletes: CoachCompetitionListAthleteView[];
}

export interface CoachCompetitionsListView {
  upcoming: CoachCompetitionGroupView[];
  past: CoachCompetitionGroupView[];
}

// Ticket "Sélection & préparation compétition Coach V1" — forme d'une
// préparation interne, jamais confondue avec une participation officielle
// (voir CoachCompetitionPreparationsService côté backend). null sur
// CoachCompetitionDetailAthleteView.preparation signifie "aucune préparation
// pour cet athlète sur cette compétition", jamais un objet à champs vides.
export const PREPARATION_STATUSES = ['envisage', 'selectionne', 'pret', 'forfait'] as const;
export type PreparationStatus = (typeof PREPARATION_STATUSES)[number];

export interface CoachCompetitionPreparationSummary {
  id: string;
  status: string;
  targetAgeCategory: string | null;
  targetWeightCategory: string | null;
  objective: string | null;
  coachNote: string | null;
}

// Forme de GET /coach/competitions/:competitionId — même champs que la liste
// + groupes coach par athlète (ticket §9) + statut officiel/préparation
// fusionnés par athlète (ticket §7/§8/§13/§14). Répartition par groupe et par
// catégorie (ticket §10/§13) volontairement absentes de cette forme :
// dérivées côté frontend depuis athletes[], jamais un champ dupliqué renvoyé
// par le backend (voir CoachCompetitionsService, commentaire équivalent).
export interface CoachCompetitionDetailAthleteView extends CoachCompetitionListAthleteView {
  groups: AthleteGroupRef[];
  hasOfficialParticipation: boolean;
  preparation: CoachCompetitionPreparationSummary | null;
}

export interface CoachCompetitionDetailView {
  competition: CoachCompetitionRef;
  athleteCount: number;
  athletes: CoachCompetitionDetailAthleteView[];
}

// Forme de GET /competitions?search= (catalogue global, endpoint public
// réutilisé tel quel — voir services/coach.api.ts searchCompetitions) :
// lignes brutes Prisma aplaties (snake_case), identique à
// CompetitionCatalogItem côté app athlète (EkvaraFrontend).
export interface CompetitionCatalogItem {
  id: string;
  nom: string;
  organisateur: string | null;
  source: string | null;
  source_external_id: string | null;
  date_debut: string;
  date_fin: string | null;
  lieu: string | null;
  ville: string | null;
  pays: string | null;
  niveau: string | null;
  saison: string | null;
}
