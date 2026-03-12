import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PlayerState, PlayerPhase } from '../../types';
import { colors } from '../theme/colors';
import { HumanHand } from './HumanHand';
import { HumanTableCards } from './HumanTableCards';
import { ActionBar } from './ActionBar';

interface HumanPlayerAreaProps {
  player: PlayerState;
  selectedIds: Set<string>;
  playableIds: Set<string>;
  canPlay: boolean;
  canPickUp: boolean;
  isHumanTurn: boolean;
  canHumanJumpIn: boolean;
  jumpInCardIds: Set<string>;
  canJumpIn: boolean;
  onCardPress: (cardId: string) => void;
  onDoubleTapCard?: (cardId: string) => void;
  onPlay: () => void;
  onPickUp: () => void;
  onFlipFaceDown: (slotIndex: number) => void;
  onJumpIn: () => void;
}

export function HumanPlayerArea({
  player,
  selectedIds,
  playableIds,
  canPlay,
  canPickUp,
  isHumanTurn,
  canHumanJumpIn,
  jumpInCardIds,
  canJumpIn,
  onCardPress,
  onDoubleTapCard,
  onPlay,
  onPickUp,
  onFlipFaceDown,
  onJumpIn,
}: HumanPlayerAreaProps) {
  const showHand = player.phase === PlayerPhase.HandAndDraw || player.phase === PlayerPhase.HandOnly;

  // When jump-in is available (and it's not our turn), use jump-in cards as playable
  const effectivePlayableIds = (!isHumanTurn && canHumanJumpIn) ? jumpInCardIds : playableIds;
  const cardsEnabled = isHumanTurn || canHumanJumpIn;

  return (
    <View style={styles.container}>
      {/* Phase label */}
      {player.phase === PlayerPhase.FaceDown && (
        <Text style={styles.phaseLabel}>Tap a face-down card to flip it</Text>
      )}
      {player.phase === PlayerPhase.FaceUp && (
        <Text style={styles.phaseLabel}>Playing face-up cards</Text>
      )}

      {/* Stacked face-down / face-up table cards */}
      <HumanTableCards
        faceDown={player.faceDown}
        faceUp={player.faceUp}
        playerPhase={player.phase}
        isHumanTurn={isHumanTurn}
        onSlotPress={onFlipFaceDown}
      />

      {/* Hand */}
      {showHand && player.hand.length > 0 && (
        <HumanHand
          cards={player.hand}
          selectedIds={selectedIds}
          playableIds={effectivePlayableIds}
          onCardPress={onCardPress}
          onDoubleTapCard={onDoubleTapCard}
          disabled={!cardsEnabled}
        />
      )}

      {/* Action buttons */}
      {canHumanJumpIn && !isHumanTurn ? (
        <ActionBar
          canPlay={false}
          canPickUp={false}
          canJumpIn={canJumpIn}
          onPlay={onPlay}
          onPickUp={onPickUp}
          onJumpIn={onJumpIn}
          selectedCount={selectedIds.size}
        />
      ) : (
        player.phase !== PlayerPhase.FaceDown && (
          <ActionBar
            canPlay={canPlay}
            canPickUp={canPickUp}
            onPlay={onPlay}
            onPickUp={onPickUp}
            selectedCount={selectedIds.size}
          />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
    paddingBottom: 8,
  },
  phaseLabel: {
    color: colors.turnGold,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
