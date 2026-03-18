export const TURN_TIMEOUT_MS = 30_000;

export class TurnTimer {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private startTime = 0;
  private readonly duration: number;
  private readonly onTick: (remainingMs: number, totalMs: number) => void;
  private readonly onExpiry: () => void;
  private tickInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    onExpiry: () => void,
    onTick: (remainingMs: number, totalMs: number) => void,
    duration: number = TURN_TIMEOUT_MS
  ) {
    this.onExpiry = onExpiry;
    this.onTick = onTick;
    this.duration = duration;
  }

  start(): void {
    this.stop();
    this.startTime = Date.now();

    this.timer = setTimeout(() => {
      this.stop();
      this.onExpiry();
    }, this.duration);

    // Tick every 5 seconds to broadcast remaining time
    this.tickInterval = setInterval(() => {
      const elapsed = Date.now() - this.startTime;
      const remaining = Math.max(0, this.duration - elapsed);
      this.onTick(remaining, this.duration);
    }, 5000);

    // Immediately broadcast the initial time
    this.onTick(this.duration, this.duration);
  }

  stop(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  getRemaining(): number {
    if (!this.timer) return 0;
    return Math.max(0, this.duration - (Date.now() - this.startTime));
  }

  isRunning(): boolean {
    return this.timer !== null;
  }
}
