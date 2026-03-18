import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LobbyInfo } from '../../types/multiplayer';
import { colors } from '../theme/colors';

interface LobbyBrowserProps {
  lobbies: readonly LobbyInfo[];
  onRefresh: () => void;
  onJoin: (code: string, password?: string) => void;
  onBack: () => void;
}

export function LobbyBrowser({ lobbies, onRefresh, onJoin, onBack }: LobbyBrowserProps) {
  const [codeInput, setCodeInput] = useState('');

  useEffect(() => {
    onRefresh();
  }, [onRefresh]);

  const handleJoinByCode = () => {
    const code = codeInput.trim().toUpperCase();
    if (code.length === 6) {
      onJoin(code);
      setCodeInput('');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.title}>Browse Games</Text>
        <Pressable onPress={onRefresh} style={styles.refreshButton}>
          <Text style={styles.refreshText}>Refresh</Text>
        </Pressable>
      </View>

      {/* Join by code */}
      <View style={styles.codeRow}>
        <TextInput
          style={styles.codeInput}
          value={codeInput}
          onChangeText={setCodeInput}
          placeholder="Enter code..."
          placeholderTextColor={colors.textSecondary}
          maxLength={6}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        <Pressable
          onPress={handleJoinByCode}
          style={[styles.joinCodeButton, codeInput.trim().length !== 6 && styles.buttonDisabled]}
          disabled={codeInput.trim().length !== 6}
        >
          <Text style={styles.buttonText}>Join</Text>
        </Pressable>
      </View>

      {/* Public lobby list */}
      {lobbies.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No public games available</Text>
          <Text style={styles.emptySubtext}>Create one or enter a code</Text>
        </View>
      ) : (
        <FlatList
          data={lobbies as LobbyInfo[]}
          keyExtractor={(item) => item.id}
          style={styles.list}
          renderItem={({ item }) => (
            <Pressable onPress={() => onJoin(item.code)} style={styles.lobbyCard}>
              <View style={styles.lobbyInfo}>
                <Text style={styles.lobbyHost}>
                  {item.participants[0]?.displayName ?? 'Unknown'}'s game
                </Text>
                <Text style={styles.lobbyDetails}>
                  {item.participants.length}/{item.config.maxPlayers} players
                  {' | '}
                  {item.config.deckCount} deck{item.config.deckCount !== 1 ? 's' : ''}
                  {item.config.includeJokers ? ' + Jokers' : ''}
                </Text>
              </View>
              <Text style={styles.joinText}>Join</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  refreshButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  refreshText: {
    color: colors.buttonPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  codeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  codeInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    letterSpacing: 2,
    textAlign: 'center',
  },
  joinCodeButton: {
    backgroundColor: colors.buttonPrimary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: colors.buttonDisabled,
  },
  buttonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  emptySubtext: {
    color: colors.textSecondary,
    fontSize: 13,
    opacity: 0.7,
  },
  list: {
    flex: 1,
  },
  lobbyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  lobbyInfo: {
    flex: 1,
    gap: 2,
  },
  lobbyHost: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  lobbyDetails: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  joinText: {
    color: colors.buttonPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
});
