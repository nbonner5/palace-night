import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GameConfig, GamePhase, DEFAULT_CONFIG } from '../types';
import { colors } from './theme/colors';
import { useGameController } from './hooks/useGameController';
import { useCardSelection } from './hooks/useCardSelection';
import { GameTable } from './components/GameTable';
import { SetupOverlay } from './components/SetupOverlay';
import { GameOverOverlay } from './components/GameOverOverlay';
import { BlowupEffect } from './components/BlowupEffect';
import { HomeScreen } from './components/HomeScreen';
import { PauseOverlay } from './components/PauseOverlay';

export function PalaceGame() {
  const [config, setConfig] = useState<GameConfig>(DEFAULT_CONFIG);
  const controller = useGameController(config);
  const { selectedIds, toggle, clear } = useCardSelection();
  const [showBlowup, setShowBlowup] = useState(false);
  const [appScreen, setAppScreen] = useState<'home' | 'game'>('home');
  const [leaderboard, setLeaderboard] = useState<Record<number, number>>({});
  const prevWinnerRef = useRef<number | null>(null);

  const { gameState, isProcessing, playableCardIds, playableZone, isHumanTurn, canPickUp, canHumanJumpIn, jumpInCardIds, revealedFaceDown } = controller;

  // Record wins when winnerId transitions from null to a number
  useEffect(() => {
    const winnerId = gameState.winnerId;
    if (prevWinnerRef.current === null && winnerId !== null) {
      setLeaderboard(prev => ({
        ...prev,
        [winnerId]: (prev[winnerId] ?? 0) + 1,
      }));
    }
    prevWinnerRef.current = winnerId;
  }, [gameState.winnerId]);

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

  const handleConfirmFaceDown = useCallback(() => {
    controller.confirmFaceDown();
  }, [controller]);

  const handleJumpIn = useCallback(() => {
    if (!canJumpIn) return;
    controller.jumpIn([...selectedIds]);
    clear();
  }, [canJumpIn, controller, selectedIds, clear]);

  const handleDoubleTapCard = useCallback((cardId: string) => {
    if (!canHumanJumpIn) return;
    const humanPlayer = gameState.players[0]!;
    const tappedCard = humanPlayer.hand.find(c => c.id === cardId);
    if (!tappedCard) return;
    const matchingIds = humanPlayer.hand
      .filter(c => c.rank === tappedCard.rank && jumpInCardIds.has(c.id))
      .map(c => c.id);
    if (matchingIds.length === 0) return;
    controller.jumpIn(matchingIds);
    clear();
  }, [canHumanJumpIn, gameState.players, jumpInCardIds, controller, clear]);

  const handleSetupConfirm = useCallback((cardIds: string[]) => {
    controller.chooseFaceUp(cardIds);
  }, [controller]);

  const handleNewGame = useCallback(() => {
    controller.newGame();
    clear();
  }, [controller, clear]);

  const handleStartGame = useCallback(() => {
    controller.newGame();
    clear();
    setAppScreen('game');
  }, [controller, clear]);

  const handleExitToHome = useCallback(() => {
    controller.newGame();
    clear();
    setLeaderboard({});
    setAppScreen('home');
  }, [controller, clear]);

  const handlePause = useCallback(() => {
    controller.pause();
  }, [controller]);

  const handleResume = useCallback(() => {
    controller.resume();
  }, [controller]);

  if (appScreen === 'home') {
    return <HomeScreen config={config} onConfigChange={setConfig} onNewGame={handleStartGame} />;
  }

  const isFinished = gameState.gamePhase === GamePhase.Finished;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Pause button (hidden when game is finished) */}
        {!isFinished && (
          <View style={styles.topBar}>
            <Pressable onPress={handlePause} style={styles.pauseButton}>
              <Text style={styles.pauseText}>| |</Text>
            </Pressable>
          </View>
        )}

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
          revealedFaceDown={revealedFaceDown}
          onCardPress={handleCardPress}
          onDoubleTapCard={handleDoubleTapCard}
          onPlay={handlePlay}
          onPickUp={handlePickUp}
          onFlipFaceDown={handleFlipFaceDown}
          onConfirmFaceDown={handleConfirmFaceDown}
          onJumpIn={handleJumpIn}
        />

        {/* Setup overlay */}
        {gameState.gamePhase === GamePhase.Setup && gameState.currentPlayerIndex === 0 && (
          <SetupOverlay
            hand={gameState.players[0]!.hand}
            onConfirm={handleSetupConfirm}
          />
        )}

        {/* Game over overlay */}
        {isFinished && gameState.winnerId !== null && (
          <GameOverOverlay
            winnerId={gameState.winnerId}
            leaderboard={leaderboard}
            playerCount={gameState.players.length}
            onNewGame={handleNewGame}
            onExitToHome={handleExitToHome}
          />
        )}

        {/* Pause overlay */}
        {controller.isPaused && (
          <PauseOverlay
            leaderboard={leaderboard}
            playerCount={gameState.players.length}
            onResume={handleResume}
            onNewGame={handleNewGame}
            onExitToHome={handleExitToHome}
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
  pauseButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  pauseText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '700',
  },
});
