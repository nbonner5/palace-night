import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PlayerState } from '../../types';
import { colors } from '../theme/colors';
import { CARD_WIDTH_SMALL, CARD_HEIGHT_SMALL, CARD_BORDER_RADIUS } from '../theme/layout';
import { CardView } from './CardView';
import { PlayerLabel } from './PlayerLabel';

interface CpuPlayerAreaProps {
  player: PlayerState;
  playerIndex: number;
  isCurrentTurn: boolean;
}

const PLAYER_NAMES = ['You', 'CPU 1', 'CPU 2', 'CPU 3'];

export function CpuPlayerArea({ player, playerIndex, isCurrentTurn }: CpuPlayerAreaProps) {
  return (
    <View style={[styles.container, isCurrentTurn && styles.activeBorder]}>
      <PlayerLabel name={PLAYER_NAMES[playerIndex] ?? `CPU ${playerIndex}`} isCurrentTurn={isCurrentTurn} />

      {/* Hand count as card backs */}
      {player.hand.length > 0 && (
        <View style={styles.row}>
          <View style={styles.miniCardBack}>
            <Text style={styles.countText}>{player.hand.length}</Text>
          </View>
        </View>
      )}

      {/* Face-up cards */}
      {player.faceUp.length > 0 && (
        <View style={styles.row}>
          {player.faceUp.map((card) => (
            <CardView key={card.id} card={card} faceDown={false} size="small" disabled />
          ))}
        </View>
      )}

      {/* Face-down count */}
      {player.faceDown.length > 0 && (
        <View style={styles.row}>
          {player.faceDown.map((card, i) => (
            <CardView key={card.id} card={null} faceDown size="small" />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    minWidth: 80,
  },
  activeBorder: {
    borderColor: colors.turnGold,
  },
  row: {
    flexDirection: 'row',
    gap: 2,
  },
  miniCardBack: {
    width: CARD_WIDTH_SMALL,
    height: CARD_HEIGHT_SMALL,
    backgroundColor: colors.cardBack,
    borderRadius: CARD_BORDER_RADIUS,
    borderWidth: 1,
    borderColor: colors.cardBackBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
});
