import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { BottomNav, Header } from './components/layout';
import type { Page } from './components/layout';
import { Dashboard } from './pages/Dashboard';
import { Training } from './pages/Training';
import { Progress } from './pages/Progress';
import { Plan } from './pages/Plan';
import { Tips } from './pages/Tips';
import { Settings } from './components/Settings';
import { Onboarding } from './components/Onboarding';
import { useTrainingHistory } from './hooks/useTrainingHistory';
import type { TrainingSession } from './types';

const PAGE_TITLES: Record<Page, string> = {
  dashboard: 'ShadowCoach AI',
  training: 'Тренировка',
  progress: 'Прогресс',
  plan: 'План',
  tips: 'Советы',
};

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { sessions, profile, loading, addSession, updateProfile, avgScores, reload } = useTrainingHistory();

  if (loading) return (
    <div className="fixed inset-0 bg-[#0A0A0F] flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-bounce">🥊</div>
        <p className="text-[#8B8B9E]">Загрузка...</p>
      </div>
    </div>
  );

  if (profile && !profile.onboardingDone) return (
    <Onboarding onComplete={async (updates) => {
      await updateProfile(updates);
      await reload();
    }} />
  );

  const handleSaveSession = async (session: TrainingSession) => {
    await addSession(session);
    setPage('progress');
  };

  const scores = avgScores();

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <Header title={PAGE_TITLES[page]} onSettings={() => setSettingsOpen(true)} />

      <AnimatePresence mode="wait">
        {page === 'dashboard' && (
          <Dashboard
            key="dashboard"
            sessions={sessions}
            profile={profile}
            avgScores={scores}
            onStartTraining={() => setPage('training')}
          />
        )}
        {page === 'training' && (
          <Training
            key="training"
            profile={profile}
            onSave={handleSaveSession}
          />
        )}
        {page === 'progress' && (
          <Progress
            key="progress"
            sessions={sessions}
            profile={profile}
          />
        )}
        {page === 'plan' && (
          <Plan
            key="plan"
            profile={profile}
            avgScores={scores}
            onUpdateProfile={updateProfile}
          />
        )}
        {page === 'tips' && (
          <Tips
            key="tips"
            avgScores={scores}
          />
        )}
      </AnimatePresence>

      <BottomNav current={page} onChange={setPage} />

      <Settings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        profile={profile}
        onUpdate={updateProfile}
        sessions={sessions}
      />
    </div>
  );
}
