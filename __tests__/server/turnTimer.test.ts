import { TurnTimer } from '../../server/src/turnTimer';

describe('TurnTimer', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('calls onExpiry after duration', () => {
    const onExpiry = jest.fn();
    const onTick = jest.fn();
    const timer = new TurnTimer(onExpiry, onTick, 5000);

    timer.start();
    expect(onExpiry).not.toHaveBeenCalled();

    jest.advanceTimersByTime(5000);
    expect(onExpiry).toHaveBeenCalledTimes(1);

    timer.stop();
  });

  it('does not fire after stop', () => {
    const onExpiry = jest.fn();
    const onTick = jest.fn();
    const timer = new TurnTimer(onExpiry, onTick, 5000);

    timer.start();
    timer.stop();
    jest.advanceTimersByTime(10000);
    expect(onExpiry).not.toHaveBeenCalled();
  });

  it('broadcasts tick immediately on start', () => {
    const onExpiry = jest.fn();
    const onTick = jest.fn();
    const timer = new TurnTimer(onExpiry, onTick, 30000);

    timer.start();
    expect(onTick).toHaveBeenCalledWith(30000, 30000);

    timer.stop();
  });

  it('restart resets the timer', () => {
    const onExpiry = jest.fn();
    const onTick = jest.fn();
    const timer = new TurnTimer(onExpiry, onTick, 5000);

    timer.start();
    jest.advanceTimersByTime(3000);
    timer.start(); // restart
    jest.advanceTimersByTime(3000);
    expect(onExpiry).not.toHaveBeenCalled();

    jest.advanceTimersByTime(2000);
    expect(onExpiry).toHaveBeenCalledTimes(1);

    timer.stop();
  });

  it('isRunning reflects state', () => {
    const onExpiry = jest.fn();
    const onTick = jest.fn();
    const timer = new TurnTimer(onExpiry, onTick, 5000);

    expect(timer.isRunning()).toBe(false);
    timer.start();
    expect(timer.isRunning()).toBe(true);
    timer.stop();
    expect(timer.isRunning()).toBe(false);
  });
});
