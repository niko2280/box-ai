import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Button } from '../components/ui';
import type { UserProfile } from '../types';

interface Props {
  onComplete: (updates: Partial<UserProfile>) => void;
}

const SLIDES = [
  {
    emoji: '🥊',
    title: 'Добро пожаловать в ShadowCoach AI',
    desc: 'Персональный ИИ-тренер по боксу прямо в твоём браузере. Анализирует технику в реальном времени.',
  },
  {
    emoji: '📹',
    title: 'Записывай бой с тенью',
    desc: 'Включи камеру, встань в стойку и начни тренировку. ИИ отслеживает каждый удар через TensorFlow.js.',
  },
  {
    emoji: '📊',
    title: 'Получай детальный анализ',
    desc: 'После каждого раунда — оценки по 9 категориям, слабые места, сильные стороны и разбор от ИИ-тренера.',
  },
  {
    emoji: '⚙️',
    title: 'Настрой под себя',
    desc: 'Выбери стойку и уровень. API ключ уже встроен — можно начинать прямо сейчас!',
    hasSetup: true,
  },
];

export const Onboarding: React.FC<Props> = ({ onComplete }) => {
  const [slide, setSlide] = useState(0);
  const [stance, setStance] = useState<'orthodox' | 'southpaw'>('orthodox');
  const [level, setLevel] = useState<'beginner' | 'amateur' | 'advanced'>('beginner');

  const isLast = slide === SLIDES.length - 1;
  const current = SLIDES[slide];

  const handleNext = () => {
    if (isLast) {
      onComplete({ stance, level, onboardingDone: true });
    } else {
      setSlide(s => s + 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0A0A0F] flex flex-col items-center justify-center p-8 z-50">
      {/* Progress dots */}
      <div className="flex gap-2 mb-12">
        {SLIDES.map((_, i) => (
          <div
            key={i}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: i === slide ? 24 : 8,
              background: i <= slide ? '#E94560' : 'rgba(255,255,255,0.15)'
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={slide}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          className="text-center max-w-sm w-full"
        >
          <div className="text-8xl mb-8">{current.emoji}</div>
          <h1 className="text-2xl font-black mb-4 leading-tight">{current.title}</h1>
          <p className="text-[#8B8B9E] text-base leading-relaxed mb-8">{current.desc}</p>

          {current.hasSetup && (
            <div className="space-y-4 mb-8 text-left">
              <div>
                <p className="text-sm font-semibold mb-2">Стойка</p>
                <div className="flex gap-2">
                  {(['orthodox', 'southpaw'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setStance(s)}
                      className={`flex-1 py-3 rounded-2xl text-sm font-semibold transition-all ${stance === s
                        ? 'bg-gradient-to-r from-[#E94560] to-[#FF6B35] text-white'
                        : 'bg-white/5 text-[#8B8B9E] border border-white/10'}`}
                    >
                      {s === 'orthodox' ? '🥊 Orthodox' : '🥊 Southpaw'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold mb-2">Уровень</p>
                <div className="flex gap-2">
                  {([['beginner', 'Новичок'], ['amateur', 'Любитель'], ['advanced', 'Продвинутый']] as const).map(([id, label]) => (
                    <button
                      key={id}
                      onClick={() => setLevel(id)}
                      className={`flex-1 py-3 rounded-2xl text-xs font-semibold transition-all ${level === id
                        ? 'bg-gradient-to-r from-[#E94560] to-[#FF6B35] text-white'
                        : 'bg-white/5 text-[#8B8B9E] border border-white/10'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-[#00D9A5]/10 border border-[#00D9A5]/20 rounded-2xl p-3">
                <p className="text-xs text-[#00D9A5]">✅ API ключ Groq уже встроен — всё готово к работе!</p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <Button onClick={handleNext} size="lg" className="w-full max-w-sm">
        {isLast ? '🥊 Начать тренировки!' : (
          <><span>Далее</span><ChevronRight size={20} /></>
        )}
      </Button>
    </div>
  );
};
