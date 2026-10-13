import type { CompetitionCatalogItem } from '../../types/coach';
import { handleNavClick } from '../../utils/navigation';

// date_debut est une DATE métier sans heure : parsing date-only, jamais
// new Date(iso) naïf (qui peut décaler le jour selon le fuseau).
function formatShortDate(dateString: string): string {
  const [year, month, day] = dateString.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day)
    .toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
    .replace('.', '')
    .toUpperCase();
}

function capitalizeFirst(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

// Ligne du catalogue global (ticket #24) : même contenu que la ligne
// catalogue de l'app athlète (date, nom, ville/pays, niveau), dans la
// convention de ligne navigable coach (`<a href>` réelle, flèche au survol).
// Aucune donnée d'équipe ici : une compétition du catalogue n'est liée à
// aucun athlète du roster tant que le coach ne l'a pas préparée.
function CatalogCompetitionRow({ competition }: { competition: CompetitionCatalogItem }) {
  const href = `/competitions/${competition.id}`;
  const location = [competition.ville, competition.pays].filter(Boolean).join(', ');

  return (
    <li>
      <a
        href={href}
        onClick={(event) => handleNavClick(event, href)}
        className="group flex items-start gap-4 py-3 transition-colors hover:bg-gray-50"
      >
        <p className="w-14 flex-shrink-0 pt-0.5 font-display text-sm font-bold text-ekvara-black">
          {formatShortDate(competition.date_debut)}
        </p>

        <div className="min-w-0 flex-1">
          <p className="break-words font-medium text-ekvara-black">{competition.nom}</p>
          {location && <p className="mt-0.5 text-sm text-ekvara-black/60">{location}</p>}
        </div>

        <span className="flex flex-shrink-0 items-center gap-2 whitespace-nowrap pt-0.5 text-sm font-semibold text-ekvara-black/80">
          {competition.niveau && capitalizeFirst(competition.niveau)}
          <span
            className="text-ekvara-black/30 transition-transform group-hover:translate-x-0.5 group-hover:text-ekvara-black"
            aria-hidden="true"
          >
            →
          </span>
        </span>
      </a>
    </li>
  );
}

export default CatalogCompetitionRow;
