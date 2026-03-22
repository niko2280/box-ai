export class SoundManager {
  private enabled: boolean = true;
  private audioContext: AudioContext | null = null;

  constructor(enabled: boolean = true) {
    this.enabled = enabled;
    if (typeof window !== 'undefined' && enabled) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private playTone(frequency: number, duration: number, volume: number = 0.3) {
    if (!this.enabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  playPunch(type: 'jab' | 'cross' | 'hook' | 'uppercut') {
    const frequencies = {
      jab: 800,
      cross: 600,
      hook: 500,
      uppercut: 700
    };
    this.playTone(frequencies[type], 0.1, 0.2);
  }

  playCombo(count: number) {
    for (let i = 0; i < Math.min(count, 5); i++) {
      setTimeout(() => {
        this.playTone(1000 + i * 200, 0.08, 0.15);
      }, i * 80);
    }
  }

  playCountdown() {
    this.playTone(800, 0.2, 0.3);
  }

  playStart() {
    this.playTone(1200, 0.3, 0.4);
    setTimeout(() => this.playTone(1500, 0.3, 0.4), 150);
  }

  playEnd() {
    this.playTone(600, 0.5, 0.4);
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
}

export const soundManager = new SoundManager();
