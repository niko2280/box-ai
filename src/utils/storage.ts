import { openDB } from 'idb';
import type { TrainingSession, UserProfile, WeekPlan } from '../types';

const DB_NAME = 'shadowcoach';
const DB_VERSION = 1;

const getDB = () => openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('sessions')) {
      db.createObjectStore('sessions', { keyPath: 'id' });
    }
    if (!db.objectStoreNames.contains('profile')) {
      db.createObjectStore('profile', { keyPath: 'key' });
    }
  }
});

export const saveSession = async (session: TrainingSession) => {
  const db = await getDB();
  await db.put('sessions', session);
};

export const getSessions = async (): Promise<TrainingSession[]> => {
  const db = await getDB();
  const all = await db.getAll('sessions');
  return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const getSession = async (id: string): Promise<TrainingSession | undefined> => {
  const db = await getDB();
  return db.get('sessions', id);
};

export const deleteSession = async (id: string) => {
  const db = await getDB();
  await db.delete('sessions', id);
};

export const clearAllSessions = async () => {
  const db = await getDB();
  await db.clear('sessions');
};

const DEFAULT_PROFILE: UserProfile = {
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
};

export const getProfile = async (): Promise<UserProfile> => {
  const db = await getDB();
  const stored = await db.get('profile', 'user');
  return stored ? { ...DEFAULT_PROFILE, ...stored.data } : DEFAULT_PROFILE;
};

export const saveProfile = async (profile: UserProfile) => {
  const db = await getDB();
  await db.put('profile', { key: 'user', data: profile });
};

export const savePlan = async (plan: WeekPlan) => {
  const db = await getDB();
  await db.put('profile', { key: 'plan', data: plan });
};

export const getPlan = async (): Promise<WeekPlan | null> => {
  const db = await getDB();
  const stored = await db.get('profile', 'plan');
  return stored ? stored.data : null;
};

export const updateStreak = async (profile: UserProfile): Promise<UserProfile> => {
  const today = new Date().toDateString();
  const last = profile.lastTrainingDate;
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  let streak = profile.streak;
  if (last === today) {
    // already trained today
  } else if (last === yesterday) {
    streak += 1;
  } else {
    streak = 1;
  }

  return { ...profile, streak, lastTrainingDate: today, totalSessions: profile.totalSessions + 1 };
};
