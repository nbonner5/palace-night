import {
  Action,
  GameConfig,
  GamePhase,
  GameState,
  GameEvent,
} from '../../src/types';
import { createGame } from '../../src/engine/gameState';
import { processAction } from '../../src/engine/actions';
import { decideCpuAction } from '../../src/engine/cpu';
import { isSpecialCard, canPlayOn } from '../../src/engine/rules';
import { Card, PlayerPhase } from '../../src/types';
import { FilteredGameState, ServerMessage } from '../../src/types/multiplayer';
import { filterStateForPlayer } from './stateFilter';
import { validatePlayerAction } from './validation';
import { TurnTimer, TURN_TIMEOUT_MS } from './turnTimer';
import { CpuController } from './cpuController';
import { Lobby } from './lobbyManager';

export interface SeatInfo {
  playerId: string | null; // null = CPU seat
  displayName: string;
  connected: boolean;
}

export type BroadcastFn = (seatIndex: number, msg: ServerMessage) => void;

export class GameRoom {
  readonly lobbyId: string;
  private state: GameState;
  private stateVersion = 0;
  private seats: SeatInfo[];
  private turnTimer: TurnTimer;
  private cpuController: CpuController;
  private broadcast: BroadcastFn;
  private leaderboard: Record<number, number>;
  private pendingSetupChoices: Map<number, readonly string[]> = new Map();
  private humanSeatsNeedingSetup: Set<number> = new Set();
  private pendingReveal: { seatIndex: number; slotIndex: number } | null = null;

  constructor(lobby: Lobby, broadcast: BroadcastFn, initialLeaderboard?: Record<number, number>) {
    this.lobbyId = lobby.id;
    this.broadcast = broadcast;
    this.leaderboard = initialLeaderboard ? { ...initialLeaderboard } : {};

    // Build seat map: participants by seat index, fill empty with CPU
    const maxPlayers = lobby.config.maxPlayers;
    this.seats = [];
    const participantsBySeat = new Map<number, { playerId: string; displayName: string }>();
    for (const p of lobby.participants.values()) {
      participantsBySeat.set(p.seatIndex, {
        playerId: p.playerId,
        displayName: p.displayName,
      });
    }

    for (let i = 0; i < maxPlayers; i++) {
      const p = participantsBySeat.get(i);
      if (p) {
        this.seats.push({ playerId: p.playerId, displayName: p.displayName, connected: true });
      } else {
        this.seats.push({ playerId: null, displayName: `CPU ${i + 1}`, connected: true });
      }
    }

    // Create game
    const config: GameConfig = {
      cpuCount: maxPlayers - 1, // total players = maxPlayers, "cpuCount" is used for player count calc
      deckCount: lobby.config.deckCount,
      includeJokers: lobby.config.includeJokers,
    };
    this.state = createGame(config);
    this.stateVersion = 1;

    // Turn timer
    this.turnTimer = new TurnTimer(
      () => this.onTurnTimerExpiry(),
      (remaining, total) => this.broadcastTurnTimer(remaining, total)
    );

    // CPU controller
    this.cpuController = new CpuController({
      onStateUpdate: (newState, events) => this.onCpuAction(newState, events),
      isCpuSeat: (seatIndex) => this.isCpuSeat(seatIndex),
    });

    // Run CPU setup choices, then start
    this.state = this.cpuController.runSetupChoices(this.state);
    this.stateVersion++;

    // If still in setup phase, track which human seats need to choose
    if (this.state.gamePhase === GamePhase.Setup) {
      for (let i = 0; i < this.seats.length; i++) {
        if (!this.isCpuSeat(i)) {
          this.humanSeatsNeedingSetup.add(i);
        }
      }
    }
  }

  getState(): GameState {
    return this.state;
  }

  getVersion(): number {
    return this.stateVersion;
  }

  isFinished(): boolean {
    return this.state.gamePhase === GamePhase.Finished;
  }

  getLeaderboard(): Record<number, number> {
    return { ...this.leaderboard };
  }

  getSeatIndex(playerId: string): number {
    return this.seats.findIndex((s) => s.playerId === playerId);
  }

  isCpuSeat(seatIndex: number): boolean {
    const seat = this.seats[seatIndex];
    return !seat || seat.playerId === null || !seat.connected;
  }

  getFilteredState(seatIndex: number): FilteredGameState {
    return filterStateForPlayer(
      this.state,
      seatIndex,
      this.seats.map((s) => s.displayName),
      this.seats.map((s) => s.connected),
      this.stateVersion
    );
  }

