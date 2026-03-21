# 🏗 Архитектура ShadowCoach AI

## 📁 Структура проекта

```
src/
├── api/
│   └── groq.ts              # Все вызовы к Groq API
├── components/
│   ├── ui/                  # Переиспользуемые UI компоненты
│   │   └── index.tsx        # Button, Card, ProgressBar, CircularProgress, Badge, Modal
│   ├── layout/              # Компоненты макета
│   │   └── index.tsx        # BottomNav, Header, PageWrapper
│   ├── Onboarding.tsx       # Онбординг для новых пользователей
│   └── Settings.tsx         # Модальное окно настроек
├── data/
│   └── tips.ts              # Статичные данные: советы, ссылки на видео
├── hooks/
│   ├── useTrainingHistory.ts  # Работа с историей тренировок
│   └── usePoseDetection.ts    # TensorFlow.js + MoveNet
├── pages/
│   ├── Dashboard.tsx        # Главная страница
│   ├── Training.tsx         # Страница тренировки (камера + анализ)
│   ├── Progress.tsx         # Статистика и графики
│   ├── Plan.tsx             # План тренировок
│   └── Tips.tsx             # Советы и чат с ИИ
├── types/
│   └── index.ts             # TypeScript типы
├── utils/
│   ├── poseAnalyzer.ts      # Алгоритмы распознавания ударов
│   ├── scoreCalculator.ts   # Расчёт оценок и достижений
│   └── storage.ts           # IndexedDB операции
├── App.tsx                  # Главный компонент
├── main.tsx                 # Точка входа
└── index.css                # Глобальные стили
```

## 🔄 Поток данных

### 1. Инициализация
- `main.tsx` → `App.tsx`
- `useTrainingHistory` загружает профиль и сессии из IndexedDB
- Если `onboardingDone === false` → показываем `Onboarding`

### 2. Тренировка
```
Training.tsx
  ↓
usePoseDetection (TensorFlow.js)
  ↓
poseAnalyzer.ts (распознавание ударов)
  ↓
scoreCalculator.ts (расчёт оценок)
  ↓
groq.ts (ИИ-разбор)
  ↓
storage.ts (сохранение сессии)
```

### 3. Анализ позы (poseAnalyzer.ts)

**MoveNet 17 ключевых точек:**
- 0: нос
- 5-6: плечи
- 7-8: локти
- 9-10: запястья
- 11-12: бёдра
- 13-14: колени
- 15-16: лодыжки

**Алгоритм распознавания:**

1. **Джеб** — передняя рука выпрямляется (угол локтя > 150°), скорость > 200px/s
2. **Кросс** — задняя рука + ротация бёдер
3. **Хук** — локоть ~90°, дугообразное движение, запястье на уровне головы
4. **Апперкот** — движение снизу вверх, кулак ниже→выше локтя

**Оценка удара (0-100):**
- Скорость (25 баллов)
- Выпрямление руки (25 баллов)
- Возврат в стойку (25 баллов)
- Guard up (25 баллов)

**Дополнительный анализ:**
- **Guard** — расстояние запястье-нос < порога
- **Стойка** — согнутость колен, ширина ног
- **Футворк** — перемещение центра масс, штраф за скрещивание ног

### 4. Groq API интеграция

**Эндпоинт:** `https://api.groq.com/openai/v1/chat/completions`

**Модель:** `llama-3.3-70b-versatile` (по умолчанию)

**Функции:**
- `getTrainingReview()` — разбор тренировки (200-300 слов)
- `generateWeeklyPlan()` — план на неделю в JSON
- `chatWithCoach()` — чат с тренером
- `getDailyQuote()` — мотивационная цитата
- `getDailyTip()` — совет дня

**Промпты:**
- Системный: "Ты — опытный тренер по боксу с 20-летним стажем..."
- Контекст: оценки, статистика, слабые/сильные места
- Температура: 0.7 (баланс креативности и точности)

### 5. Хранение данных (IndexedDB)

**Stores:**
- `sessions` — история тренировок
- `profile` — профиль пользователя

**TrainingSession:**
```typescript
{
  id: string
  date: string
  duration: number
  focus: string
  overallScore: number
  scores: CategoryScores
  stats: TrainingStats
  weakPoints: string[]
  strongPoints: string[]
  aiReview: string
  punchLog: PunchEvent[]
}
```

**UserProfile:**
```typescript
{
  level: 'beginner' | 'amateur' | 'advanced'
  stance: 'orthodox' | 'southpaw'
  currentPlan: WeekPlan | null
  streak: number
  lastTrainingDate: string
  totalSessions: number
  bestScore: number
  soundEnabled: boolean
  vibrationEnabled: boolean
  showSkeleton: boolean
  groqModel: string
  onboardingDone: boolean
}
```

## 🎯 Расчёт оценок

### Общая оценка (0-100)
```
Веса категорий:
- Джеб: 15%
- Кросс: 15%
- Хук: 10%
- Апперкот: 10%
- Защита: 15%
- Футворк: 10%
- Стойка: 10%
- Скорость: 10%
- Комбинации: 5%
```

### Буквенные оценки
- S: 95+
- A: 85-94
- B: 75-84
- C: 60-74
- D: 45-59
- F: <45

### Достижения
- **Первый раунд** — 1 тренировка
- **Неделя подряд** — streak 7 дней
- **Снайпер** — джеб 90+
- **Стена** — защита 90+
- **Танцор** — футворк 90+
- **Совершенство** — общая оценка 95+
- **100 раундов** — 100 тренировок
- **Машина** — streak 30 дней

## 🎨 UI/UX паттерны

### Цветовая схема
```css
Фон: #0A0A0F
Карточки: #1A1A2E
Акцент 1: #E94560 (красный)
Акцент 2: #FF6B35 (оранжевый)
Успех: #00D9A5 (бирюзовый)
Текст: #FFFFFF / #8B8B9E
```

### Анимации (Framer Motion)
- Staggered fade-in для списков
- Count-up для чисел
- Пульсация для кнопок
- Slide переходы между страницами
- Skeleton loading

### Адаптивность
- Mobile-first (375px)
- Планшет (768px)
- Десктоп (1024px+)

## 🔐 Безопасность

- API ключ хранится в localStorage (можно заменить)
- Нет серверной части — всё на клиенте
- Видео не сохраняется, только метрики
- IndexedDB — локальное хранилище

## ⚡ Производительность

- TensorFlow.js WebGL backend
- MoveNet Lightning (быстрая модель)
- Анализ каждого 3-го кадра (~10 FPS)
- Debounce для распознавания ударов (400ms)
- Lazy loading для графиков
- Кэширование ИИ-ответов (sessionStorage)

## 🚀 Оптимизации

1. **Pose Detection**
   - Используем MoveNet Lightning (самая быстрая модель)
   - Анализируем только последние 10 кадров
   - Cooldown между ударами 400ms

2. **API Calls**
   - Кэшируем daily quote и daily tip
   - Ограничиваем историю чата 10 сообщениями
   - Temperature 0.7 для баланса

3. **Rendering**
   - AnimatePresence для плавных переходов
   - Виртуализация не нужна (мало данных)
   - Canvas для отрисовки скелета

## 📱 PWA (будущее)

- Service Worker для offline
- Web App Manifest
- Install prompt
- Push notifications для напоминаний
