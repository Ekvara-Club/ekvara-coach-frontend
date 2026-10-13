import type { CompetitionCatalogItem } from './coach';

// Catalogue et fiche compétition GLOBAUX (endpoints publics /competitions*,
// JwtAuthGuard seul) : mêmes formes que l'app athlète (EkvaraFrontend,
// types/competition.ts). Jamais scopés sur le roster du coach — la couche
// coach (équipe, préparations) vient de /coach/competitions/:id.

export interface CompetitionSourceRef {
  source: string;
  sourceUrl: string | null;
}

// Jeux de données réellement présents pour cette compétition canonique
// (inscrits publiés ≠ combats).
export interface CompetitionAvailability {
  entryCount: number;
  matchCount: number;
}

// GET /competitions/:competitionId : vue mappée camelCase.
export interface CompetitionDetail {
  id: string;
  nom: string;
  organisateur: string | null;
  source: string | null;
  sourceExternalId: string | null;
  dateDebut: string;
  dateFin: string | null;
  lieu: string | null;
  ville: string | null;
  pays: string | null;
  niveau: string | null;
  saison: string | null;
  sources: CompetitionSourceRef[];
  availability: CompetitionAvailability;
}

// GET /competitions?page=&limit=(&scope=&search=&year=) : forme paginée,
// distincte du tableau brut renvoyé par ?search= seul (searchCompetitions).
export interface PaginatedCompetitions {
  items: CompetitionCatalogItem[];
  total: number;
  page: number;
  limit: number;
}

export type CompetitionCatalogScope = 'upcoming' | 'past';
