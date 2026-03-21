import type { CategoryScores, TrainingStats } from '../types';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || 'gsk_YOUR_KEY_HERE';
const GROQ_MODEL_DEFAULT = 'llama-3.3-70b-versatile';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const callGroq = async (messages: Message[], temperature = 0.7): Promise<string> => {
  const key = localStorage.getItem('groq_api_key') || GROQ_API_KEY;
  const model = localStorage.getItem('groq_model') || GROQ_MODEL_DEFAULT;

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({ model, messages, temperature })
  });

  if (!response.ok) throw new Error(`Groq API error: ${response.status}`);
  const data = await response.json();
  return data.choices[0].message.content;
};

export const getTrainingReview = async (
  duration: number,
  score: number,
  scores: CategoryScores,
  stats: TrainingStats,
  weakPoints: string[],
  strongPoints: string[]
): Promise<string> => {
  return callGroq([
    {
      role: 'system',
      content: 'Ты — опытный тренер по боксу с 20-летним стажем. Даёшь разборы тренировок. Строго, но мотивирующе. На русском языке.'
    },
    {
      role: 'user',
      content: `Проанализируй бой с тенью:\n- Длительность: ${duration} сек\n- Общая оценка: ${score}/100\n- Стойка: ${scores.stance}/100\n- Джеб: ${scores.jab}/100, кол-во: ${stats.jabCount}\n- Кросс: ${scores.cross}/100, кол-во: ${stats.crossCount}\n- Хук: ${scores.hook}/100, кол-во: ${stats.hookCount}\n- Апперкот: ${scores.uppercut}/100, кол-во: ${stats.uppercutCount}\n- Защита: ${scores.defense}/100, guard up: ${stats.guardPct}%\n- Футворк: ${scores.footwork}/100\n- Скорость: ${scores.speed}/100\n- Комбинации: ${stats.comboCount}, ср. длина: ${stats.avgComboLen.toFixed(1)}\n\nСлабые места: ${weakPoints.join(', ')}\nСильные стороны: ${strongPoints.join(', ')}\n\nДай разбор 200-300 слов.`
    }
  ]);
};

export const generateWeeklyPlan = async (scores: CategoryScores, level: string): Promise<string> => {
  const levelMap: Record<string, string> = { beginner: 'Новичок', amateur: 'Любитель', advanced: 'Продвинутый' };
  return callGroq([
    {
      role: 'system',
      content: 'Ты — профессиональный тренер по боксу. Составляешь планы тренировок. Отвечай ТОЛЬКО в формате JSON без markdown. На русском.'
    },
    {
      role: 'user',
      content: `Составь план на неделю.\nПоказатели: Джеб ${scores.jab}, Кросс ${scores.cross}, Хук ${scores.hook}, Апперкот ${scores.uppercut}, Защита ${scores.defense}, Футворк ${scores.footwork}, Стойка ${scores.stance}, Скорость ${scores.speed}, Комбинации ${scores.combos}\nУровень: ${levelMap[level] || level}\n\nJSON формат:\n{"week_plan":[{"day":1,"title":"...","warmup":["..."],"main":["..."],"shadow_boxing_focus":"...","drills":["..."],"cooldown":["..."],"duration_minutes":30,"tips":"..."}]}`
    }
  ], 0.6);
};

export const chatWithCoach = async (
  message: string,
  history: Message[],
  scores: CategoryScores
): Promise<string> => {
  return callGroq([
    {
      role: 'system',
      content: `Ты — опытный тренер по боксу. Данные ученика: Джеб ${scores.jab}/100, Кросс ${scores.cross}/100, Хук ${scores.hook}/100, Апперкот ${scores.uppercut}/100, Защита ${scores.defense}/100, Футворк ${scores.footwork}/100, Стойка ${scores.stance}/100. Давай конкретные советы. На русском.`
    },
    ...history,
    { role: 'user', content: message }
  ]);
};

export const getDailyQuote = async (): Promise<string> => {
  return callGroq([
    { role: 'system', content: 'Ты тренер по боксу. Отвечай только одной мотивационной цитатой на русском, без кавычек, 1-2 предложения.' },
    { role: 'user', content: 'Дай мотивационную цитату для боксёра на сегодня.' }
  ], 0.9);
};

export const getDailyTip = async (weakPoints: string[]): Promise<string> => {
  return callGroq([
    { role: 'system', content: 'Ты тренер по боксу. Дай один конкретный совет на русском, 2-3 предложения.' },
    { role: 'user', content: `Слабые места бойца: ${weakPoints.join(', ')}. Дай совет по улучшению.` }
  ]);
};
