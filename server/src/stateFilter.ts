import { GameState, PlayerState } from '../../src/types';
import { FilteredGameState, FilteredPlayerState } from '../../src/types/multiplayer';

function filterPlayer(player: PlayerState, isSelf: boolean): FilteredPlayerState {
  return {
    id: player.id,
    handCount: player.hand.length,
    hand: isSelf ? player.hand : [],
    faceUp: player.faceUp,
    faceDownCount: player.faceDown.length,
    phase: player.phase,
  };
}

export function filterStateForPlayer(
  state: GameState,
  seatIndex: number,
  seatNames: readonly string[],
  seatConnected: readonly boolean[],
  stateVersion: number
): FilteredGameState {
  return {
    gamePhase: state.gamePhase,
    pile: state.pile,
    drawPileCount: state.drawPile.length,
    burnPileCount: state.burnPile.length,
    players: state.players.map((p) => filterPlayer(p, p.id === seatIndex)),
    currentPlayerIndex: state.currentPlayerIndex,
    mustPlayAgain: state.mustPlayAgain,
    jumpInWindow: state.jumpInWindow,
    winnerId: state.winnerId,
    turnNumber: state.turnNumber,
    setupChoicesRemaining: state.setupChoicesRemaining,
    yourSeatIndex: seatIndex,
    seatNames,
    seatConnected,
    stateVersion,
    actionLog: state.actionLog,
  };
}
