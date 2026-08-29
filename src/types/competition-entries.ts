// Forme exacte de GET /competitions/:competitionId/entries (identique à
// EkvaraFrontend/src/types/competition-entries.ts, même endpoint global
// réutilisé tel quel côté coach — voir services/coach.api.ts). Jamais de
// participant_id/athlete_id ici : ces entries ne sont jamais liées à un
// athlete EKVARA.
export interface CompetitionEntry {
  id: string;
  name: string;
  club: string | null;
  league: string | null;
  country: string | null;
}

export interface CompetitionEntryCategory {
  rawLabel: string;
  ageCategory: string | null;
  gender: 'male' | 'female' | null;
  weightCategory: string | null;
  entries: CompetitionEntry[];
}

export interface CompetitionEntriesResponse {
  competitionId: string;
  categories: CompetitionEntryCategory[];
  totalEntries: number;
}
