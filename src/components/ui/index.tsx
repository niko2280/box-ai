import React from 'react';
import { motion } from 'framer-motion';
import { getGradeColor } from '../../utils/scoreCalculator';

// Button
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary', size = 'md', loading, children, className = '', ...props
}) => {
  const base = 'font-bold rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95';
  const variants = {
    primary: 'btn-primary text-white shadow-lg',
    secondary: 'glass border border-white/10 text-white hover:border-[#FF0844]/50',
    ghost: 'text-[#A0A0B8] hover:text-white hover:bg-white/5',
    danger: 'bg-[#FF0844]/20 border border-[#FF0844]/30 text-[#FF0844] hover:bg-[#FF0844]/30',
  };
  const sizes = { sm: 'px-4 py-2 text-sm', md: 'px-6 py-3 text-base', lg: 'px-8 py-4 text-lg' };

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin spinner" /> : children}
    </button>
  );
};

// Card
interface CardProps { children: React.ReactNode; className?: string; glass?: boolean; glow?: boolean; }
export const Card: React.FC<CardProps> = ({ children, className = '', glass, glow }) => (
  <div className={`rounded-2xl p-4 card-hover ${glass ? 'glass' : glow ? 'glass-strong neon-red' : 'bg-[#1A1A24] border border-white/5'} ${className}`}>
    {children}
  </div>
);

// ProgressBar
interface ProgressBarProps { value: number; max?: number; color?: string; height?: number; animated?: boolean; }
export const ProgressBar: React.FC<ProgressBarProps> = ({ value, max = 100, color, height = 8, animated = true }) => {
  const pct = Math.min(100, (value / max) * 100);
  const c = color || getGradeColor(value);
  return (
    <div className="w-full rounded-full overflow-hidden progress-bar" style={{ height, background: 'rgba(255,255,255,0.05)' }}>
      <motion.div
        className="h-full rounded-full relative"
        style={{ 
          background: `linear-gradient(90deg, ${c}, ${c}dd)`,
          boxShadow: `0 0 10px ${c}80`
        }}
        initial={animated ? { width: 0 } : { width: `${pct}%` }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
    </div>
  );
};

// CircularProgress
interface CircularProgressProps { value: number; size?: number; strokeWidth?: number; label?: string; sublabel?: string; }
export const CircularProgress: React.FC<CircularProgressProps> = ({
  value, size = 120, strokeWidth = 10, label, sublabel
}) => {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  const color = getGradeColor(value);

  return (
    <div className="relative flex items-center justify-center circular-progress" style={{ width: size, height: size, color }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', filter: `drop-shadow(0 0 20px ${color})` }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-black text-white" style={{ fontSize: size * 0.25, textShadow: `0 0 20px ${color}` }}>{value}</div>
        {label && <div className="text-[#A0A0B8]" style={{ fontSize: size * 0.1 }}>{label}</div>}
        {sublabel && <div className="font-black" style={{ color, fontSize: size * 0.14 }}>{sublabel}</div>}
      </div>
    </div>
  );
};

// Badge
interface BadgeProps { children: React.ReactNode; color?: string; }
export const Badge: React.FC<BadgeProps> = ({ children, color = '#E94560' }) => (
  <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
    {children}
  </span>
);

// ScoreRow
interface ScoreRowProps { label: string; icon: string; value: number; }
export const ScoreRow: React.FC<ScoreRowProps> = ({ label, icon, value }) => (
  <div className="flex items-center gap-3">
    <span className="text-lg w-6">{icon}</span>
    <span className="text-sm text-[#8B8B9E] w-20 shrink-0">{label}</span>
    <div className="flex-1"><ProgressBar value={value} /></div>
    <span className="text-sm font-bold w-8 text-right" style={{ color: getGradeColor(value) }}>{value}</span>
  </div>
);

// Modal
interface ModalProps { open: boolean; onClose: () => void; title?: string; children: React.ReactNode; }
export const Modal: React.FC<ModalProps> = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-lg bg-[#1A1A2E] rounded-3xl p-6 border border-white/10 max-h-[90vh] overflow-y-auto"
        initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      >
        {title && <h2 className="text-xl font-bold mb-4">{title}</h2>}
        {children}
      </motion.div>
    </motion.div>
  );
};
