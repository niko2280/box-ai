import { useRef, useCallback, useState, useEffect } from 'react';
import * as posenet from '@tensorflow-models/posenet';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';
import * as tf from '@tensorflow/tfjs-core';
import type { CategoryScores } from '../types';
import { soundManager } from '../utils/soundManager';
import { hapticManager } from '../utils/hapticManager';

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
  lastComboTime: number;
  currentCombo: number;
  footPositions: { x: number; y: number; time: number }[];
}

const PUNCH_COOLDOWN = 300; // ms between punches
const COMBO_WINDOW = 1500; // ms for combo detection

export const usePoseDetection = (stance: 'orthodox' | 'southpaw', showSkeleton: boolean) => {
  const netRef = useRef<posenet.PoseNet | null>(null);
  const stateRef = useRef<PoseState>({
    prevPoses: [],
    punchLog: [],
    lastPunchTime: 0,
    guardFrames: 0,
    totalFrames: 0,
    lastComboTime: 0,
    currentCombo: 0,
    footPositions: []
  });
  const animFrameRef = useRef<number>(0);
  const [isReady, setIsReady] = useState(false);
  const [currentPunchCount, setCurrentPunchCount] = useState(0);
  const [lastPunchType, setLastPunchType] = useState<string>('');
  const [comboCount, setComboCount] = useState(0);

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

  const getDistance = (p1: any, p2: any) => {
    return Math.sqrt(
      Math.pow(p1.position.x - p2.position.x, 2) +
      Math.pow(p1.position.y - p2.position.y, 2)
    );
  };

  const getAngle = (p1: any, p2: any, p3: any) => {
    const v1 = { x: p1.position.x - p2.position.x, y: p1.position.y - p2.position.y };
    const v2 = { x: p3.position.x - p2.position.x, y: p3.position.y - p2.position.y };
    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
    if (mag1 === 0 || mag2 === 0) return 0;
    return Math.acos(Math.max(-1, Math.min(1, dot / (mag1 * mag2)))) * (180 / Math.PI);
  };

  const detectPunch = (curr: any, prev: any, stance: string): PunchEvent | null => {
    if (!curr || !prev || curr.score < 0.3 || prev.score < 0.3) return null;

    const isOrthodox = stance === 'orthodox';
    
    // Keypoint indices
    const frontWristIdx = isOrthodox ? 9 : 10;
    const backWristIdx = isOrthodox ? 10 : 9;
    const frontElbowIdx = isOrthodox ? 7 : 8;
    const backElbowIdx = isOrthodox ? 8 : 7;
    const frontShoulderIdx = isOrthodox ? 5 : 6;
    const backShoulderIdx = isOrthodox ? 6 : 5;
    const leftHipIdx = 11;
    const rightHipIdx = 12;

    const frontWrist = curr.keypoints[frontWristIdx];
    const backWrist = curr.keypoints[backWristIdx];
    const frontElbow = curr.keypoints[frontElbowIdx];
    const backElbow = curr.keypoints[backElbowIdx];
    const frontShoulder = curr.keypoints[frontShoulderIdx];
    const backShoulder = curr.keypoints[backShoulderIdx];
    const leftHip = curr.keypoints[leftHipIdx];
    const rightHip = curr.keypoints[rightHipIdx];
    const nose = curr.keypoints[0];

    const prevFrontWrist = prev.keypoints[frontWristIdx];
    const prevBackWrist = prev.keypoints[backWristIdx];
    const prevLeftHip = prev.keypoints[leftHipIdx];
    const prevRightHip = prev.keypoints[rightHipIdx];

    if (!frontWrist || !backWrist || !prevFrontWrist || !prevBackWrist) return null;
    if (frontWrist.score < 0.4 || backWrist.score < 0.4) return null;

    const timestamp = Date.now();

    // Calculate speeds
    const frontSpeed = getDistance(frontWrist, prevFrontWrist);
    const backSpeed = getDistance(backWrist, prevBackWrist);

    // Calculate angles
    const frontElbowAngle = frontElbow && frontShoulder ? getAngle(frontShoulder, frontElbow, frontWrist) : 0;
    const backElbowAngle = backElbow && backShoulder ? getAngle(backShoulder, backElbow, backWrist) : 0;

    // Hip rotation
    let hipRotation = 0;
    if (leftHip && rightHip && prevLeftHip && prevRightHip && 
        leftHip.score > 0.4 && rightHip.score > 0.4) {
      const currHipDist = Math.abs(leftHip.position.x - rightHip.position.x);
      const prevHipDist = Math.abs(prevLeftHip.position.x - prevRightHip.position.x);
      hipRotation = Math.abs(currHipDist - prevHipDist);
    }

    // JAB: Front hand extends fast, straight punch
    if (frontSpeed > 25 && frontElbowAngle > 140) {
      const forwardMovement = isOrthodox ? 
        (prevFrontWrist.position.x - frontWrist.position.x) :
        (frontWrist.position.x - prevFrontWrist.position.x);
      
      if (forwardMovement > 10) {
        const score = Math.min(100, Math.round(
          (frontSpeed / 50) * 30 +
          (frontElbowAngle / 180) * 25 +
          (forwardMovement / 30) * 25 +
          20
        ));
        return { type: 'jab', timestamp, score };
      }
    }

    // CROSS: Back hand extends with hip rotation
    if (backSpeed > 20 && backElbowAngle > 135 && hipRotation > 3) {
      const forwardMovement = isOrthodox ?
        (prevBackWrist.position.x - backWrist.position.x) :
        (backWrist.position.x - prevBackWrist.position.x);

      if (forwardMovement > 8) {
        const score = Math.min(100, Math.round(
          (backSpeed / 45) * 25 +
          (backElbowAngle / 180) * 20 +
          (hipRotation / 15) * 30 +
          25
        ));
        return { type: 'cross', timestamp, score };
      }
    }

    // HOOK: Lateral movement, bent elbow
    const lateralMove = Math.abs(backWrist.position.x - prevBackWrist.position.x);
    if (lateralMove > 30 && backElbowAngle > 70 && backElbowAngle < 120) {
      const wristAtHeadLevel = nose && Math.abs(backWrist.position.y - nose.position.y) < 100;
      if (wristAtHeadLevel) {
        const score = Math.min(100, Math.round(
          (lateralMove / 50) * 35 +
          (90 - Math.abs(90 - backElbowAngle)) * 0.5 +
          30
        ));
        return { type: 'hook', timestamp, score };
      }
    }

    // UPPERCUT: Upward movement from below
    const upwardMove = prevBackWrist.position.y - backWrist.position.y;
    if (upwardMove > 25 && backElbowAngle < 120) {
      const wristBelowShoulder = backShoulder && prevBackWrist.position.y > backShoulder.position.y;
      if (wristBelowShoulder) {
        const score = Math.min(100, Math.round(
          (upwardMove / 40) * 40 +
          (120 - backElbowAngle) * 0.4 +
          30
        ));
        return { type: 'uppercut', timestamp, score };
      }
    }

    return null;
  };

  const startDetection = useCallback((
    videoEl: HTMLVideoElement,
    canvasEl: HTMLCanvasElement
  ) => {
    stateRef.current = {
      prevPoses: [],
      punchLog: [],
      lastPunchTime: 0,
      guardFrames: 0,
      totalFrames: 0,
      lastComboTime: 0,
      currentCombo: 0,
      footPositions: []
    };
    setCurrentPunchCount(0);
    setComboCount(0);

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
        if (ctx) {
          ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

          if (showSkeleton && pose.score > 0.3) {
            const adjacentKeyPoints = posenet.getAdjacentKeyPoints(pose.keypoints, 0.5);
            
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#FF0844';
            
            adjacentKeyPoints.forEach(([from, to]) => {
              ctx.beginPath();
              ctx.moveTo(from.position.x, from.position.y);
              ctx.lineTo(to.position.x, to.position.y);
              ctx.strokeStyle = '#FF0844';
              ctx.lineWidth = 3;
              ctx.stroke();
            });

            pose.keypoints.forEach(kp => {
              if (kp.score > 0.5) {
                ctx.beginPath();
                ctx.arc(kp.position.x, kp.position.y, 5, 0, Math.PI * 2);
                ctx.fillStyle = '#00F5FF';
                ctx.shadowColor = '#00F5FF';
                ctx.fill();
              }
            });
          }
        }

        stateRef.current.totalFrames++;

        // Detect punches
        if (stateRef.current.prevPoses.length > 0) {
          const prev = stateRef.current.prevPoses[stateRef.current.prevPoses.length - 1];
          const now = Date.now();

          if (now - stateRef.current.lastPunchTime > PUNCH_COOLDOWN) {
            const punch = detectPunch(pose, prev, stance);
            
            if (punch) {
              stateRef.current.punchLog.push(punch);
              stateRef.current.lastPunchTime = now;
              setCurrentPunchCount(stateRef.current.punchLog.length);
              setLastPunchType(punch.type);

              // Combo detection
              if (now - stateRef.current.lastComboTime < COMBO_WINDOW) {
                stateRef.current.currentCombo++;
              } else {
                stateRef.current.currentCombo = 1;
              }
              stateRef.current.lastComboTime = now;

              if (stateRef.current.currentCombo >= 2) {
                setComboCount(stateRef.current.currentCombo);
                soundManager.playCombo(stateRef.current.currentCombo);
                hapticManager.comboFeedback(stateRef.current.currentCombo);
              } else {
                soundManager.playPunch(punch.type);
                hapticManager.punchFeedback(punch.type);
              }
            }
          }
        }

        // Guard detection
        const nose = pose.keypoints[0];
        const leftWrist = pose.keypoints[9];
        const rightWrist = pose.keypoints[10];

        if (nose.score > 0.5 && leftWrist.score > 0.5 && rightWrist.score > 0.5) {
          const distL = getDistance(leftWrist, nose);
          const distR = getDistance(rightWrist, nose);

          if (distL < 120 || distR < 120) {
            stateRef.current.guardFrames++;
          }
        }

        // Footwork tracking
        const leftAnkle = pose.keypoints[15];
        const rightAnkle = pose.keypoints[16];
        if (leftAnkle.score > 0.5 && rightAnkle.score > 0.5) {
          const centerX = (leftAnkle.position.x + rightAnkle.position.x) / 2;
          const centerY = (leftAnkle.position.y + rightAnkle.position.y) / 2;
          stateRef.current.footPositions.push({ x: centerX, y: centerY, time: Date.now() });
          if (stateRef.current.footPositions.length > 50) {
            stateRef.current.footPositions.shift();
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

  const getResults = useCallback((_duration: number): {
    scores: CategoryScores;
    punchLog: PunchEvent[];
    state: any;
  } => {
    const { punchLog, guardFrames, totalFrames, footPositions } = stateRef.current;

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

    // Calculate footwork score based on movement
    let footworkScore = 35;
    if (footPositions.length > 10) {
      let totalMovement = 0;
      for (let i = 1; i < footPositions.length; i++) {
        const dist = Math.sqrt(
          Math.pow(footPositions[i].x - footPositions[i - 1].x, 2) +
          Math.pow(footPositions[i].y - footPositions[i - 1].y, 2)
        );
        totalMovement += dist;
      }
      const avgMovement = totalMovement / footPositions.length;
      footworkScore = Math.min(100, Math.round(35 + avgMovement * 2));
    }

    // Calculate combo score
    let comboScore = 30;
    let comboCount = 0;
    let currentComboLen = 1;
    for (let i = 1; i < punchLog.length; i++) {
      if (punchLog[i].timestamp - punchLog[i - 1].timestamp < COMBO_WINDOW) {
        currentComboLen++;
      } else {
        if (currentComboLen >= 2) comboCount++;
        currentComboLen = 1;
      }
    }
    if (currentComboLen >= 2) comboCount++;
    comboScore = Math.min(100, 30 + comboCount * 8);

    const scores: CategoryScores = {
      jab: jabs.length > 0 ? Math.min(100, avgScore(jabs) + Math.min(jabCount * 2, 25)) : 25,
      cross: crosses.length > 0 ? Math.min(100, avgScore(crosses) + Math.min(crossCount * 2, 25)) : 25,
      hook: hooks.length > 0 ? Math.min(100, avgScore(hooks) + Math.min(hookCount * 3, 25)) : 25,
      uppercut: uppercuts.length > 0 ? Math.min(100, avgScore(uppercuts) + Math.min(uppercutCount * 3, 25)) : 25,
      defense: totalFrames > 0 ? Math.min(100, Math.round((guardFrames / totalFrames) * 120 + 25)) : 30,
      footwork: footworkScore,
      stance: Math.min(100, 50 + Math.floor(Math.random() * 15)),
      speed: Math.min(100, 35 + punchLog.length * 2.5),
      combos: comboScore,
    };

    return {
      scores,
      punchLog,
      state: stateRef.current
    };
  }, []);

  useEffect(() => {
    const profile = localStorage.getItem('shadowcoach_profile');
    if (profile) {
      const { soundEnabled, vibrationEnabled } = JSON.parse(profile);
      soundManager.setEnabled(soundEnabled !== false);
      hapticManager.setEnabled(vibrationEnabled !== false);
    }
  }, []);

  return { init, isReady, startDetection, stopDetection, getResults, currentPunchCount, lastPunchType, comboCount };
};
