import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GamePhase } from '../types';
import { colors } from './theme/colors';
import { useGameController } from './hooks/useGameController';
import { useCardSelection } from './hooks/useCardSelection';
import { GameTable } from './components/GameTable';
import { SetupOverlay } from './components/SetupOverlay';
import { GameOverOverlay } from './components/GameOverOverlay';
import { BlowupEffect } from './components/BlowupEffect';

export function PalaceGame() {
  const controller = useGameController();
  const { selectedIds, toggle, clear } = useCardSelection();
  const [showBlowup, setShowBlowup] = useState(false);

  const { gameState, isProcessing, playableCardIds, playableZone, isHumanTurn, canPickUp, canHumanJumpIn, jumpInCardIds } = controller;

  // Check if all selected cards are playable
  const canPlay = useMemo(() => {
    if (selectedIds.size === 0) return false;
    for (const id of selectedIds) {
      if (!playableCardIds.has(id)) return false;
    }
    return true;
  }, [selectedIds, playableCardIds]);

  // Check if selected cards are valid for jump-in
  const canJumpIn = useMemo(() => {
    if (selectedIds.size === 0) return false;
    for (const id of selectedIds) {
      if (!jumpInCardIds.has(id)) return false;
    }
    return true;
  }, [selectedIds, jumpInCardIds]);

  const handleCardPress = useCallback((cardId: string) => {
    toggle(cardId, playableZone);
  }, [toggle, playableZone]);

  const handlePlay = useCallback(() => {
    if (!canPlay) return;
    controller.playCards([...selectedIds]);
    clear();
  }, [canPlay, controller, selectedIds, clear]);

  const handlePickUp = useCallback(() => {
    controller.pickUpPile();
    clear();
  }, [controller, clear]);

  const handleFlipFaceDown = useCallback((slotIndex: number) => {
    controller.flipFaceDown(slotIndex);
  }, [controller]);

  const handleJumpIn = useCallback(() => {
    if (!canJumpIn) return;
    controller.jumpIn([...selectedIds]);
    clear();
  }, [canJumpIn, controller, selectedIds, clear]);

  const handleSetupConfirm = useCallback((cardIds: string[]) => {
    controller.chooseFaceUp(cardIds);
  }, [controller]);

  const handleNewGame = useCallback(() => {
    controller.newGame();
    clear();
  }, [controller, clear]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* New Game button */}
        <View style={styles.topBar}>
          <Pressable onPress={handleNewGame} style={styles.newGameButton}>
            <Text style={styles.newGameText}>New Game</Text>
          </Pressable>
        </View>

        {/* Main game table */}
        <GameTable
          game={gameState}
          isProcessing={isProcessing}
          selectedIds={selectedIds}
          playableIds={playableCardIds}
          canPlay={canPlay}
          canPickUp={canPickUp}
          isHumanTurn={isHumanTurn}
          canHumanJumpIn={canHumanJumpIn}
          jumpInCardIds={jumpInCardIds}
          canJumpIn={canJumpIn}
          onCardPress={handleCardPress}
          onPlay={handlePlay}
          onPickUp={handlePickUp}
          onFlipFaceDown={handleFlipFaceDown}
          onJumpIn={handleJumpIn}
        />

        {/* Setup overlay */}
        {gameState.gamePhase === GamePhase.Setup && gameState.currentPlayerIndex === 0 && (
          <SetupOverlay
            hand={gameState.players[0].hand}
            onConfirm={handleSetupConfirm}
          />
        )}

        {/* Game over overlay */}
        {gameState.gamePhase === GamePhase.Finished && gameState.winnerId !== null && (
          <GameOverOverlay
            winnerId={gameState.winnerId}
            onNewGame={handleNewGame}
          />
        )}

        {/* Blowup effect */}
        <BlowupEffect visible={showBlowup} onComplete={() => setShowBlowup(false)} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.tableDark,
  },
  container: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    top: 4,
    right: 8,
    zIndex: 50,
  },
  newGameButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  newGameText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
});
