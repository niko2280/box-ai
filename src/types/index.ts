export interface CategoryScores {
  jab: number;
  cross: number;
  hook: number;
  uppercut: number;
  defense: number;
  footwork: number;
  stance: number;
  speed: number;
  combos: number;
}

export interface TrainingStats {
  totalPunches: number;
  punchesPerMin: number;
  jabCount: number;
  crossCount: number;
  hookCount: number;
  uppercutCount: number;
  guardPct: number;
  stancePct: number;
  comboCount: number;
  avgComboLen: number;
}

export interface TrainingSession {
  id: string;
  date: string;
  duration: number;
  focus: string;
  overallScore: number;
  scores: CategoryScores;
  stats: TrainingStats;
  weakPoints: string[];
  strongPoints: string[];
  aiReview: string;
  punchLog: PunchEvent[];
}

export interface PunchEvent {
  type: 'jab' | 'cross' | 'hook' | 'uppercut';
  timestamp: number;
  score: number;
}

export interface UserProfile {
  level: 'beginner' | 'amateur' | 'advanced';
  stance: 'orthodox' | 'southpaw';
  currentPlan: WeekPlan | null;
  streak: number;
  lastTrainingDate: string;
  totalSessions: number;
  bestScore: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  showSkeleton: boolean;
  groqModel: string;
  onboardingDone: boolean;
}

export interface DayPlan {
  day: number;
  title: string;
  warmup: string[];
  main: string[];
  shadow_boxing_focus: string;
  drills: string[];
  cooldown: string[];
  duration_minutes: number;
  tips: string;
  completed?: boolean[];
}

export interface WeekPlan {
  week_plan: DayPlan[];
  generatedAt: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export type TrainingFocus = 'free' | 'jab' | 'combos' | 'defense' | 'footwork';
