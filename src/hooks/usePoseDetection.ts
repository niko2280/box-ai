import { useRef, useCallback, useState } from 'react';
import type { CategoryScores } from '../types';

export interface PunchEvent {
  type: 'jab' | 'cross' | 'hook' | 'uppercut';
  timestamp: number;
  score: number;
}

export const usePoseDetection = (_stance: 'orthodox' | 'southpaw', _showSkeleton: boolean) => {
  const [isReady, setIsReady] = useState(true); // Always ready in mock mode
  const [currentPunchCount, setCurrentPunchCount] = useState(0);
  const [lastPunchType, setLastPunchType] = useState<string>('');
  const punchLogRef = useRef<PunchEvent[]>([]);
  const animFrameRef = useRef<number>(0);

  const init = useCallback(async () => {
    // Mock initialization - instant ready
    setIsReady(true);
  }, []);

  const startDetection = useCallback((
    _videoEl: HTMLVideoElement,
    _canvasEl: HTMLCanvasElement
  ) => {
    punchLogRef.current = [];
    setCurrentPunchCount(0);

    // Simulate punch detection with random punches
    const simulatePunches = () => {
      if (Math.random() > 0.97) { // ~3% chance per frame
        const types: ('jab' | 'cross' | 'hook' | 'uppercut')[] = ['jab', 'cross', 'hook', 'uppercut'];
        const type = types[Math.floor(Math.random() * types.length)];
        const score = Math.floor(Math.random() * 30) + 60; // 60-90
        
        punchLogRef.current.push({ type, timestamp: Date.now(), score });
        setCurrentPunchCount(punchLogRef.current.length);
        setLastPunchType(type);
      }

      animFrameRef.current = requestAnimationFrame(simulatePunches);
    };

    animFrameRef.current = requestAnimationFrame(simulatePunches);
  }, []);

  const stopDetection = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
  }, []);

  const getResults = useCallback((duration: number): { 
    scores: CategoryScores; 
    punchLog: PunchEvent[];
    state: any;
  } => {
    const log = punchLogRef.current;
    const jabCount = log.filter(p => p.type === 'jab').length;
    const crossCount = log.filter(p => p.type === 'cross').length;
    const hookCount = log.filter(p => p.type === 'hook').length;
    const uppercutCount = log.filter(p => p.type === 'uppercut').length;

    // Generate realistic scores based on punch counts
    const scores: CategoryScores = {
      jab: Math.min(100, 40 + jabCount * 3),
      cross: Math.min(100, 40 + crossCount * 3),
      hook: Math.min(100, 35 + hookCount * 4),
      uppercut: Math.min(100, 35 + uppercutCount * 4),
      defense: Math.floor(Math.random() * 30) + 50,
      footwork: Math.floor(Math.random() * 30) + 50,
      stance: Math.floor(Math.random() * 30) + 55,
      speed: Math.min(100, 45 + log.length * 2),
      combos: Math.floor(Math.random() * 25) + 40,
    };

    return {
      scores,
      punchLog: log,
      state: {
        punchLog: log,
        guardFrames: Math.floor(duration * 20),
        totalFrames: Math.floor(duration * 30),
        stanceFrames: Math.floor(duration * 25),
        footPositions: []
      }
    };
  }, []);

  return { init, isReady, startDetection, stopDetection, getResults, currentPunchCount, lastPunchType };
};
