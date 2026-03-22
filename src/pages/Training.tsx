import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, Pause, RotateCcw, Save, ChevronLeft } from 'lucide-react';
import { Button, Card, CircularProgress, ProgressBar, Badge } from '../components/ui';
import { PageWrapper } from '../components/layout';
import { usePoseDetection } from '../hooks/usePoseDetection';
import { calcOverallScore, getLetterGrade, getGradeColor, getWeakPoints, getStrongPoints, calcStats } from '../utils/scoreCalculator';
import { getTrainingReview } from '../api/groq';
import type { TrainingSession, UserProfile, TrainingFocus } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

type Step = 'setup' | 'countdown' | 'recording' | 'analyzing' | 'results';

const DURATIONS = [30, 60, 90, 120, 180];
const FOCUS_OPTIONS: { id: TrainingFocus; label: string; icon: string }[] = [
  { id: 'free', label: 'Свободный бой', icon: '🥊' },
  { id: 'jab', label: 'Работа джебом', icon: '👊' },
  { id: 'combos', label: 'Комбинации', icon: '🔗' },
  { id: 'defense', label: 'Защита и уклоны', icon: '🛡️' },
  { id: 'footwork', label: 'Футворк', icon: '👣' },
];

const PUNCH_LABELS: Record<string, string> = { jab: 'Джеб', cross: 'Кросс', hook: 'Хук', uppercut: 'Апперкот' };
const PUNCH_COLORS = ['#E94560', '#FF6B35', '#00D9A5', '#4FC3F7'];

interface Props {
  profile: UserProfile | null;
  onSave: (session: TrainingSession) => void;
}

