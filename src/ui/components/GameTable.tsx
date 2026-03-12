import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, GameState } from '../../types';
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
  revealedFaceDown: { slotIndex: number; card: Card; playable: boolean } | null;
  onCardPress: (cardId: string) => void;
  onDoubleTapCard?: (cardId: string) => void;
  onPlay: () => void;
  onPickUp: () => void;
  onFlipFaceDown: (slotIndex: number) => void;
  onConfirmFaceDown: () => void;
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
  revealedFaceDown,
  onCardPress,
  onDoubleTapCard,
  onPlay,
  onPickUp,
  onFlipFaceDown,
  onConfirmFaceDown,
  onJumpIn,
}: GameTableProps) {
  const cpuPlayers = game.players.slice(1);
  const cpuCount = cpuPlayers.length;

  // For 5+ CPUs, split into 2 rows
  const topRowCount = cpuCount > 3 ? Math.ceil(cpuCount / 2) : cpuCount;
  const topRow = cpuPlayers.slice(0, topRowCount);
  const bottomRow = cpuPlayers.slice(topRowCount);

  return (
    <View style={styles.table}>
      {/* CPU players top row */}
      <View style={styles.cpuRow}>
        {topRow.map((player, i) => {
          const playerIndex = i + 1;
          return (
            <CpuPlayerArea
              key={playerIndex}
              player={player}
              playerIndex={playerIndex}
              isCurrentTurn={game.currentPlayerIndex === playerIndex}
            />
          );
        })}
      </View>

      {/* CPU players bottom row (when 5+ CPUs) */}
      {bottomRow.length > 0 && (
        <View style={styles.cpuRow}>
          {bottomRow.map((player, i) => {
            const playerIndex = topRowCount + i + 1;
            return (
              <CpuPlayerArea
                key={playerIndex}
                player={player}
                playerIndex={playerIndex}
                isCurrentTurn={game.currentPlayerIndex === playerIndex}
              />
            );
          })}
        </View>
      )}

      {/* Center area */}
      <CenterArea game={game} isProcessing={isProcessing} />

      {/* Human player */}
      <HumanPlayerArea
        player={game.players[0]!}
        selectedIds={selectedIds}
        playableIds={playableIds}
        canPlay={canPlay}
        canPickUp={canPickUp}
        isHumanTurn={isHumanTurn}
        canHumanJumpIn={canHumanJumpIn}
        jumpInCardIds={jumpInCardIds}
        canJumpIn={canJumpIn}
        revealedFaceDown={revealedFaceDown}
        onCardPress={onCardPress}
        onDoubleTapCard={onDoubleTapCard}
        onPlay={onPlay}
        onPickUp={onPickUp}
        onFlipFaceDown={onFlipFaceDown}
        onConfirmFaceDown={onConfirmFaceDown}
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
