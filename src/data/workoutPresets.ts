export interface WorkoutPreset {
  id: string;
  name: string;
  icon: string;
  duration: number;
  focus: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  targets: string[];
}

export const WORKOUT_PRESETS: WorkoutPreset[] = [
  {
    id: 'quick-jab',
    name: 'Быстрый джеб',
    icon: '⚡',
    duration: 60,
    focus: 'jab',
    description: 'Скоростная работа джебом',
    difficulty: 'beginner',
    targets: ['Скорость', 'Точность', 'Выносливость']
  },
  {
    id: 'power-combo',
    name: 'Силовые комбо',
    icon: '💥',
    duration: 90,
    focus: 'combos',
    description: 'Мощные комбинации ударов',
    difficulty: 'intermediate',
    targets: ['Сила', 'Комбинации', 'Координация']
  },
  {
    id: 'defense-master',
    name: 'Мастер защиты',
    icon: '🛡️',
    duration: 120,
    focus: 'defense',
    description: 'Уклоны, блоки, контратаки',
    difficulty: 'intermediate',
    targets: ['Защита', 'Реакция', 'Контроль']
  },
  {
    id: 'footwork-flow',
    name: 'Танец ринга',
    icon: '👟',
    duration: 90,
    focus: 'footwork',
    description: 'Передвижения и позиционирование',
    difficulty: 'beginner',
    targets: ['Футворк', 'Баланс', 'Мобильность']
  },
  {
    id: 'full-round',
    name: 'Полный раунд',
    icon: '🥊',
    duration: 180,
    focus: 'free',
    description: 'Классический 3-минутный раунд',
    difficulty: 'advanced',
    targets: ['Всё', 'Выносливость', 'Техника']
  },
  {
    id: 'speed-demon',
    name: 'Демон скорости',
    icon: '🔥',
    duration: 60,
    focus: 'free',
    description: 'Максимальная скорость ударов',
    difficulty: 'advanced',
    targets: ['Скорость', 'Взрывная сила', 'Реакция']
  }
];

export const getPresetById = (id: string) => WORKOUT_PRESETS.find(p => p.id === id);
export const getPresetsByDifficulty = (difficulty: string) => 
  WORKOUT_PRESETS.filter(p => p.difficulty === difficulty);
