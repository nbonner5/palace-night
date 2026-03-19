import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LobbyConfig, DEFAULT_LOBBY_CONFIG } from '../../types/multiplayer';
import { getMaxPlayerCount } from '../../engine/configLimits';
import { colors } from '../theme/colors';

interface CreateLobbyOverlayProps {
  onCreate: (config: LobbyConfig) => void;
  onClose: () => void;
}

export function CreateLobbyOverlay({ onCreate, onClose }: CreateLobbyOverlayProps) {
  const [maxPlayers, setMaxPlayers] = useState(DEFAULT_LOBBY_CONFIG.maxPlayers);
  const [deckCount, setDeckCount] = useState(DEFAULT_LOBBY_CONFIG.deckCount);
  const [includeJokers, setIncludeJokers] = useState(DEFAULT_LOBBY_CONFIG.includeJokers);
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');

  const maxPlayerCount = Math.min(7, getMaxPlayerCount(deckCount, includeJokers));

  const handleDeckChange = (newDeck: number) => {
    setDeckCount(newDeck);
    const newMax = Math.min(7, getMaxPlayerCount(newDeck, includeJokers));
    if (maxPlayers > newMax) setMaxPlayers(Math.max(2, newMax));
  };

  const handleJokersToggle = () => {
    const newJokers = !includeJokers;
    setIncludeJokers(newJokers);
    const newMax = Math.min(7, getMaxPlayerCount(deckCount, newJokers));
    if (maxPlayers > newMax) setMaxPlayers(Math.max(2, newMax));
  };

  const handleCreate = () => {
    onCreate({
      maxPlayers,
      deckCount,
      includeJokers,
      isPrivate,
      ...(isPrivate && password ? { password } : {}),
    });
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.panel}>
        <Text style={styles.title}>Create Game</Text>

        {/* Max Players */}
        <View style={styles.setting}>
          <Text style={styles.label}>Players</Text>
          <View style={styles.sliderRow}>
            {[2, 3, 4, 5, 6, 7].map((n) => (
              <Pressable
                key={n}
                onPress={() => n <= maxPlayerCount && setMaxPlayers(n)}
                style={[
                  styles.sliderItem,
                  maxPlayers === n && styles.sliderItemActive,
                  n > maxPlayerCount && styles.sliderItemDisabled,
                ]}
              >
                <Text
                  style={[
                    styles.sliderText,
                    maxPlayers === n && styles.sliderTextActive,
                    n > maxPlayerCount && styles.sliderTextDisabled,
                  ]}
                >
                  {n}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Deck Count */}
        <View style={styles.setting}>
          <Text style={styles.label}>Decks</Text>
          <View style={styles.sliderRow}>
            {[1, 2, 3].map((n) => (
              <Pressable
                key={n}
                onPress={() => handleDeckChange(n)}
                style={[styles.sliderItem, deckCount === n && styles.sliderItemActive]}
              >
                <Text style={[styles.sliderText, deckCount === n && styles.sliderTextActive]}>
                  {n}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Jokers Toggle */}
        <View style={styles.setting}>
          <Text style={styles.label}>Jokers</Text>
          <Pressable
            onPress={handleJokersToggle}
            style={[styles.togglePill, includeJokers && styles.togglePillActive]}
          >
            <Text style={[styles.toggleText, includeJokers && styles.toggleTextActive]}>
              {includeJokers ? 'ON' : 'OFF'}
            </Text>
          </Pressable>
        </View>

        {/* Private Toggle */}
        <View style={styles.setting}>
          <Text style={styles.label}>Private</Text>
          <Pressable
            onPress={() => setIsPrivate(!isPrivate)}
            style={[styles.togglePill, isPrivate && styles.togglePillActive]}
          >
            <Text style={[styles.toggleText, isPrivate && styles.toggleTextActive]}>
              {isPrivate ? 'YES' : 'NO'}
            </Text>
          </Pressable>
        </View>

        {/* Password (only if private) */}
        {isPrivate && (
          <View style={styles.setting}>
            <Text style={styles.label}>Password (optional)</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Set a password..."
              placeholderTextColor={colors.textSecondary}
              maxLength={20}
              secureTextEntry
            />
          </View>
        )}

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <Pressable onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.buttonText}>Cancel</Text>
          </Pressable>
          <Pressable onPress={handleCreate} style={styles.createButton}>
            <Text style={styles.buttonText}>Create</Text>
          </Pressable>
        </View>
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
  panel: {
    backgroundColor: colors.tableDark,
    borderRadius: 16,
    padding: 24,
    width: 320,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.turnGold,
    textAlign: 'center',
  },
  setting: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sliderRow: {
    flexDirection: 'row',
    gap: 6,
  },
  sliderItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  sliderItemActive: {
    backgroundColor: colors.buttonPrimary,
  },
  sliderItemDisabled: {
    opacity: 0.3,
  },
  sliderText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  sliderTextActive: {
    color: colors.textPrimary,
  },
  sliderTextDisabled: {
    color: colors.textSecondary,
  },
  togglePill: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  togglePillActive: {
    backgroundColor: colors.buttonPrimary,
  },
  toggleText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  toggleTextActive: {
    color: colors.textPrimary,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  createButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.buttonPrimary,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
});
