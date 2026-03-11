import React from 'react';
import { StyleSheet, View } from 'react-native';
import { GameState } from '../../types';
import { colors } from '../theme/colors';
import { CpuPlayerArea } from './CpuPlayerArea';
import { CenterArea } from './CenterArea';
import { HumanPlayerArea } from './HumanPlayerArea';

interface GameTableProps {
  game: GameState;
  isProcessing: boolean;
  selectedIds: Set<string>;
  playableIds: Set<string>;
  canPlay: boolean;
  canPickUp: boolean;
  isHumanTurn: boolean;
  canHumanJumpIn: boolean;
  jumpInCardIds: Set<string>;
  canJumpIn: boolean;
  onCardPress: (cardId: string) => void;
  onPlay: () => void;
  onPickUp: () => void;
  onFlipFaceDown: (slotIndex: number) => void;
  onJumpIn: () => void;
}

export function GameTable({
  game,
  isProcessing,
  selectedIds,
  playableIds,
  canPlay,
  canPickUp,
  isHumanTurn,
  canHumanJumpIn,
  jumpInCardIds,
  canJumpIn,
  onCardPress,
  onPlay,
  onPickUp,
  onFlipFaceDown,
  onJumpIn,
}: GameTableProps) {
  return (
    <View style={styles.table}>
      {/* CPU players row */}
      <View style={styles.cpuRow}>
        <CpuPlayerArea
          player={game.players[1]}
          playerIndex={1}
          isCurrentTurn={game.currentPlayerIndex === 1}
        />
        <CpuPlayerArea
          player={game.players[2]}
          playerIndex={2}
          isCurrentTurn={game.currentPlayerIndex === 2}
        />
        <CpuPlayerArea
          player={game.players[3]}
          playerIndex={3}
          isCurrentTurn={game.currentPlayerIndex === 3}
        />
      </View>

      {/* Center area */}
      <CenterArea game={game} isProcessing={isProcessing} />

      {/* Human player */}
      <HumanPlayerArea
        player={game.players[0]}
        selectedIds={selectedIds}
        playableIds={playableIds}
        canPlay={canPlay}
        canPickUp={canPickUp}
        isHumanTurn={isHumanTurn}
        canHumanJumpIn={canHumanJumpIn}
        jumpInCardIds={jumpInCardIds}
        canJumpIn={canJumpIn}
        onCardPress={onCardPress}
        onPlay={onPlay}
        onPickUp={onPickUp}
        onFlipFaceDown={onFlipFaceDown}
        onJumpIn={onJumpIn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    flex: 1,
    backgroundColor: colors.tableGreen,
    justifyContent: 'space-between',
  },
  cpuRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    paddingHorizontal: 4,
  },
});