export const Training: React.FC<Props> = ({ profile, onSave }) => {
  const [step, setStep] = useState<Step>('setup');
  const [duration, setDuration] = useState(60);
  const [focus, setFocus] = useState<TrainingFocus>('free');
  const [countdown, setCountdown] = useState(5);
  const [timeLeft, setTimeLeft] = useState(60);
  const [paused, setPaused] = useState(false);
  const [aiReview, setAiReview] = useState('');
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [cameraError, setCameraError] = useState('');
  const [showCombo, setShowCombo] = useState(false);
  const [comboCount, setComboCount] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const stance = profile?.stance ?? 'orthodox';
  const showSkeleton = profile?.showSkeleton ?? true;
  const { init, isReady, startDetection, stopDetection, getResults, currentPunchCount, lastPunchType } = usePoseDetection(stance, showSkeleton);

  useEffect(() => { init(); }, [init]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraError('');
    } catch (e) {
      setCameraError('Нет доступа к камере. Разрешите доступ в настройках браузера.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  const startCountdown = useCallback(async () => {
    setStep('countdown');
    setCountdown(5);
    await startCamera();
    let c = 5;
    const interval = setInterval(() => {
      c--;
      setCountdown(c);
      if (c <= 0) {
        clearInterval(interval);
        setStep('recording');
        setTimeLeft(duration);
        startTimeRef.current = Date.now();
        if (videoRef.current && canvasRef.current) {
          startDetection(videoRef.current, canvasRef.current);
        }
      }
    }, 1000);
  }, [duration, startCamera, startDetection]);

  useEffect(() => {
    if (step !== 'recording' || paused) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          finishRecording();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [step, paused]);

  const finishRecording = useCallback(async () => {
    stopDetection();
    stopCamera();
    setStep('analyzing');

    // Animate progress
    let p = 0;
    const prog = setInterval(() => {
      p += Math.random() * 15;
      setAnalyzeProgress(Math.min(p, 90));
      if (p >= 90) clearInterval(prog);
    }, 200);

    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const { scores, punchLog } = getResults(elapsed);
    const stats = calcStats(punchLog, elapsed);
    stats.guardPct = Math.round((scores.defense - 20) / 1.2);
    stats.stancePct = Math.round((scores.stance - 20) / 1.1);

    const overallScore = calcOverallScore(scores);
    const weakPoints = getWeakPoints(scores);
    const strongPoints = getStrongPoints(scores);

    let review = '';
    try {
      review = await getTrainingReview(elapsed, overallScore, scores, stats, weakPoints, strongPoints);
    } catch {
      review = 'Анализ недоступен. Проверьте подключение к интернету.';
    }

    clearInterval(prog);
    setAnalyzeProgress(100);

    const newSession: TrainingSession = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      duration: Math.round(elapsed),
      focus,
      overallScore,
      scores,
      stats,
      weakPoints,
      strongPoints,
      aiReview: review,
      punchLog
    };

    setAiReview(review);
    setSession(newSession);
    setTimeout(() => setStep('results'), 500);
  }, [stopDetection, stopCamera, getResults, focus]);

  const handleSave = () => {
    if (session) { onSave(session); setStep('setup'); }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // SETUP
  if (step === 'setup') return (
    <PageWrapper>
      <div className="py-4">
        <h1 className="text-2xl font-bold mb-1">Тренировка</h1>
        <p className="text-[#8B8B9E] text-sm">Настрой параметры раунда</p>
      </div>

      <Card className="mb-4">
        <h3 className="font-semibold mb-3">⏱ Длительность</h3>
        <div className="flex gap-2 flex-wrap">
          {DURATIONS.map(d => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${duration === d
                ? 'bg-gradient-to-r from-[#E94560] to-[#FF6B35] text-white'
                : 'bg-white/5 text-[#8B8B9E] hover:bg-white/10'}`}
            >
              {d < 60 ? `${d}с` : `${d / 60}мин`}
            </button>
          ))}
        </div>
      </Card>

      <Card className="mb-4">
        <h3 className="font-semibold mb-3">🎯 Фокус тренировки</h3>
        <div className="flex flex-col gap-2">
          {FOCUS_OPTIONS.map(f => (
            <button
              key={f.id}
              onClick={() => setFocus(f.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${focus === f.id
                ? 'bg-[#E94560]/20 border border-[#E94560]/50 text-white'
                : 'bg-white/5 text-[#8B8B9E] hover:bg-white/10'}`}
            >
              <span className="text-xl">{f.icon}</span>
              {f.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="mb-6 border-l-4 border-[#FF6B35]">
        <h3 className="font-semibold mb-2">📷 Советы по камере</h3>
        <ul className="text-sm text-[#8B8B9E] space-y-1">
          <li>• Встань в 1.5–2 метрах от камеры</li>
          <li>• Всё тело должно быть в кадре</li>
          <li>• Хорошее освещение спереди</li>
          <li>• Камера на уровне груди</li>
        </ul>
      </Card>

      {!isReady && (
        <div className="text-center text-[#8B8B9E] text-sm mb-4">
          <span className="inline-block w-4 h-4 border-2 border-[#E94560]/30 border-t-[#E94560] rounded-full animate-spin mr-2" />
          Загружаю модель ИИ...
        </div>
      )}

      <Button onClick={startCountdown} size="lg" className="w-full" disabled={!isReady}>
        <Play size={20} /> НАЧАТЬ
      </Button>
    </PageWrapper>
  );

  // COUNTDOWN
  if (step === 'countdown') return (
    <div className="fixed inset-0 bg-black flex flex-col">
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover opacity-50" muted playsInline />
      <div className="relative z-10 flex flex-col items-center justify-center h-full">
        <motion.div
          key={countdown}
          initial={{ scale: 2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          className="text-9xl font-black text-white"
          style={{ textShadow: '0 0 40px rgba(233,69,96,0.8)' }}
        >
          {countdown > 0 ? countdown : '🥊'}
        </motion.div>
        <p className="text-white/70 text-xl mt-4">Приготовься!</p>
        {cameraError && <p className="text-[#E94560] mt-4 text-center px-8">{cameraError}</p>}
      </div>
    </div>
  );

  // RECORDING
  if (step === 'recording') return (
    <div className="fixed inset-0 bg-black">
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted playsInline style={{ transform: 'scaleX(-1)' }} />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        width={640} height={480}
        style={{ transform: 'scaleX(-1)' }}
      />

      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
        <div className="glass rounded-2xl px-4 py-2 text-center">
          <div className="text-3xl font-black font-mono" style={{ color: timeLeft <= 10 ? '#E94560' : '#fff' }}>
            {formatTime(timeLeft)}
          </div>
        </div>
        <div className="glass rounded-2xl px-4 py-2 text-center">
          <div className="text-2xl font-black">{currentPunchCount}</div>
          <div className="text-xs text-[#8B8B9E]">ударов</div>
        </div>
      </div>

      {/* Last punch indicator */}
      <AnimatePresence>
        {lastPunchType && (
          <motion.div
            key={currentPunchCount}
            initial={{ opacity: 1, y: 0, scale: 1.2 }}
            animate={{ opacity: 0, y: -40, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="absolute top-24 left-1/2 -translate-x-1/2 text-2xl font-black text-[#FF6B35]"
            style={{ textShadow: '0 0 20px rgba(255,107,53,0.8)' }}
          >
            {PUNCH_LABELS[lastPunchType] || lastPunchType}!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom controls */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4 px-4">
        <button
          onClick={() => setPaused(p => !p)}
          className="glass rounded-2xl p-4 text-white"
        >
          {paused ? <Play size={24} /> : <Pause size={24} />}
        </button>
        <button
          onClick={finishRecording}
          className="bg-[#E94560] rounded-2xl p-4 text-white"
        >
          <Square size={24} />
        </button>
      </div>

      {paused && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <div className="text-4xl font-black text-white">ПАУЗА</div>
        </div>
      )}
    </div>
  );

  // ANALYZING
  if (step === 'analyzing') return (
    <div className="fixed inset-0 bg-[#0A0A0F] flex flex-col items-center justify-center p-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="text-6xl mb-8"
      >
        🥊
      </motion.div>
      <h2 className="text-2xl font-bold mb-2">Анализирую технику...</h2>
      <p className="text-[#8B8B9E] mb-8 text-center">ИИ-тренер изучает ваш бой с тенью</p>
      <div className="w-full max-w-xs">
        <ProgressBar value={analyzeProgress} animated={false} height={6} />
        <p className="text-center text-[#8B8B9E] text-sm mt-2">{Math.round(analyzeProgress)}%</p>
      </div>
    </div>
  );

  // RESULTS
  if (step === 'results' && session) {
    const { scores, stats, weakPoints, strongPoints, overallScore } = session;
    const grade = getLetterGrade(overallScore);
    const pieData = [
      { name: 'Джеб', value: stats.jabCount },
      { name: 'Кросс', value: stats.crossCount },
      { name: 'Хук', value: stats.hookCount },
      { name: 'Апперкот', value: stats.uppercutCount },
    ].filter(d => d.value > 0);

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

    return (
      <div className="min-h-screen bg-[#0A0A0F] pb-8">
        <div className="sticky top-0 z-10 bg-[#0A0A0F]/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setStep('setup')} className="text-[#8B8B9E] hover:text-white">
            <ChevronLeft size={24} />
          </button>
          <h1 className="font-bold text-lg">Результаты раунда</h1>
        </div>

        <div className="px-4 pt-4 max-w-lg mx-auto space-y-4">
          {/* Overall */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="text-center py-6">
              <CircularProgress value={overallScore} size={140} sublabel={grade} />
              <h2 className="text-xl font-bold mt-3">
                {grade === 'S' ? 'Легенда!' : grade === 'A' ? 'Отлично!' : grade === 'B' ? 'Хорошо!' : grade === 'C' ? 'Неплохо' : 'Нужно работать'}
              </h2>
              <div className="flex justify-center gap-4 mt-2 text-sm text-[#8B8B9E]">
                <span>{session.duration}с</span>
                <span>·</span>
                <span>{stats.totalPunches} ударов</span>
                <span>·</span>
                <span>{stats.punchesPerMin} уд/мин</span>
              </div>
            </Card>
          </motion.div>

          {/* Scores */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <h3 className="font-semibold mb-3">📊 Оценки по категориям</h3>
              <div className="space-y-3">
                {SCORE_ITEMS.map(({ key, label, icon }) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-lg w-6">{icon}</span>
                    <span className="text-sm text-[#8B8B9E] w-20 shrink-0">{label}</span>
                    <div className="flex-1"><ProgressBar value={scores[key]} /></div>
                    <span className="text-sm font-bold w-8 text-right" style={{ color: getGradeColor(scores[key]) }}>
                      {scores[key]}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Weak / Strong */}
          <div className="grid grid-cols-2 gap-3">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
              <Card className="h-full">
                <h3 className="font-semibold text-sm mb-2 text-[#E94560]">⚠️ Слабые места</h3>
                {weakPoints.map((w, i) => (
                  <div key={i} className="text-xs text-[#8B8B9E] py-1 border-b border-white/5 last:border-0">{w}</div>
                ))}
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
              <Card className="h-full">
                <h3 className="font-semibold text-sm mb-2 text-[#00D9A5]">✅ Сильные стороны</h3>
                {strongPoints.map((s, i) => (
                  <div key={i} className="text-xs text-[#8B8B9E] py-1 border-b border-white/5 last:border-0">{s}</div>
                ))}
              </Card>
            </motion.div>
          </div>

          {/* Stats + Pie */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <h3 className="font-semibold mb-3">📈 Статистика</h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <div className="text-2xl font-black">{stats.totalPunches}</div>
                  <div className="text-xs text-[#8B8B9E]">Всего ударов</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <div className="text-2xl font-black">{stats.punchesPerMin}</div>
                  <div className="text-xs text-[#8B8B9E]">Ударов/мин</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <div className="text-2xl font-black">{stats.comboCount}</div>
                  <div className="text-xs text-[#8B8B9E]">Комбинаций</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <div className="text-2xl font-black">{Math.max(0, stats.guardPct)}%</div>
                  <div className="text-xs text-[#8B8B9E]">Guard up</div>
                </div>
              </div>
              {pieData.length > 0 && (
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={60} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                      {pieData.map((_, i) => <Cell key={i} fill={PUNCH_COLORS[i % PUNCH_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1A1A2E', border: 'none', borderRadius: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card>
          </motion.div>

          {/* AI Review */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Card className="border-l-4 border-[#E94560]">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🤖</span>
                <h3 className="font-semibold">Разбор тренера</h3>
                <Badge>ИИ</Badge>
              </div>
              <p className="text-sm text-[#8B8B9E] leading-relaxed whitespace-pre-wrap">{aiReview}</p>
            </Card>
          </motion.div>

          {/* Actions */}
          <div className="flex gap-3 pb-4">
            <Button onClick={handleSave} className="flex-1">
              <Save size={18} /> Сохранить
            </Button>
            <Button variant="secondary" onClick={() => setStep('setup')} className="flex-1">
              <RotateCcw size={18} /> Повторить
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
