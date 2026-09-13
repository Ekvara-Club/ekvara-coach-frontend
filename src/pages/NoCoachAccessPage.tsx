import { useCoachAuth } from '../contexts/CoachAuthContext';
import Button from '../components/ui/Button';

// Session authentifiée (POST /auth/login a réussi) mais sans profil coach
// (403 sur GET /coach/me) — voir ticket §6. Jamais le dashboard dans ce cas.
function NoCoachAccessPage() {
  const { logout } = useCoachAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-ekvara-surface px-4">
      <div className="w-full max-w-sm text-center">
        <p className="font-display text-lg font-bold text-ekvara-black">Accès coach indisponible</p>
        <p className="mt-2 text-sm text-ekvara-black/70">
          Ce compte ne possède pas d'accès coach.
        </p>
        <Button
          variant="secondary"
          className="mt-6"
          onClick={() => {
            logout().catch((error: Error) => console.error('Erreur lors de la déconnexion', error));
          }}
        >
          Se déconnecter
        </Button>
      </div>
    </div>
  );
}

export default NoCoachAccessPage;