  handleAction(playerId: string, action: Action, clientVersion: number): { success: boolean; error?: string } {
    const seatIndex = this.getSeatIndex(playerId);
    if (seatIndex === -1) return { success: false, error: 'Not in this game' };

    // Intercept setup actions for parallel face-up selection
    if (
      action.type === 'CHOOSE_FACE_UP' &&
      this.state.gamePhase === GamePhase.Setup &&
      this.humanSeatsNeedingSetup.size > 0
    ) {
      return this.handleSetupAction(seatIndex, (action as Action & { type: 'CHOOSE_FACE_UP' }).cardIds);
    }

    const validation = validatePlayerAction(
      this.state,
      action,
      seatIndex,
      clientVersion,
      this.stateVersion
    );
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    try {
      const result = processAction(this.state, action);
      if (action.type === 'FLIP_FACE_DOWN') {
        this.pendingReveal = null;
      }
      this.applyResult(result.state, result.events);
      return { success: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      return { success: false, error: msg };
    }
  }

  handleRevealFaceDown(
    playerId: string,
    slotIndex: number,
    clientVersion: number
  ): { success: boolean; error?: string; card?: Card; playable?: boolean; slotIndex?: number } {
    const seatIndex = this.getSeatIndex(playerId);
    if (seatIndex === -1) return { success: false, error: 'Not in this game' };

    if (clientVersion !== this.stateVersion) {
      return { success: false, error: 'Stale state' };
    }

    if (this.state.currentPlayerIndex !== seatIndex) {
      return { success: false, error: 'Not your turn' };
    }

    const player = this.state.players[seatIndex];
    if (!player || player.phase !== PlayerPhase.FaceDown) {
      return { success: false, error: 'Not in face-down phase' };
    }

    if (slotIndex < 0 || slotIndex >= player.faceDown.length) {
      return { success: false, error: 'Invalid slot index' };
    }

    if (this.pendingReveal) {
      return { success: false, error: 'Already revealing a card' };
    }

    const card = player.faceDown[slotIndex]!;
    const pileTop = this.state.pile.length > 0 ? this.state.pile[this.state.pile.length - 1] : undefined;
    const playable = canPlayOn(card, pileTop);

    this.pendingReveal = { seatIndex, slotIndex };

    return { success: true, card, playable, slotIndex };
  }

  private handleSetupAction(seatIndex: number, cardIds: readonly string[]): { success: boolean; error?: string } {
    if (!this.humanSeatsNeedingSetup.has(seatIndex)) {
      return { success: false, error: 'Already chose face-up cards' };
    }

    if (cardIds.length !== 3) {
      return { success: false, error: 'Must choose exactly 3 cards' };
    }

    // Validate that the cards exist in the player's hand
    const player = this.state.players[seatIndex];
    if (!player) return { success: false, error: 'Invalid seat' };
    const handIds = new Set(player.hand.map((c) => c.id));
    for (const id of cardIds) {
      if (!handIds.has(id)) {
        return { success: false, error: 'Card not in hand' };
      }
    }

    this.pendingSetupChoices.set(seatIndex, cardIds);

    // Check if all humans have submitted
    if (this.pendingSetupChoices.size === this.humanSeatsNeedingSetup.size) {
      this.replaySetupChoices();
    }

    return { success: true };
  }

  private replaySetupChoices(): void {
    // Process choices in engine order (currentPlayerIndex advances sequentially)
    while (this.state.gamePhase === GamePhase.Setup) {
      const idx = this.state.currentPlayerIndex;
      if (this.isCpuSeat(idx)) {
        this.state = this.cpuController.runSetupChoices(this.state);
        this.stateVersion++;
      } else {
        const cardIds = this.pendingSetupChoices.get(idx);
        if (!cardIds) break; // Shouldn't happen
        const result = processAction(this.state, {
          type: 'CHOOSE_FACE_UP',
          playerIndex: idx,
          cardIds,
        });
        this.state = result.state;
        this.stateVersion++;
      }
    }

    // Clear buffers
    this.pendingSetupChoices.clear();
    this.humanSeatsNeedingSetup.clear();

    // Broadcast updated state
    this.broadcastStateUpdate([]);

    // Start playing phase timers if applicable
    if (this.state.gamePhase === GamePhase.Playing) {
      this.startTurnTimerIfNeeded();
      this.scheduleCpuIfNeeded();
    }
  }

  /** Start the game timers and broadcasts. Called after initial state is sent to clients. */
  start(): void {
    this.startTurnTimerIfNeeded();
    this.scheduleCpuIfNeeded();
  }

  markDisconnected(playerId: string): number {
    const seatIndex = this.getSeatIndex(playerId);
    if (seatIndex !== -1) {
      this.seats[seatIndex]!.connected = false;

      // Clear pending reveal if it belongs to this player
      if (this.pendingReveal && this.pendingReveal.seatIndex === seatIndex) {
        this.pendingReveal = null;
      }

      // If it was their turn, restart timer (CPU will take over)
      if (this.state.currentPlayerIndex === seatIndex) {
        this.scheduleCpuIfNeeded();
      }
    }
    return seatIndex;
  }

  markReconnected(playerId: string): number {
    const seatIndex = this.getSeatIndex(playerId);
    if (seatIndex !== -1) {
      this.seats[seatIndex]!.connected = true;

      // If it's their turn, restart timer for the human
      if (this.state.currentPlayerIndex === seatIndex) {
        this.turnTimer.start();
      }
    }
    return seatIndex;
  }

  /** Permanently convert a seat to CPU (e.g., after disconnect timeout). */
  convertToCpu(playerId: string): void {
    const seatIndex = this.getSeatIndex(playerId);
    if (seatIndex !== -1) {
      const seat = this.seats[seatIndex]!;
      seat.playerId = null;
      seat.displayName = `CPU (${seat.displayName})`;
      seat.connected = true;

      if (this.state.currentPlayerIndex === seatIndex) {
        this.scheduleCpuIfNeeded();
      }
    }
  }

  stop(): void {
    this.turnTimer.stop();
    this.cpuController.stop();
  }

  private applyResult(newState: GameState, events: readonly GameEvent[]): void {
    const prevPlayerIndex = this.state.currentPlayerIndex;
    this.state = newState;
    this.stateVersion++;

    // Broadcast to all players
    this.broadcastStateUpdate(events);

    if (newState.gamePhase === GamePhase.Finished) {
      this.turnTimer.stop();
      this.cpuController.stop();
      const winnerId = newState.winnerId;
      if (winnerId !== null) {
        this.leaderboard[winnerId] = (this.leaderboard[winnerId] ?? 0) + 1;
        const winnerName = this.seats[winnerId]?.displayName ?? 'Unknown';
        for (let i = 0; i < this.seats.length; i++) {
          const seat = this.seats[i];
          if (seat?.playerId && seat.connected) {
            this.broadcast(i, {
              type: 'GAME_OVER',
              winnerId,
              winnerName,
              finalState: this.getFilteredState(i),
              leaderboard: { ...this.leaderboard },
            });
          }
        }
      }
      return;
    }

    // Check for CPU jump-ins on non-special plays
    const playEvent = events.find((e) => e.type === 'CARDS_PLAYED');
    if (playEvent && playEvent.type === 'CARDS_PLAYED' && !isSpecialCard(playEvent.cards[0]!)) {
      this.cpuController.scheduleJumpInCheck(this.state);
    }

    // Handle setup phase — run CPU choices if it's a CPU's turn
    if (this.state.gamePhase === GamePhase.Setup && this.isCpuSeat(this.state.currentPlayerIndex)) {
      this.state = this.cpuController.runSetupChoices(this.state);
      this.stateVersion++;
      this.broadcastStateUpdate([]);
    }

    // Handle turn changes
    this.startTurnTimerIfNeeded();
    this.scheduleCpuIfNeeded();
  }

  private onCpuAction(newState: GameState, events: readonly GameEvent[]): void {
    this.applyResult(newState, events);
  }

  private onTurnTimerExpiry(): void {
    const currentIndex = this.state.currentPlayerIndex;

    // If there's a pending reveal for the current player, auto-confirm it
    if (this.pendingReveal && this.pendingReveal.seatIndex === currentIndex) {
      const slotIndex = this.pendingReveal.slotIndex;
      this.pendingReveal = null;
      try {
        const result = processAction(this.state, {
          type: 'FLIP_FACE_DOWN',
          playerIndex: currentIndex,
          slotIndex,
        });
        this.applyResult(result.state, result.events);
        return;
      } catch {
        // Fall through to normal CPU logic
      }
    }

    // Auto-play for the current player using CPU logic
    const action = decideCpuAction(this.state, currentIndex);
    try {
      const result = processAction(this.state, action);
      this.applyResult(result.state, result.events);
    } catch {
      // Fallback: pick up pile
      try {
        const result = processAction(this.state, {
          type: 'PICK_UP_PILE',
          playerIndex: currentIndex,
        });
        this.applyResult(result.state, result.events);
      } catch {
        // Nothing we can do
      }
    }
  }

  private startTurnTimerIfNeeded(): void {
    if (this.state.gamePhase !== GamePhase.Playing) return;

    const currentSeat = this.seats[this.state.currentPlayerIndex];
    // Only run timer for connected human players
    if (currentSeat?.playerId && currentSeat.connected) {
      this.turnTimer.start();
    } else {
      this.turnTimer.stop();
    }
  }

  private scheduleCpuIfNeeded(): void {
    if (this.state.gamePhase !== GamePhase.Playing) return;
    if (this.isCpuSeat(this.state.currentPlayerIndex)) {
      this.turnTimer.stop();
      this.cpuController.scheduleTurn(this.state);
    }
  }

  private broadcastTurnTimer(remainingMs: number, totalMs: number): void {
    this.broadcastAll({ type: 'TURN_TIMER', remainingMs, totalMs });
  }

  private broadcastStateUpdate(events: readonly GameEvent[]): void {
    for (let i = 0; i < this.seats.length; i++) {
      const seat = this.seats[i];
      if (seat?.playerId && seat.connected) {
        this.broadcast(i, {
          type: 'GAME_STATE_UPDATE',
          state: this.getFilteredState(i),
          events,
        });
      }
    }
  }

  private broadcastAll(msg: ServerMessage): void {
    for (let i = 0; i < this.seats.length; i++) {
      const seat = this.seats[i];
      if (seat?.playerId && seat.connected) {
        this.broadcast(i, msg);
      }
    }
  }
}
