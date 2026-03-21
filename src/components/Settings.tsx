import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Trash2 } from 'lucide-react';
import { Modal } from '../components/ui';
import { clearAllSessions } from '../utils/storage';
import type { UserProfile } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  onUpdate: (updates: Partial<UserProfile>) => void;
  sessions: any[];
}

const Toggle: React.FC<{ value: boolean; onChange: (v: boolean) => void; label: string }> = ({ value, onChange, label }) => (
  <div className="flex items-center justify-between py-3 border-b border-white/5">
    <span className="text-sm">{label}</span>
    <button
      onClick={() => onChange(!value)}
      className={`w-12 h-6 rounded-full transition-all relative ${value ? 'bg-[#E94560]' : 'bg-white/10'}`}
    >
      <motion.div
        animate={{ x: value ? 24 : 2 }}
        className="absolute top-1 w-4 h-4 rounded-full bg-white"
      />
    </button>
  </div>
);

export const Settings: React.FC<Props> = ({ open, onClose, profile, onUpdate, sessions }) => {
  const [apiKey, setApiKey] = useState(localStorage.getItem('groq_api_key') || '');
  const [confirmReset, setConfirmReset] = useState(false);

  const handleExport = () => {
    const data = JSON.stringify({ sessions, profile, exportedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shadowcoach-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = async () => {
    if (!confirmReset) { setConfirmReset(true); return; }
    await clearAllSessions();
    localStorage.clear();
    window.location.reload();
  };

  const saveApiKey = () => {
    if (apiKey.trim()) localStorage.setItem('groq_api_key', apiKey.trim());
    else localStorage.removeItem('groq_api_key');
  };

  return (
    <Modal open={open} onClose={onClose} title="⚙️ Настройки">
      <div className="space-y-1">
        {/* Stance */}
        <div className="py-3 border-b border-white/5">
          <p className="text-sm mb-2">Стойка</p>
          <div className="flex gap-2">
            {(['orthodox', 'southpaw'] as const).map(s => (
              <button
                key={s}
                onClick={() => onUpdate({ stance: s })}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${profile?.stance === s
                  ? 'bg-gradient-to-r from-[#E94560] to-[#FF6B35] text-white'
                  : 'bg-white/5 text-[#8B8B9E]'}`}
              >
                {s === 'orthodox' ? '🥊 Orthodox' : '🥊 Southpaw'}
              </button>
            ))}
          </div>
        </div>

        {/* Level */}
        <div className="py-3 border-b border-white/5">
          <p className="text-sm mb-2">Уровень</p>
          <div className="flex gap-2">
            {([['beginner', 'Новичок'], ['amateur', 'Любитель'], ['advanced', 'Продвинутый']] as const).map(([id, label]) => (
              <button
                key={id}
                onClick={() => onUpdate({ level: id })}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${profile?.level === id
                  ? 'bg-gradient-to-r from-[#E94560] to-[#FF6B35] text-white'
                  : 'bg-white/5 text-[#8B8B9E]'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Model */}
        <div className="py-3 border-b border-white/5">
          <p className="text-sm mb-2">Модель ИИ</p>
          <div className="flex gap-2">
            {([
              ['llama-3.3-70b-versatile', 'Умная'],
              ['llama-3.1-8b-instant', 'Быстрая'],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                onClick={() => { localStorage.setItem('groq_model', id); onUpdate({ groqModel: id }); }}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${(profile?.groqModel ?? 'llama-3.3-70b-versatile') === id
                  ? 'bg-gradient-to-r from-[#E94560] to-[#FF6B35] text-white'
                  : 'bg-white/5 text-[#8B8B9E]'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <Toggle value={profile?.soundEnabled ?? true} onChange={v => onUpdate({ soundEnabled: v })} label="🔊 Звуковые эффекты" />
        <Toggle value={profile?.vibrationEnabled ?? true} onChange={v => onUpdate({ vibrationEnabled: v })} label="📳 Вибрация" />
        <Toggle value={profile?.showSkeleton ?? true} onChange={v => onUpdate({ showSkeleton: v })} label="🦴 Показывать скелет позы" />

        {/* API Key */}
        <div className="py-3 border-b border-white/5">
          <p className="text-sm mb-1">Groq API ключ</p>
          <p className="text-xs text-[#8B8B9E] mb-2">Получите ключ на <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="text-[#E94560]">console.groq.com</a></p>
          <div className="flex gap-2">
            <input
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="gsk_..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#E94560]/50"
            />
            <button onClick={saveApiKey} className="px-3 py-2 bg-[#E94560]/20 rounded-xl text-xs text-[#E94560] border border-[#E94560]/30">
              Сохранить
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-3 space-y-2">
          <button onClick={handleExport} className="w-full flex items-center gap-2 py-3 px-4 bg-white/5 rounded-xl text-sm hover:bg-white/10 transition-all">
            <Download size={16} className="text-[#00D9A5]" /> Экспорт данных (JSON)
          </button>
          <button
            onClick={handleReset}
            className={`w-full flex items-center gap-2 py-3 px-4 rounded-xl text-sm transition-all ${confirmReset ? 'bg-[#E94560] text-white' : 'bg-[#E94560]/10 text-[#E94560] border border-[#E94560]/20'}`}
          >
            <Trash2 size={16} /> {confirmReset ? 'Нажми ещё раз для подтверждения' : 'Сбросить все данные'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
