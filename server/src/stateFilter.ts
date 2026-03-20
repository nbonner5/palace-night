import { GameState, PlayerState } from '../../src/types';
import { FilteredGameState, FilteredPlayerState } from '../../src/types/multiplayer';

function filterPlayer(player: PlayerState, isSelf: boolean, revealFaceDown: boolean): FilteredPlayerState {
  return {
    id: player.id,
    handCount: player.hand.length,
    hand: isSelf ? player.hand : [],
    faceUp: player.faceUp,
    faceDownCount: player.faceDown.length,
    faceDown: revealFaceDown ? player.faceDown : [],
    phase: player.phase,
  };
}

export function filterStateForPlayer(
  state: GameState,
  seatIndex: number,
  seatNames: readonly string[],
  seatConnected: readonly boolean[],
  stateVersion: number,
  gameFinished: boolean = false
): FilteredGameState {
  return {
    gamePhase: state.gamePhase,
    pile: state.pile,
    drawPileCount: state.drawPile.length,
    burnPileCount: state.burnPile.length,
    players: state.players.map((p) => filterPlayer(p, p.id === seatIndex, gameFinished)),
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
