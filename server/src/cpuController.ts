import { GameState, GamePhase, PlayerPhase, ActionResult } from '../../src/types';
import { decideCpuAction, decideCpuJumpIn } from '../../src/engine/cpu';
import { processAction } from '../../src/engine/actions';
import { isSpecialCard } from '../../src/engine/rules';
import { autoChooseFaceUp } from '../../src/engine/gameState';

const CPU_TURN_MIN_DELAY = 800;
const CPU_TURN_MAX_DELAY = 1500;
const CPU_JUMPIN_MIN_DELAY = 300;
const CPU_JUMPIN_MAX_DELAY = 800;

function randomDelay(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export interface CpuControllerCallbacks {
  onStateUpdate: (state: GameState, events: ActionResult['events']) => void;
  isCpuSeat: (seatIndex: number) => boolean;
}

export class CpuController {
  private timers: ReturnType<typeof setTimeout>[] = [];
  private callbacks: CpuControllerCallbacks;

  constructor(callbacks: CpuControllerCallbacks) {
    this.callbacks = callbacks;
  }

  /** Run CPU setup choices for all CPU seats starting from the current player. */
  runSetupChoices(state: GameState): GameState {
    let current = state;
    while (
      current.gamePhase === GamePhase.Setup &&
      this.callbacks.isCpuSeat(current.currentPlayerIndex)
    ) {
      const action = autoChooseFaceUp(current, current.currentPlayerIndex);
      const result = processAction(current, action);
      current = result.state;
      this.callbacks.onStateUpdate(current, result.events);
    }
    return current;
  }

  /** Schedule CPU turns if the current player is a CPU. */
  scheduleTurn(state: GameState): void {
    if (state.gamePhase !== GamePhase.Playing) return;
    if (!this.callbacks.isCpuSeat(state.currentPlayerIndex)) return;

    const delay = randomDelay(CPU_TURN_MIN_DELAY, CPU_TURN_MAX_DELAY);
    const timer = setTimeout(() => {
      this.executeCpuTurn(state);
    }, delay);
    this.timers.push(timer);
  }

  /** Schedule CPU jump-in checks after a human or other player's non-special play. */
  scheduleJumpInCheck(state: GameState): void {
    if (!state.jumpInWindow) return;

    const delay = randomDelay(CPU_JUMPIN_MIN_DELAY, CPU_JUMPIN_MAX_DELAY);
    const timer = setTimeout(() => {
      this.executeCpuJumpIn(state);
    }, delay);
    this.timers.push(timer);
  }

  private executeCpuTurn(state: GameState): void {
    if (state.gamePhase !== GamePhase.Playing) return;
    if (!this.callbacks.isCpuSeat(state.currentPlayerIndex)) return;

    const cpuIndex = state.currentPlayerIndex;
    const action = decideCpuAction(state, cpuIndex);

    try {
      const result = processAction(state, action);
      let current = result.state;

      // If REVEAL_TO_HAND, immediately follow up with the play action
      if (action.type === 'REVEAL_TO_HAND' && current.currentPlayerIndex === cpuIndex) {
        const followUp = decideCpuAction(current, cpuIndex);
        const followUpResult = processAction(current, followUp);
        current = followUpResult.state;
        this.callbacks.onStateUpdate(current, [...result.events, ...followUpResult.events]);
      } else {
        this.callbacks.onStateUpdate(current, result.events);
      }

      // Auto-reveal face-down cards for all CPU seats (ensures jump-in readiness)
      this.autoRevealCpuFaceDown(current);
    } catch {
      // CPU action failed — shouldn't happen, but failsafe
    }
  }

  /** Auto-reveal a face-down card for any CPU in FaceDown phase with empty hand. */
  private autoRevealCpuFaceDown(state: GameState): void {
    let current = state;
    for (let i = 0; i < current.players.length; i++) {
      if (!this.callbacks.isCpuSeat(i)) continue;
      const p = current.players[i]!;
      if (p.phase === PlayerPhase.FaceDown && p.hand.length === 0 && p.faceDown.length > 0) {
        try {
          const result = processAction(current, { type: 'REVEAL_TO_HAND', playerIndex: i, slotIndex: 0 });
          current = result.state;
          this.callbacks.onStateUpdate(current, result.events);
        } catch {
          // Ignore
        }
      }
    }
  }

  private executeCpuJumpIn(state: GameState): void {
    if (!state.jumpInWindow) return;

    const playerCount = state.players.length;
    for (let i = 0; i < playerCount; i++) {
      if (!this.callbacks.isCpuSeat(i)) continue;
      const jumpAction = decideCpuJumpIn(state, i);
      if (jumpAction) {
        try {
          const result = processAction(state, jumpAction);
          this.callbacks.onStateUpdate(result.state, result.events);
          return; // Only one jump-in per window
        } catch {
          // Jump-in failed (e.g., window closed) — continue
        }
      }
    }
  }

  stop(): void {
    for (const t of this.timers) clearTimeout(t);
    this.timers = [];
  }
}
