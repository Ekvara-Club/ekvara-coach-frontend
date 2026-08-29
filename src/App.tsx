import { useEffect, useState } from 'react';
import { CoachAuthProvider, useCoachAuth } from './contexts/CoachAuthContext';
import { navigateTo } from './utils/navigation';
import Header from './components/layout/Header';
import LoginPage from './pages/LoginPage';
import NoCoachAccessPage from './pages/NoCoachAccessPage';
import DashboardPage from './pages/DashboardPage';
import AthletesPage from './pages/AthletesPage';
import AthleteDetailPage from './pages/AthleteDetailPage';
import GroupsPage from './pages/GroupsPage';
import GroupDetailPage from './pages/GroupDetailPage';
import PlanningPage from './pages/PlanningPage';
import ExercisesPage from './pages/ExercisesPage';
import CompetitionsPage from './pages/CompetitionsPage';
import CompetitionDetailPage from './pages/CompetitionDetailPage';

const PUBLIC_PATHS = ['/login'];

function AppRoutes() {
  const [pathname, setPathname] = useState(window.location.pathname);
  const { coach, loading, accessDenied } = useCoachAuth();

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Garde de routes : ni "connecté" ni "accès refusé" -> seul /login est
  // accessible. Un coach valide sur /login est renvoyé vers le dashboard.
  // accessDenied (403 sur /coach/me) n'est PAS traité comme "non connecté" :
  // pas de redirection vers /login (ticket §6), l'écran dédié s'affiche
  // directement plus bas, quelle que soit l'URL.
  useEffect(() => {
    if (loading || accessDenied) return;

    if (!coach && !PUBLIC_PATHS.includes(pathname)) {
      navigateTo('/login', 'replace');
      return;
    }

    if (coach && PUBLIC_PATHS.includes(pathname)) {
      navigateTo('/', 'replace');
    }
  }, [coach, accessDenied, loading, pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ekvara-surface">
        <p className="text-sm text-ekvara-muted">Chargement...</p>
      </div>
    );
  }

  if (accessDenied) {
    return <NoCoachAccessPage />;
  }

  if (!coach) {
    return <LoginPage />;
  }

  const groupDetailMatch = pathname.match(/^\/groups\/([^/]+)$/);
  const athleteDetailMatch = pathname.match(/^\/athletes\/([^/]+)$/);
  const competitionDetailMatch = pathname.match(/^\/competitions\/([^/]+)$/);

  return (
    <div className="min-h-screen bg-ekvara-surface">
      <Header />
      {pathname === '/athletes' ? (
        <AthletesPage />
      ) : athleteDetailMatch ? (
        <AthleteDetailPage athleteId={athleteDetailMatch[1]} />
      ) : pathname === '/groups' ? (
        <GroupsPage />
      ) : groupDetailMatch ? (
        <GroupDetailPage groupId={groupDetailMatch[1]} />
      ) : pathname === '/planning' ? (
        <PlanningPage />
      ) : pathname === '/exercises' ? (
        <ExercisesPage />
      ) : pathname === '/competitions' ? (
        <CompetitionsPage />
      ) : competitionDetailMatch ? (
        <CompetitionDetailPage competitionId={competitionDetailMatch[1]} />
      ) : (
        <DashboardPage />
      )}
    </div>
  );
}

function App() {
  return (
    <CoachAuthProvider>
      <AppRoutes />
    </CoachAuthProvider>
  );
}

export default App;
