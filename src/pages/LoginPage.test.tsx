import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoginPage from './LoginPage';

const auth = vi.hoisted(() => ({ value: { login: vi.fn(), sessionNotice: null as string | null } }));

vi.mock('../contexts/CoachAuthContext', () => ({ useCoachAuth: () => auth.value }));

afterEach(() => {
  auth.value = { login: vi.fn(), sessionNotice: null };
});

describe('Coach LoginPage', () => {
  it('sans perte de session : aucun message', () => {
    render(<LoginPage />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('session perdue : explique pourquoi l\'utilisateur est ici', () => {
    auth.value = { login: vi.fn(), sessionNotice: 'Ta session a expiré. Reconnecte-toi pour continuer.' };

    render(<LoginPage />);

    expect(screen.getByRole('status')).toHaveTextContent('Ta session a expiré');
  });
});
