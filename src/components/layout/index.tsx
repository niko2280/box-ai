import React from 'react';
import { motion } from 'framer-motion';
import { Home, Video, BarChart2, ClipboardList, Lightbulb, Settings } from 'lucide-react';

export type Page = 'dashboard' | 'training' | 'progress' | 'plan' | 'tips';

interface BottomNavProps { current: Page; onChange: (p: Page) => void; }

const NAV_ITEMS: { id: Page; icon: React.ReactNode; label: string }[] = [
  { id: 'dashboard', icon: <Home size={22} />, label: 'Главная' },
  { id: 'training', icon: <Video size={22} />, label: 'Тренировка' },
  { id: 'progress', icon: <BarChart2 size={22} />, label: 'Прогресс' },
  { id: 'plan', icon: <ClipboardList size={22} />, label: 'План' },
  { id: 'tips', icon: <Lightbulb size={22} />, label: 'Советы' },
];

export const BottomNav: React.FC<BottomNavProps> = ({ current, onChange }) => (
  <nav className="fixed bottom-0 left-0 right-0 z-40 glass-strong border-t border-white/5 pb-safe">
    <div className="flex max-w-lg mx-auto px-2">
      {NAV_ITEMS.map(item => {
        const active = current === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className="flex-1 flex flex-col items-center py-3 gap-1 transition-all nav-item relative"
          >
            <motion.div
              animate={{ 
                scale: active ? 1.15 : 1, 
                color: active ? '#FF0844' : '#A0A0B8',
                filter: active ? 'drop-shadow(0 0 8px #FF0844)' : 'none'
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {item.icon}
            </motion.div>
            <span className="text-[10px] font-semibold" style={{ color: active ? '#FF0844' : '#A0A0B8' }}>
              {item.label}
            </span>
            {active && <div className="nav-item active" />}
          </button>
        );
      })}
    </div>
  </nav>
);

interface HeaderProps { title: string; onSettings: () => void; }
export const Header: React.FC<HeaderProps> = ({ title, onSettings }) => (
  <header className="sticky top-0 z-30 glass-strong border-b border-white/5 px-4 py-4 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <span className="text-3xl">🥊</span>
      <span className="font-black text-xl gradient-text">
        {title}
      </span>
    </div>
    <button onClick={onSettings} className="p-2 rounded-xl hover:bg-white/5 text-[#A0A0B8] hover:text-white transition-all active:scale-95">
      <Settings size={22} />
    </button>
  </header>
);

interface PageWrapperProps { children: React.ReactNode; }
export const PageWrapper: React.FC<PageWrapperProps> = ({ children }) => (
  <motion.div
    className="min-h-screen pb-24 px-4 pt-2 max-w-lg mx-auto"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);
