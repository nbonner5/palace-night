import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PlayerState } from '../../types';
import { colors } from '../theme/colors';
import { CARD_BORDER_RADIUS, useLayout } from '../theme/layout';
import { CardView } from './CardView';
import { PlayerLabel } from './PlayerLabel';

interface CpuPlayerAreaProps {
  player: PlayerState;
  playerIndex: number;
  isCurrentTurn: boolean;
  name?: string;
}

export function CpuPlayerArea({ player, playerIndex, isCurrentTurn, name: nameProp }: CpuPlayerAreaProps) {
  const name = nameProp ?? `CPU ${playerIndex}`;
  const { cpuCardWidth, cpuCardHeight, isNarrow } = useLayout();
  return (
    <View style={[styles.container, isCurrentTurn && styles.activeBorder, isNarrow && styles.containerNarrow]}>
      <PlayerLabel name={name} isCurrentTurn={isCurrentTurn} />

      {/* Hand count as card backs */}
      {player.hand.length > 0 && (
        <View style={styles.row}>
          <View style={[styles.miniCardBack, { width: cpuCardWidth, height: cpuCardHeight }]}>
            <Text style={styles.countText}>{player.hand.length}</Text>
          </View>
        </View>
      )}

      {/* Face-up cards */}
      {player.faceUp.length > 0 && (
        <View style={styles.row}>
          {player.faceUp.map((card) => (
            <CardView key={card.id} card={card} faceDown={false} size="small" disabled customWidth={cpuCardWidth} customHeight={cpuCardHeight} />
          ))}
        </View>
      )}

      {/* Face-down count */}
      {player.faceDown.length > 0 && (
        <View style={styles.row}>
          {player.faceDown.map((card, i) => (
            <CardView key={card.id} card={null} faceDown size="small" customWidth={cpuCardWidth} customHeight={cpuCardHeight} />
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
  containerNarrow: {
    paddingHorizontal: 2,
    minWidth: 0,
  },
  miniCardBack: {
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
