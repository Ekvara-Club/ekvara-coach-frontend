// États chargement/erreur minimaux, réutilisés par toutes les pages
// métier — jamais un gros spinner plein écran (ticket §26), une simple
// ligne de texte dans le flux de la page.
export function LoadingState({ label = 'Chargement...' }: { label?: string }) {
  return <p className="py-8 text-sm text-ekvara-black/50">{label}</p>;
}

export function ErrorState({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </p>
  );
}
