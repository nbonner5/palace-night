import React, { useCallback } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { Leaderboard } from './Leaderboard';

interface RematchReadyInfo {
  players: { localIndex: number; displayName: string; isReady: boolean }[];
  lobbyCode: string;
  yourSeatIndex: number;
}

interface PostGameOverlayProps {
  winnerId: number;
  leaderboard: Record<number, number>;
  playerCount: number;
  seatNames: string[];
  rematchReady: RematchReadyInfo | null;
  isHost?: boolean;
  yourSeatIndex?: number;
  onRequestRematch: (ready: boolean) => void;
  onLeave: () => void;
  onSwapSeats?: (seatA: number, seatB: number) => void;
}

export function PostGameOverlay({
  winnerId,
  leaderboard,
  playerCount,
  seatNames,
  rematchReady,
  isHost,
  yourSeatIndex = 0,
  onRequestRematch,
  onLeave,
  onSwapSeats,
}: PostGameOverlayProps) {
  const isHumanWin = winnerId === 0;
  const winnerName = seatNames[winnerId] ?? (winnerId === 0 ? 'You' : `Player ${winnerId}`);
  const iAmReady = rematchReady?.players.find((p) => p.localIndex === rematchReady.yourSeatIndex)?.isReady ?? false;

  const handleCopyCode = useCallback(() => {
    if (Platform.OS === 'web' && rematchReady?.lobbyCode) {
      navigator.clipboard?.writeText(rematchReady.lobbyCode);
    }
  }, [rematchReady?.lobbyCode]);

  return (
    <View style={styles.overlay}>
      <View style={styles.content}>
        <Text style={[styles.title, isHumanWin ? styles.winTitle : styles.loseTitle]}>
          {isHumanWin ? 'You Win!' : `${winnerName} Wins`}
        </Text>

        <Leaderboard leaderboard={leaderboard} playerCount={playerCount} seatNames={seatNames} winnerId={winnerId} />

        {/* Lobby code */}
        {rematchReady && (
          <View style={styles.codeSection}>
            <Text style={styles.codeLabel}>Game Code</Text>
            <Pressable onPress={handleCopyCode} style={styles.codeBox}>
              <Text style={styles.codeText}>{rematchReady.lobbyCode}</Text>
              <Text style={styles.copyHint}>tap to copy</Text>
            </Pressable>
          </View>
        )}

        {/* Per-player ready list */}
        {rematchReady && (
          <View style={styles.playerList}>
            {rematchReady.players.map((p, idx) => {
              const toServerSeat = (localIdx: number) => localIdx;
              return (
                <View key={idx} style={styles.participant}>
                  {isHost && onSwapSeats ? (
                    <View style={styles.arrowColumn}>
                      <Pressable
                        onPress={() => idx > 0 ? onSwapSeats(
                          toServerSeat(rematchReady.players[idx]!.localIndex),
                          toServerSeat(rematchReady.players[idx - 1]!.localIndex)
                        ) : undefined}
                        disabled={idx === 0}
                        style={styles.arrowButton}
                      >
                        <Text style={[styles.arrowText, idx === 0 && styles.arrowDisabled]}>▲</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => idx < rematchReady.players.length - 1 ? onSwapSeats(
                          toServerSeat(rematchReady.players[idx]!.localIndex),
                          toServerSeat(rematchReady.players[idx + 1]!.localIndex)
                        ) : undefined}
                        disabled={idx === rematchReady.players.length - 1}
                        style={styles.arrowButton}
                      >
                        <Text style={[styles.arrowText, idx === rematchReady.players.length - 1 && styles.arrowDisabled]}>▼</Text>
                      </Pressable>
                    </View>
                  ) : null}
                  <Text
                    style={[
                      styles.participantName,
                      p.localIndex === rematchReady.yourSeatIndex && styles.myName,
                    ]}
                  >
                    {p.displayName}
                    {p.localIndex === rematchReady.yourSeatIndex ? ' (you)' : ''}
                  </Text>
                  <Text style={[styles.readyStatus, p.isReady ? styles.ready : styles.notReady]}>
                    {p.isReady ? 'Ready' : 'Not Ready'}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        <Pressable
          onPress={() => onRequestRematch(!iAmReady)}
          style={[styles.button, iAmReady && styles.readyButton]}
        >
          <Text style={styles.buttonText}>
            {iAmReady ? 'Unready' : 'Ready for Next Game'}
          </Text>
        </Pressable>

        <Pressable onPress={onLeave} style={styles.dangerButton}>
          <Text style={styles.buttonText}>Leave</Text>
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
  codeSection: {
    alignItems: 'center',
    gap: 6,
  },
  codeLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  codeBox: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  codeText: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.turnGold,
    letterSpacing: 4,
  },
  copyHint: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  playerList: {
    width: '100%',
    maxWidth: 360,
    gap: 8,
  },
  participant: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  participantName: {
    fontSize: 15,
    color: colors.textPrimary,
    flex: 1,
  },
  myName: {
    fontWeight: '700',
  },
  readyStatus: {
    fontSize: 13,
    fontWeight: '600',
  },
  arrowColumn: {
    justifyContent: 'center',
    gap: 2,
    marginRight: 8,
  },
  arrowButton: {
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  arrowText: {
    fontSize: 10,
    color: colors.textPrimary,
  },
  arrowDisabled: {
    opacity: 0.2,
  },
  ready: {
    color: '#4CAF50',
  },
  notReady: {
    color: colors.textSecondary,
  },
  button: {
    backgroundColor: colors.buttonPrimary,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  readyButton: {
    backgroundColor: colors.textSecondary,
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
