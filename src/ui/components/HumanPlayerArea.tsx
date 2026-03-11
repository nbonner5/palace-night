import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PlayerState, PlayerPhase } from '../../types';
import { colors } from '../theme/colors';
import { HumanHand } from './HumanHand';
import { HumanFaceUp } from './HumanFaceUp';
import { HumanFaceDown } from './HumanFaceDown';
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
  onPlay,
  onPickUp,
  onFlipFaceDown,
  onJumpIn,
}: HumanPlayerAreaProps) {
  const showHand = player.phase === PlayerPhase.HandAndDraw || player.phase === PlayerPhase.HandOnly;
  const showFaceUp = player.phase === PlayerPhase.FaceUp;
  const showFaceDown = player.faceDown.length > 0;

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

      {/* Face-down slots (always visible while they exist) */}
      <HumanFaceDown
        cards={player.faceDown}
        playerPhase={player.phase}
        onSlotPress={onFlipFaceDown}
        disabled={!isHumanTurn}
      />

      {/* Face-up cards (only when in FaceUp phase) */}
      {showFaceUp && (
        <HumanFaceUp
          cards={player.faceUp}
          selectedIds={selectedIds}
          playableIds={effectivePlayableIds}
          onCardPress={onCardPress}
          disabled={!cardsEnabled}
        />
      )}

      {/* Hand */}
      {showHand && player.hand.length > 0 && (
        <HumanHand
          cards={player.hand}
          selectedIds={selectedIds}
          playableIds={effectivePlayableIds}
          onCardPress={onCardPress}
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
