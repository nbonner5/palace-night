import React, { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { GameConfig } from '../../types'
import { colors } from '../theme/colors'
import { SettingsOverlay } from './SettingsOverlay'

interface HomeScreenProps {
  config: GameConfig
  onConfigChange: (config: GameConfig) => void
  onNewGame: () => void
}

export function HomeScreen({
  config,
  onConfigChange,
  onNewGame,
}: HomeScreenProps) {
  const [showSettings, setShowSettings] = useState(false)

  const configSummary = `${config.cpuCount} CPU${config.cpuCount !== 1 ? 's' : ''} | ${config.deckCount} Deck${config.deckCount !== 1 ? 's' : ''} | Jokers ${config.includeJokers ? 'On' : 'Off'}`

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Settings gear */}
        <Pressable
          onPress={() => setShowSettings(true)}
          style={styles.settingsButton}
        >
          <Text style={styles.settingsIcon}>{'\u2699'}</Text>
        </Pressable>

        <Text style={styles.title}>PALACE NIGHT</Text>
        <Text style={styles.configSummary}>{configSummary}</Text>
        <Pressable onPress={onNewGame} style={styles.button}>
          <Text style={styles.buttonText}>New Game</Text>
        </Pressable>
      </View>

      {showSettings && (
        <SettingsOverlay
          config={config}
          onSave={(newConfig) => {
            onConfigChange(newConfig)
            setShowSettings(false)
          }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </SafeAreaView>
  )
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
    gap: 20,
  },
  settingsButton: {
    position: 'absolute',
    top: 8,
    right: 12,
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    fontSize: 28,
    color: colors.textSecondary,
  },
  title: {
    fontSize: 48,
    fontFamily: 'Georgia',
    fontWeight: 'bold',
    color: colors.turnGold,
  },
  configSummary: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  button: {
    backgroundColor: colors.buttonPrimary,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginTop: 20,
  },
  buttonText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
})
