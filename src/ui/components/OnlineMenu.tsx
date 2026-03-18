import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LobbyConfig, LobbyInfo } from '../../types/multiplayer';
import { colors } from '../theme/colors';
import { DisplayNameInput } from './DisplayNameInput';
import { CreateLobbyOverlay } from './CreateLobbyOverlay';
import { LobbyBrowser } from './LobbyBrowser';

interface OnlineMenuProps {
  displayName: string;
  onDisplayNameChange: (name: string) => void;
  lobbyList: readonly LobbyInfo[];
  error: { code: string; message: string } | null;
  onCreateLobby: (config: LobbyConfig) => void;
  onJoinLobby: (code: string, password?: string) => void;
  onRefreshLobbies: () => void;
  onBack: () => void;
}

export function OnlineMenu({
  displayName,
  onDisplayNameChange,
  lobbyList,
  error,
  onCreateLobby,
  onJoinLobby,
  onRefreshLobbies,
  onBack,
}: OnlineMenuProps) {
  const [subScreen, setSubScreen] = useState<'main' | 'create' | 'browse'>('main');

  const hasName = displayName.trim().length > 0;

  if (subScreen === 'browse') {
    return (
      <View style={styles.safe}>
        <LobbyBrowser
          lobbies={lobbyList}
          onRefresh={onRefreshLobbies}
          onJoin={onJoinLobby}
          onBack={() => setSubScreen('main')}
        />
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      <View style={styles.container}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Text style={styles.title}>Play Online</Text>

        <View style={styles.form}>
          <DisplayNameInput value={displayName} onChange={onDisplayNameChange} />

          {error && !(error.code === 'NAME_REQUIRED' && hasName) && (
            <Text style={styles.errorText}>{error.message}</Text>
          )}

          <Pressable
            onPress={() => setSubScreen('create')}
            style={[styles.button, !hasName && styles.buttonDisabled]}
            disabled={!hasName}
          >
            <Text style={styles.buttonText}>Create Game</Text>
          </Pressable>

          <Pressable
            onPress={() => setSubScreen('browse')}
            style={[styles.buttonSecondary, !hasName && styles.buttonDisabled]}
            disabled={!hasName}
          >
            <Text style={styles.buttonText}>Browse Games</Text>
          </Pressable>
        </View>
      </View>

      {subScreen === 'create' && (
        <CreateLobbyOverlay
          onCreate={(config) => {
            onCreateLobby(config);
            setSubScreen('main');
          }}
          onClose={() => setSubScreen('main')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.tableDark,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.turnGold,
    marginBottom: 32,
  },
  form: {
    width: '100%',
    maxWidth: 320,
    gap: 16,
  },
  errorText: {
    color: '#EF5350',
    fontSize: 13,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.buttonPrimary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
});
