import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

interface LeaderboardProps {
  leaderboard: Record<number, number>;
  playerCount: number;
  seatNames?: string[];
  winnerId?: number | null;
}

function getPlayerName(index: number): string {
  return index === 0 ? 'You' : `CPU ${index}`;
}

export function Leaderboard({ leaderboard, playerCount, seatNames, winnerId }: LeaderboardProps) {
  const rows = Array.from({ length: playerCount }, (_, i) => ({
    index: i,
    name: seatNames?.[i] ?? getPlayerName(i),
    wins: leaderboard[i] ?? 0,
  })).sort((a, b) => b.wins - a.wins);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Leaderboard</Text>
      {rows.map(row => {
        const isWinner = winnerId != null && row.index === winnerId;
        return (
          <View key={row.index} style={styles.row}>
            <Text style={[styles.playerName, isWinner && styles.leaderText]}>
              {row.name}
            </Text>
            <Text style={[styles.winCount, isWinner && styles.leaderText]}>
              {row.wins}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 200,
    gap: 8,
  },
  title: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerName: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  winCount: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '700',
  },
  leaderText: {
    color: colors.turnGold,
  },
});
