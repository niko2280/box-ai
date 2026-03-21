import { useState, useEffect, useCallback } from 'react';
import { getSessions, saveSession, getProfile, saveProfile, updateStreak } from '../utils/storage';
import type { TrainingSession, UserProfile, CategoryScores } from '../types';

const DEFAULT_SCORES: CategoryScores = {
  jab: 0, cross: 0, hook: 0, uppercut: 0,
  defense: 0, footwork: 0, stance: 0, speed: 0, combos: 0
};

export const useTrainingHistory = () => {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [s, p] = await Promise.all([getSessions(), getProfile()]);
      setSessions(s);
      setProfile(p);
    } catch (error) {
      console.error('Failed to load data:', error);
      setProfile({
        level: 'beginner',
        stance: 'orthodox',
        currentPlan: null,
        streak: 0,
        lastTrainingDate: '',
        totalSessions: 0,
        bestScore: 0,
        soundEnabled: true,
        vibrationEnabled: true,
        showSkeleton: true,
        groqModel: 'llama-3.3-70b-versatile',
        onboardingDone: false
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addSession = useCallback(async (session: TrainingSession) => {
    await saveSession(session);
    const p = await getProfile();
    const updated = await updateStreak(p);
    if (session.overallScore > updated.bestScore) updated.bestScore = session.overallScore;
    await saveProfile(updated);
    await load();
  }, [load]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    const p = await getProfile();
    const updated = { ...p, ...updates };
    await saveProfile(updated);
    setProfile(updated);
  }, []);

  const avgScores = (): CategoryScores => {
    if (sessions.length === 0) return DEFAULT_SCORES;
    const sum = sessions.reduce((acc, s) => {
      Object.keys(acc).forEach(k => {
        acc[k as keyof CategoryScores] += s.scores[k as keyof CategoryScores];
      });
      return acc;
    }, { ...DEFAULT_SCORES });
    const keys = Object.keys(sum) as (keyof CategoryScores)[];
    keys.forEach(k => { sum[k] = Math.round(sum[k] / sessions.length); });
    return sum;
  };

  const lastSession = sessions[0] || null;

  return { sessions, profile, loading, addSession, updateProfile, avgScores, lastSession, reload: load };
};
