export class HapticManager {
  private enabled: boolean = true;

  constructor(enabled: boolean = true) {
    this.enabled = enabled;
  }

  private vibrate(pattern: number | number[]) {
    if (!this.enabled || !navigator.vibrate) return;
    navigator.vibrate(pattern);
  }

  punchFeedback(type: 'jab' | 'cross' | 'hook' | 'uppercut') {
    const patterns = {
      jab: 20,
      cross: 30,
      hook: [20, 10, 20],
      uppercut: 40
    };
    this.vibrate(patterns[type]);
  }

  comboFeedback(count: number) {
    const pattern = Array(Math.min(count, 5)).fill([30, 50]).flat();
    this.vibrate(pattern);
  }

  successFeedback() {
    this.vibrate([50, 50, 100]);
  }

  errorFeedback() {
    this.vibrate([100, 50, 100]);
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
}

export const hapticManager = new HapticManager();
