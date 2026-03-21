import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, Badge } from '../components/ui';
import { chatWithCoach, getDailyTip } from '../api/groq';
import { TIPS_LIBRARY, YOUTUBE_LINKS } from '../data/tips';
import { getWeakPoints } from '../utils/scoreCalculator';
import type { CategoryScores } from '../types';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  avgScores: CategoryScores;
}

const QUICK_QUESTIONS = [
  'Как улучшить джеб?',
  'Советы по защите',
  'Как работать над футворком?',
  'Что такое правильная стойка?',
  'Как увеличить скорость ударов?',
];

export const Tips: React.FC<Props> = ({ avgScores }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Привет! Я твой ИИ-тренер по боксу. Задавай любые вопросы о технике, тренировках или стратегии. Готов помочь! 🥊' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [dailyTip, setDailyTip] = useState('');
  const [tipLoading, setTipLoading] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'library' | 'videos'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const cached = sessionStorage.getItem('daily_tip');
    if (cached) { setDailyTip(cached); return; }
    setTipLoading(true);
    const weakPoints = getWeakPoints(avgScores);
    getDailyTip(weakPoints)
      .then(t => { setDailyTip(t); sessionStorage.setItem('daily_tip', t); })
      .catch(() => {})
      .finally(() => setTipLoading(false));
  }, []);

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg: ChatMessage = { role: 'user', content: msg };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      const history = newMessages.slice(-10).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));
      const reply = await chatWithCoach(msg, history, avgScores);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Ошибка соединения. Проверь интернет.' }]);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen pb-24 max-w-lg mx-auto">
      <div className="px-4 py-4">
        <h1 className="text-2xl font-bold mb-1">Советы</h1>
        <p className="text-[#8B8B9E] text-sm">ИИ-тренер всегда на связи</p>
      </div>

      {/* Daily Tip */}
      <div className="px-4 mb-4">
        <Card className="border-l-4 border-[#00D9A5]">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">💡</span>
            <span className="text-sm font-semibold text-[#00D9A5]">Совет дня</span>
          </div>
          <p className="text-sm text-[#8B8B9E]">
            {tipLoading ? 'Загружаю совет...' : dailyTip || 'Работай над слабыми местами каждый день.'}
          </p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-4">
        <div className="flex bg-[#1A1A2E] rounded-2xl p-1">
          {(['chat', 'library', 'videos'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === tab
                ? 'bg-gradient-to-r from-[#E94560] to-[#FF6B35] text-white'
                : 'text-[#8B8B9E]'}`}
            >
              {tab === 'chat' ? '💬 Чат' : tab === 'library' ? '📚 Советы' : '▶️ Видео'}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <div className="flex flex-col px-4">
          {/* Quick questions */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
            {QUICK_QUESTIONS.map(q => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="shrink-0 px-3 py-1.5 bg-[#1A1A2E] rounded-xl text-xs text-[#8B8B9E] hover:text-white hover:border-[#E94560]/50 border border-white/5 transition-all"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="space-y-3 mb-4 min-h-[300px]">
            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#E94560] to-[#FF6B35] flex items-center justify-center text-sm mr-2 shrink-0 mt-1">
                      🥊
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                      ? 'bg-gradient-to-r from-[#E94560] to-[#FF6B35] text-white rounded-tr-sm'
                      : 'bg-[#1A1A2E] text-white rounded-tl-sm border border-white/5'}`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <div className="flex justify-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#E94560] to-[#FF6B35] flex items-center justify-center text-sm mr-2 shrink-0">🥊</div>
                <div className="bg-[#1A1A2E] rounded-2xl rounded-tl-sm px-4 py-3 border border-white/5">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.div key={i} className="w-2 h-2 rounded-full bg-[#8B8B9E]"
                        animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2 sticky bottom-20">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Задай вопрос тренеру..."
              className="flex-1 bg-[#1A1A2E] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-[#8B8B9E] focus:outline-none focus:border-[#E94560]/50"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="w-12 h-12 rounded-2xl bg-gradient-to-r from-[#E94560] to-[#FF6B35] flex items-center justify-center disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Library Tab */}
      {activeTab === 'library' && (
        <div className="px-4 space-y-2">
          {TIPS_LIBRARY.map(cat => (
            <Card key={cat.category}>
              <button
                className="w-full flex items-center justify-between"
                onClick={() => setExpandedCategory(expandedCategory === cat.category ? null : cat.category)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="font-semibold">{cat.category}</span>
                  <Badge>{cat.tips.length} советов</Badge>
                </div>
                {expandedCategory === cat.category ? <ChevronUp size={18} className="text-[#8B8B9E]" /> : <ChevronDown size={18} className="text-[#8B8B9E]" />}
              </button>

              <AnimatePresence>
                {expandedCategory === cat.category && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 space-y-2"
                  >
                    {cat.tips.map((tip, i) => (
                      <div key={i} className="flex gap-2 text-sm text-[#8B8B9E] py-2 border-t border-white/5">
                        <span className="text-[#E94560] shrink-0">•</span>
                        {tip}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          ))}
        </div>
      )}

      {/* Videos Tab */}
      {activeTab === 'videos' && (
        <div className="px-4 space-y-2">
          {YOUTUBE_LINKS.map((link, i) => (
            <a key={i} href={link.url} target="_blank" rel="noopener noreferrer">
              <Card className="flex items-center justify-between hover:border-[#E94560]/30 transition-all">
                <div>
                  <div className="font-semibold text-sm">{link.title}</div>
                  <Badge color="#FF6B35">{link.category}</Badge>
                </div>
                <ExternalLink size={18} className="text-[#8B8B9E] shrink-0" />
              </Card>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};
