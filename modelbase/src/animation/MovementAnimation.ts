// Movement animation utilities

export interface MovementTarget {
  position: [number, number, number];
  nodeId?: string;
}

export class MovementAnimation {
  private startPosition: [number, number, number];
  private targetPosition: [number, number, number];
  private duration: number; // in milliseconds
  private startTime: number;
  private onComplete?: () => void;
  private easing: (t: number) => number;

  constructor(
    start: [number, number, number],
    target: [number, number, number],
    duration: number = 1000,
    onComplete?: () => void
  ) {
    this.startPosition = [...start];
    this.targetPosition = [...target];
    this.duration = duration;
    this.startTime = Date.now();
    this.onComplete = onComplete;
    this.easing = this.easeInOutCubic;
  }

  // Easing function for smooth animation
  private easeInOutCubic(t: number): number {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  // Get current position based on animation progress
  getCurrentPosition(): [number, number, number] | null {
    const elapsed = Date.now() - this.startTime;
    const progress = Math.min(elapsed / this.duration, 1);
    const eased = this.easing(progress);

    if (progress >= 1) {
      if (this.onComplete) {
        this.onComplete();
      }
      return this.targetPosition;
    }

    return [
      this.startPosition[0] + (this.targetPosition[0] - this.startPosition[0]) * eased,
      this.startPosition[1] + (this.targetPosition[1] - this.startPosition[1]) * eased,
      this.startPosition[2] + (this.targetPosition[2] - this.startPosition[2]) * eased
    ];
  }

  isComplete(): boolean {
    return Date.now() - this.startTime >= this.duration;
  }

  // Calculate duration based on distance
  static calculateDuration(
    start: [number, number, number],
    target: [number, number, number],
    speed: number = 2 // units per second
  ): number {
    const distance = Math.sqrt(
      Math.pow(target[0] - start[0], 2) +
      Math.pow(target[1] - start[1], 2) +
      Math.pow(target[2] - start[2], 2)
    );
    return (distance / speed) * 1000; // Convert to milliseconds
  }
}

