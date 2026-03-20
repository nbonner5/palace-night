import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import { LobbyInfo } from '../../types/multiplayer';
import { colors } from '../theme/colors';

interface WaitingRoomProps {
  lobby: LobbyInfo;
  myPlayerId: string | null;
  isHost?: boolean;
  onReady: (ready: boolean) => void;
  onLeave: () => void;
  onSwapSeats?: (seatA: number, seatB: number) => void;
}

export function WaitingRoom({ lobby, myPlayerId, isHost, onReady, onLeave, onSwapSeats }: WaitingRoomProps) {
  const myParticipant = lobby.participants.find((p) => p.playerId === myPlayerId);
  const isReady = myParticipant?.isReady ?? false;
  const allReady = lobby.participants.length >= 2 && lobby.participants.every((p) => p.isReady);

  const handleCopyCode = useCallback(() => {
    if (Platform.OS === 'web') {
      navigator.clipboard?.writeText(lobby.code);
    }
  }, [lobby.code]);

  return (
    <View style={styles.container}>
      {/* Lobby code */}
      <View style={styles.codeSection}>
        <Text style={styles.codeLabel}>Game Code</Text>
        <Pressable onPress={handleCopyCode} style={styles.codeBox}>
          <Text style={styles.codeText}>{lobby.code}</Text>
          <Text style={styles.copyHint}>tap to copy</Text>
        </Pressable>
      </View>

      {/* Config summary */}
      <Text style={styles.configText}>
        {lobby.config.maxPlayers} players max | {lobby.config.deckCount} deck
        {lobby.config.deckCount !== 1 ? 's' : ''} | Jokers{' '}
        {lobby.config.includeJokers ? 'On' : 'Off'}
        {lobby.config.isPrivate ? ' | Private' : ''}
      </Text>

      {/* Participants */}
      <View style={styles.participantsList}>
        <Text style={styles.sectionLabel}>
          Players ({lobby.participants.length}/{lobby.config.maxPlayers})
        </Text>
        {(() => {
          // Build unified seat list
          const participantBySeat = new Map(lobby.participants.map(p => [p.seatIndex, p]));
          const seats = Array.from({ length: lobby.config.maxPlayers }, (_, i) => ({
            seatIndex: i,
            participant: participantBySeat.get(i) ?? null,
          }));

          return seats.map((seat, idx) => {
            const p = seat.participant;
            return (
              <View key={seat.seatIndex} style={styles.participant}>
                {/* Reorder arrows for host */}
                {isHost && onSwapSeats ? (
                  <View style={styles.arrowColumn}>
                    <Pressable
                      onPress={() => idx > 0 ? onSwapSeats(seat.seatIndex, seats[idx - 1]!.seatIndex) : undefined}
                      disabled={idx === 0}
                      style={styles.arrowButton}
                    >
                      <Text style={[styles.arrowText, idx === 0 && styles.arrowDisabled]}>▲</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => idx < seats.length - 1 ? onSwapSeats(seat.seatIndex, seats[idx + 1]!.seatIndex) : undefined}
                      disabled={idx === seats.length - 1}
                      style={styles.arrowButton}
                    >
                      <Text style={[styles.arrowText, idx === seats.length - 1 && styles.arrowDisabled]}>▼</Text>
                    </Pressable>
                  </View>
                ) : null}
                {p ? (
                  <>
                    <View style={styles.participantLeft}>
                      {p.isHost && <Text style={styles.hostBadge}>HOST</Text>}
                      <Text
                        style={[
                          styles.participantName,
                          p.playerId === myPlayerId && styles.myName,
                        ]}
                      >
                        {p.displayName}
                        {p.playerId === myPlayerId ? ' (you)' : ''}
                      </Text>
                    </View>
                    <Text style={[styles.readyStatus, p.isReady ? styles.ready : styles.notReady]}>
                      {p.isReady ? 'Ready' : 'Not Ready'}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.emptySlot}>-- CPU --</Text>
                )}
              </View>
            );
          });
        })()}
      </View>

      {/* Status message */}
      {allReady ? (
        <Text style={styles.statusText}>Starting game...</Text>
      ) : (
        <Text style={styles.statusText}>
          Waiting for all players to ready up
        </Text>
      )}

      {/* Action buttons */}
      <View style={styles.buttonRow}>
        <Pressable onPress={onLeave} style={styles.leaveButton}>
          <Text style={styles.buttonText}>Leave</Text>
        </Pressable>
        <Pressable
          onPress={() => onReady(!isReady)}
          style={[styles.readyButton, isReady && styles.unreadyButton]}
        >
          <Text style={styles.buttonText}>{isReady ? 'Unready' : 'Ready Up'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    gap: 16,
    paddingTop: 40,
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
  configText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  participantsList: {
    width: '100%',
    maxWidth: 360,
    gap: 8,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
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
  participantLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hostBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.turnGold,
    backgroundColor: 'rgba(255,215,0,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  participantName: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  myName: {
    fontWeight: '700',
  },
  readyStatus: {
    fontSize: 13,
    fontWeight: '600',
  },
  ready: {
    color: '#4CAF50',
  },
  notReady: {
    color: colors.textSecondary,
  },
  emptySlot: {
    fontSize: 14,
    color: colors.textSecondary,
    opacity: 0.5,
    fontStyle: 'italic',
    flex: 1,
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
  statusText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  leaveButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
    backgroundColor: colors.buttonDanger,
  },
  readyButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
    backgroundColor: colors.buttonPrimary,
  },
  unreadyButton: {
    backgroundColor: colors.buttonJumpIn,
  },
  buttonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
});
