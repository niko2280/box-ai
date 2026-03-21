import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy, Zap, ChevronRight } from 'lucide-react';
import { Card, CircularProgress, ProgressBar, Button } from '../components/ui';
import { PageWrapper } from '../components/layout';
import { getDailyQuote } from '../api/groq';
import { getLetterGrade, getGradeColor, ACHIEVEMENTS, checkAchievements } from '../utils/scoreCalculator';
import type { TrainingSession, UserProfile, CategoryScores } from '../types';

interface Props {
  sessions: TrainingSession[];
  profile: UserProfile | null;
  avgScores: CategoryScores;
  onStartTraining: () => void;
}

const SCORE_ITEMS = [
  { key: 'jab', label: 'Джеб', icon: '🥊' },
  { key: 'cross', label: 'Кросс', icon: '💥' },
  { key: 'hook', label: 'Хук', icon: '🔄' },
  { key: 'uppercut', label: 'Апперкот', icon: '⬆️' },
  { key: 'defense', label: 'Защита', icon: '🛡️' },
  { key: 'footwork', label: 'Футворк', icon: '👣' },
  { key: 'stance', label: 'Стойка', icon: '🧍' },
  { key: 'speed', label: 'Скорость', icon: '⚡' },
  { key: 'combos', label: 'Комбо', icon: '🔗' },
] as const;

const overall = (s: CategoryScores) => Math.round(
  (s.jab * 0.15 + s.cross * 0.15 + s.hook * 0.1 + s.uppercut * 0.1 +
    s.defense * 0.15 + s.footwork * 0.1 + s.stance * 0.1 + s.speed * 0.1 + s.combos * 0.05)
);

export const Dashboard: React.FC<Props> = ({ sessions, profile, avgScores, onStartTraining }) => {
  const [quote, setQuote] = useState('Каждый удар — шаг к совершенству. Тренируйся сегодня.');
  const [quoteLoading, setQuoteLoading] = useState(false);
  const last = sessions[0];
  const overallScore = overall(avgScores);
  const grade = getLetterGrade(overallScore);
  const unlockedIds = profile ? checkAchievements(sessions, profile.streak, profile.totalSessions) : [];

  useEffect(() => {
    const cached = sessionStorage.getItem('daily_quote');
    if (cached) { setQuote(cached); return; }
    setQuoteLoading(true);
    getDailyQuote()
      .then(q => { setQuote(q); sessionStorage.setItem('daily_quote', q); })
      .catch(() => {})
      .finally(() => setQuoteLoading(false));
  }, []);

  const today = new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <PageWrapper>
      {/* Header */}
      <div className="py-4">
        <p className="text-[#8B8B9E] text-sm capitalize">{today}</p>
        <h1 className="text-2xl font-bold mt-1">Привет, Боец 🥊</h1>
      </div>

      {/* Overall Score */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="mb-4 bg-gradient-to-br from-[#1A1A2E] to-[#16213E]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#8B8B9E] text-sm mb-1">Общий рейтинг бойца</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black">{overallScore}</span>
                <span className="text-2xl font-bold" style={{ color: getGradeColor(overallScore) }}>{grade}</span>
              </div>
              <p className="text-[#8B8B9E] text-xs mt-1">{sessions.length} тренировок</p>
            </div>
            <CircularProgress value={overallScore} size={100} sublabel={grade} />
          </div>
        </Card>
      </motion.div>

      {/* Score Grid */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <h2 className="text-sm font-semibold text-[#8B8B9E] uppercase tracking-wider mb-3">Навыки</h2>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {SCORE_ITEMS.map(({ key, label, icon }) => {
            const val = avgScores[key];
            return (
              <Card key={key} className="text-center py-3">
                <div className="text-xl mb-1">{icon}</div>
                <div className="text-lg font-bold" style={{ color: getGradeColor(val) }}>{val}</div>
                <div className="text-[10px] text-[#8B8B9E]">{label}</div>
                <div className="mt-2"><ProgressBar value={val} height={3} animated={false} /></div>
              </Card>
            );
          })}
        </div>
      </motion.div>

      {/* Start Button */}
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
        <Button
          onClick={onStartTraining}
          size="lg"
          className="w-full mb-4 pulse-glow text-xl font-black tracking-wide"
        >
          🥊 НАЧАТЬ ТРЕНИРОВКУ
        </Button>
      </motion.div>

      {/* Streak + Last Session */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card className="text-center">
          <Flame size={24} className="mx-auto mb-1" style={{ color: '#FF6B35' }} />
          <div className="text-2xl font-black">{profile?.streak ?? 0}</div>
          <div className="text-xs text-[#8B8B9E]">дней подряд</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-1">
            <Trophy size={16} style={{ color: '#E94560' }} />
            <span className="text-xs text-[#8B8B9E]">Лучший результат</span>
          </div>
          <div className="text-2xl font-black">{profile?.bestScore ?? 0}</div>
          <div className="text-xs text-[#8B8B9E]">из 100</div>
        </Card>
      </div>

      {/* Last Session */}
      {last && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
          <Card className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">Последняя тренировка</span>
              <span className="text-xs text-[#8B8B9E]">{new Date(last.date).toLocaleDateString('ru-RU')}</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-black" style={{ color: getGradeColor(last.overallScore) }}>
                  {last.overallScore} <span className="text-base">{getLetterGrade(last.overallScore)}</span>
                </div>
                <div className="text-xs text-[#8B8B9E]">{last.duration}с · {last.stats.totalPunches} ударов</div>
              </div>
              <ChevronRight size={20} className="text-[#8B8B9E]" />
            </div>
          </Card>
        </motion.div>
      )}

      {/* Achievements */}
      {unlockedIds.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <h2 className="text-sm font-semibold text-[#8B8B9E] uppercase tracking-wider mb-3">Достижения</h2>
          <div className="flex gap-2 flex-wrap mb-4">
            {ACHIEVEMENTS.filter(a => unlockedIds.includes(a.id)).map(a => (
              <div key={a.id} className="flex items-center gap-1.5 bg-[#1A1A2E] rounded-xl px-3 py-2 border border-[#E94560]/20">
                <span className="text-lg">{a.icon}</span>
                <span className="text-xs font-semibold">{a.title}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Daily Quote */}
      <Card className="mb-4 border-l-4 border-[#E94560]">
        <div className="flex items-start gap-2">
          <Zap size={16} className="mt-0.5 shrink-0" style={{ color: '#FF6B35' }} />
          <p className="text-sm text-[#8B8B9E] italic">
            {quoteLoading ? 'Загружаю цитату...' : quote}
          </p>
        </div>
      </Card>
    </PageWrapper>
  );
};
