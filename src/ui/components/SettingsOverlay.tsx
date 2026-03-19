import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GameConfig } from '../../types';
import { validateConfig, getMaxPlayerCount } from '../../engine';
import { colors } from '../theme/colors';

interface SettingsOverlayProps {
  config: GameConfig;
  onSave: (config: GameConfig) => void;
  onClose: () => void;
}

export function SettingsOverlay({ config, onSave, onClose }: SettingsOverlayProps) {
  const [cpuCount, setCpuCount] = useState(config.cpuCount);
  const [deckCount, setDeckCount] = useState(config.deckCount);
  const [includeJokers, setIncludeJokers] = useState(config.includeJokers);

  const currentConfig: GameConfig = { cpuCount, deckCount, includeJokers };
  const validation = validateConfig(currentConfig);
  const maxCpu = Math.min(6, getMaxPlayerCount(deckCount, includeJokers) - 1);

  const handleDeckChange = (newDeck: number) => {
    setDeckCount(newDeck);
    const newMax = Math.min(6, getMaxPlayerCount(newDeck, includeJokers) - 1);
    if (cpuCount > newMax) setCpuCount(Math.max(1, newMax));
  };

  const handleJokersToggle = () => {
    const newJokers = !includeJokers;
    setIncludeJokers(newJokers);
    const newMax = Math.min(6, getMaxPlayerCount(deckCount, newJokers) - 1);
    if (cpuCount > newMax) setCpuCount(Math.max(1, newMax));
  };

  const handleSave = () => {
    if (validation.valid) {
      onSave(currentConfig);
    }
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.panel}>
        <Text style={styles.title}>Settings</Text>

        {/* CPU Count */}
        <View style={styles.setting}>
          <Text style={styles.label}>CPU Players</Text>
          <View style={styles.sliderRow}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <Pressable
                key={n}
                onPress={() => n <= maxCpu && setCpuCount(n)}
                style={[
                  styles.sliderItem,
                  cpuCount === n && styles.sliderItemActive,
                  n > maxCpu && styles.sliderItemDisabled,
                ]}
              >
                <Text
                  style={[
                    styles.sliderText,
                    cpuCount === n && styles.sliderTextActive,
                    n > maxCpu && styles.sliderTextDisabled,
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
                style={[
                  styles.sliderItem,
                  deckCount === n && styles.sliderItemActive,
                ]}
              >
                <Text
                  style={[
                    styles.sliderText,
                    deckCount === n && styles.sliderTextActive,
                  ]}
                >
                  {n}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Jokers Toggle */}
        <View style={styles.setting}>
          <Text style={styles.label}>Jokers</Text>
          <Pressable onPress={handleJokersToggle} style={[styles.togglePill, includeJokers && styles.togglePillActive]}>
            <Text style={[styles.toggleText, includeJokers && styles.toggleTextActive]}>
              {includeJokers ? 'ON' : 'OFF'}
            </Text>
          </Pressable>
        </View>

        {/* Validation warning */}
        {!validation.valid && (
          <Text style={styles.warning}>{validation.reason}</Text>
        )}

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <Pressable onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.buttonText}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={handleSave}
            style={[styles.doneButton, !validation.valid && styles.buttonDisabled]}
            disabled={!validation.valid}
          >
            <Text style={styles.buttonText}>Done</Text>
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
    gap: 20,
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
    fontSize: 16,
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
    fontSize: 16,
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
    fontSize: 16,
    fontWeight: '700',
  },
  toggleTextActive: {
    color: colors.textPrimary,
  },
  warning: {
    color: '#EF5350',
    fontSize: 13,
    textAlign: 'center',
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
  doneButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.buttonPrimary,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: colors.buttonDisabled,
  },
  buttonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
});
