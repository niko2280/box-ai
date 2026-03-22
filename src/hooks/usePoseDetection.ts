import { useRef, useCallback, useState } from 'react';
import * as posenet from '@tensorflow-models/posenet';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';
import * as tf from '@tensorflow/tfjs-core';
import type { CategoryScores } from '../types';

export interface PunchEvent {
  type: 'jab' | 'cross' | 'hook' | 'uppercut';
  timestamp: number;
  score: number;
}

interface PoseState {
  prevPoses: any[];
  punchLog: PunchEvent[];
  lastPunchTime: number;
  guardFrames: number;
  totalFrames: number;
}

export const usePoseDetection = (stance: 'orthodox' | 'southpaw', showSkeleton: boolean) => {
  const netRef = useRef<posenet.PoseNet | null>(null);
  const stateRef = useRef<PoseState>({ prevPoses: [], punchLog: [], lastPunchTime: 0, guardFrames: 0, totalFrames: 0 });
  const animFrameRef = useRef<number>(0);
  const [isReady, setIsReady] = useState(false);
  const [currentPunchCount, setCurrentPunchCount] = useState(0);
  const [lastPunchType, setLastPunchType] = useState<string>('');

  const init = useCallback(async () => {
    try {
      await tf.setBackend('webgl');
      await tf.ready();
    } catch {
      await tf.setBackend('cpu');
      await tf.ready();
    }
    
    netRef.current = await posenet.load({
      architecture: 'MobileNetV1',
      outputStride: 16,
      inputResolution: { width: 640, height: 480 },
      multiplier: 0.75
    });
    setIsReady(true);
  }, []);

  const detectPunch = (curr: any, prev: any, stance: string): PunchEvent | null => {
    if (!curr || !prev) return null;

    const frontWrist = stance === 'orthodox' ? curr.keypoints[9] : curr.keypoints[10];
    const backWrist = stance === 'orthodox' ? curr.keypoints[10] : curr.keypoints[9];
    const prevFrontWrist = stance === 'orthodox' ? prev.keypoints[9] : prev.keypoints[10];
    const prevBackWrist = stance === 'orthodox' ? prev.keypoints[10] : prev.keypoints[9];

    if (!frontWrist || !backWrist || !prevFrontWrist || !prevBackWrist) return null;

    const frontSpeed = Math.sqrt(
      Math.pow(frontWrist.position.x - prevFrontWrist.position.x, 2) +
      Math.pow(frontWrist.position.y - prevFrontWrist.position.y, 2)
    );

    const backSpeed = Math.sqrt(
      Math.pow(backWrist.position.x - prevBackWrist.position.x, 2) +
      Math.pow(backWrist.position.y - prevBackWrist.position.y, 2)
    );

    const timestamp = Date.now();

    // JAB: front hand moves forward fast
    if (frontSpeed > 30 && frontWrist.score > 0.5) {
      const score = Math.min(100, Math.round(frontSpeed * 2 + 40));
      return { type: 'jab', timestamp, score };
    }

    // CROSS: back hand moves forward fast
    if (backSpeed > 25 && backWrist.score > 0.5) {
      const score = Math.min(100, Math.round(backSpeed * 2.5 + 40));
      return { type: 'cross', timestamp, score };
    }

    // HOOK: lateral movement
    const lateralMove = Math.abs(backWrist.position.x - prevBackWrist.position.x);
    if (lateralMove > 35 && backWrist.score > 0.5) {
      const score = Math.min(100, Math.round(lateralMove * 2 + 45));
      return { type: 'hook', timestamp, score };
    }

    // UPPERCUT: upward movement
    const upwardMove = prevBackWrist.position.y - backWrist.position.y;
    if (upwardMove > 30 && backWrist.score > 0.5) {
      const score = Math.min(100, Math.round(upwardMove * 2.5 + 40));
      return { type: 'uppercut', timestamp, score };
    }

    return null;
  };

  const startDetection = useCallback((
    videoEl: HTMLVideoElement,
    canvasEl: HTMLCanvasElement
  ) => {
    stateRef.current = { prevPoses: [], punchLog: [], lastPunchTime: 0, guardFrames: 0, totalFrames: 0 };
    setCurrentPunchCount(0);

    const detect = async () => {
      if (!netRef.current || videoEl.readyState < 2) {
        animFrameRef.current = requestAnimationFrame(detect);
        return;
      }

      try {
        const pose = await netRef.current.estimateSinglePose(videoEl, {
          flipHorizontal: true
        });

        const ctx = canvasEl.getContext('2d');
        if (ctx && showSkeleton && pose.score > 0.3) {
          ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
          
          // Draw skeleton
          const adjacentKeyPoints = posenet.getAdjacentKeyPoints(pose.keypoints, 0.5);
          adjacentKeyPoints.forEach(([from, to]) => {
            ctx.beginPath();
            ctx.moveTo(from.position.x, from.position.y);
            ctx.lineTo(to.position.x, to.position.y);
            ctx.strokeStyle = '#FF0844';
            ctx.lineWidth = 2;
            ctx.stroke();
          });

          // Draw keypoints
          pose.keypoints.forEach(kp => {
            if (kp.score > 0.5) {
              ctx.beginPath();
              ctx.arc(kp.position.x, kp.position.y, 4, 0, Math.PI * 2);
              ctx.fillStyle = '#00F5FF';
              ctx.fill();
            }
          });
        }

        stateRef.current.totalFrames++;

        // Detect punches
        if (stateRef.current.prevPoses.length > 0) {
          const prev = stateRef.current.prevPoses[stateRef.current.prevPoses.length - 1];
          const now = Date.now();
          
          if (now - stateRef.current.lastPunchTime > 400) {
            const punch = detectPunch(pose, prev, stance);
            if (punch) {
              stateRef.current.punchLog.push(punch);
              stateRef.current.lastPunchTime = now;
              setCurrentPunchCount(stateRef.current.punchLog.length);
              setLastPunchType(punch.type);
            }
          }
        }

        // Guard detection
        const nose = pose.keypoints[0];
        const leftWrist = pose.keypoints[9];
        const rightWrist = pose.keypoints[10];
        
        if (nose.score > 0.5 && leftWrist.score > 0.5 && rightWrist.score > 0.5) {
          const distL = Math.sqrt(
            Math.pow(leftWrist.position.x - nose.position.x, 2) +
            Math.pow(leftWrist.position.y - nose.position.y, 2)
          );
          const distR = Math.sqrt(
            Math.pow(rightWrist.position.x - nose.position.x, 2) +
            Math.pow(rightWrist.position.y - nose.position.y, 2)
          );
          
          if (distL < 150 || distR < 150) {
            stateRef.current.guardFrames++;
          }
        }

        stateRef.current.prevPoses = [...stateRef.current.prevPoses, pose].slice(-5);
      } catch (e) {
        console.error('Pose detection error:', e);
      }

      animFrameRef.current = requestAnimationFrame(detect);
    };

    animFrameRef.current = requestAnimationFrame(detect);
  }, [stance, showSkeleton]);

  const stopDetection = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
  }, []);

  const getResults = useCallback((duration: number): { 
    scores: CategoryScores; 
    punchLog: PunchEvent[];
    state: any;
  } => {
    const { punchLog, guardFrames, totalFrames } = stateRef.current;
    
    const jabCount = punchLog.filter(p => p.type === 'jab').length;
    const crossCount = punchLog.filter(p => p.type === 'cross').length;
    const hookCount = punchLog.filter(p => p.type === 'hook').length;
    const uppercutCount = punchLog.filter(p => p.type === 'uppercut').length;

    const avgScore = (arr: PunchEvent[]) =>
      arr.length > 0 ? Math.round(arr.reduce((s, p) => s + p.score, 0) / arr.length) : 30;

    const jabs = punchLog.filter(p => p.type === 'jab');
    const crosses = punchLog.filter(p => p.type === 'cross');
    const hooks = punchLog.filter(p => p.type === 'hook');
    const uppercuts = punchLog.filter(p => p.type === 'uppercut');

    const scores: CategoryScores = {
      jab: jabs.length > 0 ? Math.min(100, avgScore(jabs) + Math.min(jabCount * 2, 20)) : 25,
      cross: crosses.length > 0 ? Math.min(100, avgScore(crosses) + Math.min(crossCount * 2, 20)) : 25,
      hook: hooks.length > 0 ? Math.min(100, avgScore(hooks) + Math.min(hookCount * 3, 20)) : 25,
      uppercut: uppercuts.length > 0 ? Math.min(100, avgScore(uppercuts) + Math.min(uppercutCount * 3, 20)) : 25,
      defense: totalFrames > 0 ? Math.min(100, Math.round((guardFrames / totalFrames) * 120 + 20)) : 30,
      footwork: Math.min(100, 40 + punchLog.length),
      stance: Math.min(100, 45 + Math.floor(Math.random() * 20)),
      speed: Math.min(100, 30 + punchLog.length * 3),
      combos: Math.min(100, 35 + Math.floor(punchLog.length / 3) * 10),
    };

    return {
      scores,
      punchLog,
      state: stateRef.current
    };
  }, []);

  return { init, isReady, startDetection, stopDetection, getResults, currentPunchCount, lastPunchType };
};
