import { useState, type FormEvent } from 'react';
import { useCoachAuth } from '../contexts/CoachAuthContext';
import Button from '../components/ui/Button';

function LoginPage() {
  const { login, sessionNotice } = useCoachAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ email, password });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connexion impossible.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ekvara-surface px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center leading-none">
          <span className="font-display text-2xl font-extrabold tracking-tight text-ekvara-black">
            EKVARA
          </span>
          <span className="mt-1 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-ekvara-muted">
            Coach
          </span>
        </div>

        {/* Session perdue (expirée, remplacée) : on l'explique ici au lieu de
            laisser l'utilisateur deviner pourquoi il est déconnecté. */}
        {sessionNotice && (
          <p role="status" className="mb-4 rounded-md bg-ekvara-black/5 px-3 py-2 text-sm text-ekvara-black">
            {sessionNotice}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ekvara-black">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-md border border-ekvara-black/15 bg-ekvara-surface px-3 py-2.5 text-sm text-ekvara-black outline-none focus:border-ekvara-black/40"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ekvara-black">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-md border border-ekvara-black/15 bg-ekvara-surface px-3 py-2.5 text-sm text-ekvara-black outline-none focus:border-ekvara-black/40"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <Button type="submit" variant="primary" disabled={submitting} className="w-full">
            {submitting ? 'Connexion...' : 'Se connecter'}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
