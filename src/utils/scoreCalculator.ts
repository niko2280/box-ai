import type { CategoryScores, TrainingStats, PunchEvent } from '../types';

export const calcOverallScore = (scores: CategoryScores): number => {
  const weights = {
    jab: 0.15, cross: 0.15, hook: 0.1, uppercut: 0.1,
    defense: 0.15, footwork: 0.1, stance: 0.1, speed: 0.1, combos: 0.05
  };
  return Math.round(
    Object.entries(weights).reduce((sum, [k, w]) => sum + scores[k as keyof CategoryScores] * w, 0)
  );
};

export const getLetterGrade = (score: number): string => {
  if (score >= 95) return 'S';
  if (score >= 85) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 45) return 'D';
  return 'F';
};

export const getGradeColor = (score: number): string => {
  if (score >= 85) return '#00D9A5';
  if (score >= 70) return '#4CAF50';
  if (score >= 55) return '#FF9800';
  if (score >= 40) return '#FF6B35';
  return '#E94560';
};

export const getWeakPoints = (scores: CategoryScores): string[] => {
  const labels: Record<keyof CategoryScores, string> = {
    jab: 'Джеб', cross: 'Кросс', hook: 'Хук', uppercut: 'Апперкот',
    defense: 'Защита', footwork: 'Футворк', stance: 'Стойка', speed: 'Скорость', combos: 'Комбинации'
  };
  return Object.entries(scores)
    .sort(([, a], [, b]) => a - b)
    .slice(0, 3)
    .map(([k]) => labels[k as keyof CategoryScores]);
};

export const getStrongPoints = (scores: CategoryScores): string[] => {
  const labels: Record<keyof CategoryScores, string> = {
    jab: 'Джеб', cross: 'Кросс', hook: 'Хук', uppercut: 'Апперкот',
    defense: 'Защита', footwork: 'Футворк', stance: 'Стойка', speed: 'Скорость', combos: 'Комбинации'
  };
  return Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([k]) => labels[k as keyof CategoryScores]);
};

export const calcStats = (punchLog: PunchEvent[], duration: number): TrainingStats => {
  const jabCount = punchLog.filter(p => p.type === 'jab').length;
  const crossCount = punchLog.filter(p => p.type === 'cross').length;
  const hookCount = punchLog.filter(p => p.type === 'hook').length;
  const uppercutCount = punchLog.filter(p => p.type === 'uppercut').length;
  const totalPunches = punchLog.length;
  const punchesPerMin = duration > 0 ? Math.round((totalPunches / duration) * 60) : 0;

  // Detect combos (punches within 1.5s of each other)
  let comboCount = 0;
  let currentComboLen = 1;
  let totalComboLen = 0;
  for (let i = 1; i < punchLog.length; i++) {
    if (punchLog[i].timestamp - punchLog[i - 1].timestamp < 1500) {
      currentComboLen++;
    } else {
      if (currentComboLen >= 2) { comboCount++; totalComboLen += currentComboLen; }
      currentComboLen = 1;
    }
  }
  if (currentComboLen >= 2) { comboCount++; totalComboLen += currentComboLen; }

  return {
    totalPunches, punchesPerMin, jabCount, crossCount, hookCount, uppercutCount,
    guardPct: 0, stancePct: 0, comboCount,
    avgComboLen: comboCount > 0 ? totalComboLen / comboCount : 0
  };
};

export const ACHIEVEMENTS = [
  { id: 'first_round', title: 'Первый раунд', description: 'Завершить первую тренировку', icon: '🥊' },
  { id: 'week_streak', title: 'Неделя подряд', description: '7 дней подряд', icon: '🔥' },
  { id: 'sniper', title: 'Снайпер', description: 'Джеб 90+', icon: '🎯' },
  { id: 'wall', title: 'Стена', description: 'Защита 90+', icon: '🛡️' },
  { id: 'dancer', title: 'Танцор', description: 'Футворк 90+', icon: '💃' },
  { id: 'perfection', title: 'Совершенство', description: 'Общая оценка 95+', icon: '⭐' },
  { id: '100_rounds', title: '100 раундов', description: '100 тренировок', icon: '💯' },
  { id: 'machine', title: 'Машина', description: '30 дней streak', icon: '🤖' },
];

export const checkAchievements = (
  sessions: { overallScore: number; scores: CategoryScores }[],
  streak: number,
  totalSessions: number
): string[] => {
  const unlocked: string[] = [];
  if (totalSessions >= 1) unlocked.push('first_round');
  if (streak >= 7) unlocked.push('week_streak');
  if (streak >= 30) unlocked.push('machine');
  if (totalSessions >= 100) unlocked.push('100_rounds');
  const best = sessions[0];
  if (best) {
    if (best.overallScore >= 95) unlocked.push('perfection');
    if (best.scores.jab >= 90) unlocked.push('sniper');
    if (best.scores.defense >= 90) unlocked.push('wall');
    if (best.scores.footwork >= 90) unlocked.push('dancer');
  }
  return unlocked;
};
