import React from 'react'
import { StyleSheet, View } from 'react-native'
import { GameState } from '../../types'
import { PlayPile } from './PlayPile'
import { DrawPile } from './DrawPile'
import { TurnIndicator } from './TurnIndicator'

interface CenterAreaProps {
  game: GameState
  isProcessing: boolean
}

export function CenterArea({ game, isProcessing }: CenterAreaProps) {
  return (
    <View style={styles.container}>
      <TurnIndicator
        currentPlayerIndex={game.currentPlayerIndex}
        gamePhase={game.gamePhase}
        mustPlayAgain={game.mustPlayAgain}
        isProcessing={isProcessing}
      />
      <View style={styles.piles}>
        <DrawPile count={game.drawPile.length} />
        <PlayPile pile={game.pile} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  piles: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
})
