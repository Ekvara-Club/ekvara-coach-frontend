import type { HTMLAttributes } from 'react';

// Style déjà établi dans ce repo (SummaryStats.tsx, AthletesLedger.tsx) —
// extrait ici car la fiche athlète (ticket #3) répète le même eyebrow
// PRÉPARATION / POIDS / PROGRESSION / OBJECTIF PRINCIPAL sur une seule page.
function SectionLabel({ className = '', children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={`text-xs font-semibold uppercase tracking-[0.15em] text-ekvara-muted ${className}`} {...props}>
      {children}
    </h2>
  );
}

export default SectionLabel;
