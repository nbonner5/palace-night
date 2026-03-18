import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { Leaderboard } from './Leaderboard';

interface GameOverOverlayProps {
  winnerId: number;
  leaderboard: Record<number, number>;
  playerCount: number;
  seatNames?: string[];
  onNewGame: () => void;
  onExitToHome: () => void;
}

function getPlayerName(index: number): string {
  return index === 0 ? 'You' : `CPU ${index}`;
}

export function GameOverOverlay({ winnerId, leaderboard, playerCount, seatNames, onNewGame, onExitToHome }: GameOverOverlayProps) {
  const isHumanWin = winnerId === 0;
  const winnerName = seatNames?.[winnerId] ?? getPlayerName(winnerId);

  return (
    <View style={styles.overlay}>
      <View style={styles.content}>
        <Text style={[styles.title, isHumanWin ? styles.winTitle : styles.loseTitle]}>
          {isHumanWin ? 'You Win!' : `${winnerName} Wins`}
        </Text>

        <Leaderboard leaderboard={leaderboard} playerCount={playerCount} seatNames={seatNames} />

        <Pressable onPress={onNewGame} style={styles.button}>
          <Text style={styles.buttonText}>New Game</Text>
        </Pressable>
        <Pressable onPress={onExitToHome} style={styles.dangerButton}>
          <Text style={styles.buttonText}>Home</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlayBg,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  content: {
    alignItems: 'center',
    gap: 24,
    padding: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
  },
  winTitle: {
    color: colors.turnGold,
  },
  loseTitle: {
    color: colors.textPrimary,
  },
  button: {
    backgroundColor: colors.buttonPrimary,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  dangerButton: {
    backgroundColor: colors.buttonDanger,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  buttonText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
});
