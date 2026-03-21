import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';
import { Card } from '../components/ui';
import { PageWrapper } from '../components/layout';
import { getLetterGrade, getGradeColor } from '../utils/scoreCalculator';
import type { TrainingSession, UserProfile } from '../types';

interface Props {
  sessions: TrainingSession[];
  profile: UserProfile | null;
}

const SCORE_KEYS = [
  { key: 'jab', label: 'Джеб' },
  { key: 'cross', label: 'Кросс' },
  { key: 'hook', label: 'Хук' },
  { key: 'uppercut', label: 'Апперкот' },
  { key: 'defense', label: 'Защита' },
  { key: 'footwork', label: 'Футворк' },
  { key: 'stance', label: 'Стойка' },
  { key: 'speed', label: 'Скорость' },
  { key: 'combos', label: 'Комбо' },
] as const;

const TOOLTIP_STYLE = { background: '#1A1A2E', border: 'none', borderRadius: 12, color: '#fff' };

export const Progress: React.FC<Props> = ({ sessions, profile }) => {
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);

  const chartData = [...sessions].reverse().map((s, i) => ({
    name: `#${i + 1}`,
    score: s.overallScore,
    date: new Date(s.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
    ...s.scores
  }));

  const radarData = SCORE_KEYS.map(({ key, label }) => ({
    subject: label,
    value: sessions.length > 0
      ? Math.round(sessions.reduce((s, t) => s + t.scores[key], 0) / sessions.length)
      : 0
  }));

  const avgScore = sessions.length > 0
    ? Math.round(sessions.reduce((s, t) => s + t.overallScore, 0) / sessions.length) : 0;
  const bestScore = sessions.length > 0 ? Math.max(...sessions.map(s => s.overallScore)) : 0;
  const totalTime = sessions.reduce((s, t) => s + t.duration, 0);

  // Heatmap: last 12 weeks
  const heatmapData = (() => {
    const weeks: { date: string; count: number }[][] = Array.from({ length: 12 }, () =>
      Array.from({ length: 7 }, () => ({ date: '', count: 0 }))
    );
    const now = new Date();
    const sessionDates = new Set(sessions.map(s => new Date(s.date).toDateString()));

    for (let w = 0; w < 12; w++) {
      for (let d = 0; d < 7; d++) {
        const date = new Date(now);
        date.setDate(date.getDate() - (11 - w) * 7 - (6 - d));
        const dateStr = date.toDateString();
        weeks[w][d] = {
          date: date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
          count: sessionDates.has(dateStr) ? 1 : 0
        };
      }
    }
    return weeks;
  })();

  if (sessions.length === 0) return (
    <PageWrapper>
      <div className="py-4">
        <h1 className="text-2xl font-bold mb-1">Прогресс</h1>
      </div>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-6xl mb-4">📊</div>
        <h2 className="text-xl font-bold mb-2">Нет данных</h2>
        <p className="text-[#8B8B9E]">Проведи первую тренировку, чтобы увидеть прогресс</p>
      </div>
    </PageWrapper>
  );

  return (
    <PageWrapper>
      <div className="py-4">
        <h1 className="text-2xl font-bold mb-1">Прогресс</h1>
        <p className="text-[#8B8B9E] text-sm">{sessions.length} тренировок</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { label: 'Тренировок', value: sessions.length },
          { label: 'Время (мин)', value: Math.round(totalTime / 60) },
          { label: 'Средняя оценка', value: avgScore },
          { label: 'Лучшая оценка', value: bestScore },
          { label: 'Серия', value: `${profile?.streak ?? 0} дн.` },
        ].map(({ label, value }) => (
          <Card key={label} className="text-center py-3">
            <div className="text-2xl font-black" style={{ color: '#E94560' }}>{value}</div>
            <div className="text-xs text-[#8B8B9E]">{label}</div>
          </Card>
        ))}
      </div>

      {/* Line Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="mb-4">
          <h3 className="font-semibold mb-3">📈 Общая оценка</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="#8B8B9E" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} stroke="#8B8B9E" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="score" stroke="#E94560" strokeWidth={2} dot={{ fill: '#E94560', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>

      {/* Radar */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="mb-4">
          <h3 className="font-semibold mb-3">🕸 Навыки</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#8B8B9E', fontSize: 11 }} />
              <Radar dataKey="value" stroke="#E94560" fill="#E94560" fillOpacity={0.2} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>

      {/* Heatmap */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card className="mb-4">
          <h3 className="font-semibold mb-3">📅 Активность</h3>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {heatmapData.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((day, di) => (
                  <div
                    key={di}
                    title={day.date}
                    className="w-3 h-3 rounded-sm"
                    style={{ background: day.count > 0 ? '#E94560' : 'rgba(255,255,255,0.08)' }}
                  />
                ))}
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* History */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h2 className="text-sm font-semibold text-[#8B8B9E] uppercase tracking-wider mb-3">История</h2>
        <div className="space-y-2 mb-4">
          {sessions.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setSelectedSession(selectedSession?.id === s.id ? null : s)}
              className="w-full text-left"
            >
              <Card className={`transition-all ${selectedSession?.id === s.id ? 'border-[#E94560]/50' : ''}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold" style={{ color: getGradeColor(s.overallScore) }}>
                        {s.overallScore} {getLetterGrade(s.overallScore)}
                      </span>
                      <span className="text-xs text-[#8B8B9E]">{s.duration}с · {s.stats.totalPunches} уд.</span>
                    </div>
                    <div className="text-xs text-[#8B8B9E] mt-0.5">
                      {new Date(s.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <span className="text-[#8B8B9E] text-xs">#{sessions.length - i}</span>
                </div>

                {selectedSession?.id === s.id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 pt-3 border-t border-white/5">
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {SCORE_KEYS.map(({ key, label }) => (
                        <div key={key} className="text-center">
                          <div className="text-sm font-bold" style={{ color: getGradeColor(s.scores[key]) }}>{s.scores[key]}</div>
                          <div className="text-[10px] text-[#8B8B9E]">{label}</div>
                        </div>
                      ))}
                    </div>
                    {s.aiReview && (
                      <p className="text-xs text-[#8B8B9E] leading-relaxed line-clamp-4">{s.aiReview}</p>
                    )}
                  </motion.div>
                )}
              </Card>
            </button>
          ))}
        </div>
      </motion.div>

      {/* First vs Last comparison */}
      {sessions.length >= 2 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="mb-4">
            <h3 className="font-semibold mb-3">⚔️ Первая vs Последняя</h3>
            <div className="space-y-2">
              {SCORE_KEYS.map(({ key, label }) => {
                const first = sessions[sessions.length - 1].scores[key];
                const last = sessions[0].scores[key];
                const diff = last - first;
                return (
                  <div key={key} className="flex items-center gap-2 text-sm">
                    <span className="text-[#8B8B9E] w-16 shrink-0">{label}</span>
                    <span className="w-8 text-right text-[#8B8B9E]">{first}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/5 relative overflow-hidden">
                      <div className="absolute left-0 top-0 h-full rounded-full bg-[#8B8B9E]" style={{ width: `${first}%` }} />
                      <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${last}%`, background: diff >= 0 ? '#00D9A5' : '#E94560', opacity: 0.7 }} />
                    </div>
                    <span className="w-8 font-bold" style={{ color: getGradeColor(last) }}>{last}</span>
                    <span className="w-10 text-right text-xs" style={{ color: diff > 0 ? '#00D9A5' : diff < 0 ? '#E94560' : '#8B8B9E' }}>
                      {diff > 0 ? `+${diff}` : diff}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      )}
    </PageWrapper>
  );
};
