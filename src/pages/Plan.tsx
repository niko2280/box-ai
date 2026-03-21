import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { Button, Card } from '../components/ui';
import { PageWrapper } from '../components/layout';
import { generateWeeklyPlan } from '../api/groq';
import { getPlan, savePlan } from '../utils/storage';
import type { UserProfile, CategoryScores, WeekPlan, DayPlan } from '../types';

interface Props {
  profile: UserProfile | null;
  avgScores: CategoryScores;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
}

const LEVEL_OPTIONS = [
  { id: 'beginner', label: 'Новичок' },
  { id: 'amateur', label: 'Любитель' },
  { id: 'advanced', label: 'Продвинутый' },
] as const;

const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export const Plan: React.FC<Props> = ({ profile, avgScores, onUpdateProfile }) => {
  const [plan, setPlan] = useState<WeekPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedDay, setExpandedDay] = useState<number | null>(0);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    getPlan().then(p => { if (p) setPlan(p); });
  }, []);

  const generate = async () => {
    setLoading(true);
    try {
      const raw = await generateWeeklyPlan(avgScores, profile?.level ?? 'beginner');
      // Extract JSON from response
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON');
      const parsed = JSON.parse(jsonMatch[0]) as WeekPlan;
      const withDate = { ...parsed, generatedAt: new Date().toISOString() };
      setPlan(withDate);
      await savePlan(withDate);
      setCheckedItems({});
    } catch (e) {
      console.error('Plan generation failed:', e);
    }
    setLoading(false);
  };

  const toggleCheck = (key: string) => {
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getDayProgress = (day: DayPlan) => {
    const allItems = [...day.warmup, ...day.main, ...day.drills, ...day.cooldown];
    const checked = allItems.filter((_, i) => checkedItems[`${day.day}-${i}`]).length;
    return { checked, total: allItems.length };
  };

  return (
    <PageWrapper>
      <div className="py-4">
        <h1 className="text-2xl font-bold mb-1">План тренировок</h1>
        <p className="text-[#8B8B9E] text-sm">Персональный план от ИИ-тренера</p>
      </div>

      {/* Level selector */}
      <Card className="mb-4">
        <h3 className="font-semibold mb-3">🎯 Уровень</h3>
        <div className="flex gap-2">
          {LEVEL_OPTIONS.map(l => (
            <button
              key={l.id}
              onClick={() => onUpdateProfile({ level: l.id })}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${profile?.level === l.id
                ? 'bg-gradient-to-r from-[#E94560] to-[#FF6B35] text-white'
                : 'bg-white/5 text-[#8B8B9E] hover:bg-white/10'}`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </Card>

      <Button onClick={generate} loading={loading} className="w-full mb-4">
        <RefreshCw size={18} /> {plan ? 'Обновить план' : 'Сгенерировать план'}
      </Button>

      {!plan && !loading && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-xl font-bold mb-2">Нет плана</h2>
          <p className="text-[#8B8B9E]">Нажми кнопку выше, чтобы ИИ составил план на неделю</p>
        </div>
      )}

      {loading && (
        <div className="text-center py-16">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="text-5xl mb-4">⚙️</motion.div>
          <p className="text-[#8B8B9E]">Составляю план под твои показатели...</p>
        </div>
      )}

      {plan && !loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {plan.generatedAt && (
            <p className="text-xs text-[#8B8B9E] mb-3 text-center">
              Создан {new Date(plan.generatedAt).toLocaleDateString('ru-RU')}
            </p>
          )}

          {/* Week overview */}
          <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
            {plan.week_plan.map((day, i) => {
              const { checked, total } = getDayProgress(day);
              const done = total > 0 && checked === total;
              return (
                <button
                  key={i}
                  onClick={() => setExpandedDay(expandedDay === i ? null : i)}
                  className={`flex flex-col items-center px-3 py-2 rounded-xl min-w-[52px] transition-all ${expandedDay === i
                    ? 'bg-gradient-to-b from-[#E94560] to-[#FF6B35]'
                    : done ? 'bg-[#00D9A5]/20 border border-[#00D9A5]/30' : 'bg-white/5'}`}
                >
                  <span className="text-xs text-[#8B8B9E]">{DAY_NAMES[i]}</span>
                  <span className="text-sm font-bold">{done ? '✓' : day.day}</span>
                  <span className="text-[10px] text-[#8B8B9E]">{day.duration_minutes}м</span>
                </button>
              );
            })}
          </div>

          {/* Day details */}
          <div className="space-y-2">
            {plan.week_plan.map((day, dayIdx) => {
              const isExpanded = expandedDay === dayIdx;
              const { checked, total } = getDayProgress(day);

              return (
                <Card key={dayIdx} className={isExpanded ? 'border-[#E94560]/30' : ''}>
                  <button
                    className="w-full flex items-center justify-between"
                    onClick={() => setExpandedDay(isExpanded ? null : dayIdx)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#E94560] to-[#FF6B35] flex items-center justify-center text-sm font-bold">
                        {day.day}
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-sm">{day.title}</div>
                        <div className="text-xs text-[#8B8B9E]">{day.duration_minutes} мин · {checked}/{total} выполнено</div>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp size={18} className="text-[#8B8B9E]" /> : <ChevronDown size={18} className="text-[#8B8B9E]" />}
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 space-y-4"
                      >
                        {/* Focus */}
                        <div className="bg-[#E94560]/10 rounded-xl p-3 border border-[#E94560]/20">
                          <span className="text-xs text-[#E94560] font-semibold">🎯 Фокус: </span>
                          <span className="text-sm">{day.shadow_boxing_focus}</span>
                        </div>

                        {/* Sections */}
                        {[
                          { title: '🔥 Разминка', items: day.warmup, prefix: 'w' },
                          { title: '💪 Основная часть', items: day.main, prefix: 'm' },
                          { title: '🥊 Упражнения', items: day.drills, prefix: 'd' },
                          { title: '🧘 Заминка', items: day.cooldown, prefix: 'c' },
                        ].map(({ title, items, prefix }) => (
                          <div key={prefix}>
                            <h4 className="text-sm font-semibold text-[#8B8B9E] mb-2">{title}</h4>
                            <div className="space-y-1.5">
                              {items.map((item, itemIdx) => {
                                const key = `${day.day}-${prefix}-${itemIdx}`;
                                const checked = checkedItems[key];
                                return (
                                  <button
                                    key={itemIdx}
                                    onClick={() => toggleCheck(key)}
                                    className="w-full flex items-start gap-3 text-left"
                                  >
                                    <div className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${checked ? 'bg-[#00D9A5] border-[#00D9A5]' : 'border-white/20'}`}>
                                      {checked && <Check size={12} className="text-black" />}
                                    </div>
                                    <span className={`text-sm ${checked ? 'line-through text-[#8B8B9E]' : ''}`}>{item}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}

                        {day.tips && (
                          <div className="bg-[#FF6B35]/10 rounded-xl p-3 border border-[#FF6B35]/20">
                            <span className="text-xs text-[#FF6B35] font-semibold">💡 Совет: </span>
                            <span className="text-sm text-[#8B8B9E]">{day.tips}</span>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              );
            })}
          </div>
        </motion.div>
      )}
    </PageWrapper>
  );
};
