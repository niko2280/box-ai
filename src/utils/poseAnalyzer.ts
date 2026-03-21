import type { CategoryScores } from '../types';

export interface PoseFrame {
  keypoints: any[];
  timestamp: number;
}

export interface PunchDetectionState {
  prevFrames: PoseFrame[];
  punchLog: any[];
  lastPunchTime: number;
  guardFrames: number;
  totalFrames: number;
  stanceFrames: number;
  footPositions: { x: number; y: number }[];
}

export const createDetectionState = (): PunchDetectionState => ({
  prevFrames: [],
  punchLog: [],
  lastPunchTime: 0,
  guardFrames: 0,
  totalFrames: 0,
  stanceFrames: 0,
  footPositions: []
});

export const processFrame = (
  state: PunchDetectionState,
  _keypoints: any[],
  _timestamp: number,
  _stance: 'orthodox' | 'southpaw'
): PunchDetectionState => {
  return state; // Mock implementation
};

export const calcScoresFromState = (_state: PunchDetectionState, _duration: number): CategoryScores => {
  return {
    jab: 50, cross: 50, hook: 50, uppercut: 50,
    defense: 50, footwork: 50, stance: 50, speed: 50, combos: 50
  };
};

export const drawPose = (
  _ctx: CanvasRenderingContext2D,
  _keypoints: any[],
  _scores: { jab: number; defense: number }
) => {
  // Mock implementation - no drawing
};
