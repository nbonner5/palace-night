import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GamePhase, PlayerPhase } from '../types';
import { LobbyConfig } from '../types/multiplayer';
import { colors } from './theme/colors';
import { useGameController } from './hooks/useGameController';
import { useCardSelection } from './hooks/useCardSelection';
import { useSocket } from './hooks/useSocket';
import { useLobby } from './hooks/useLobby';
import { useDisplayName } from './hooks/useDisplayName';
import { usePersistedConfig } from './hooks/usePersistedConfig';
import { useMultiplayerController } from './hooks/useMultiplayerController';
import { TurnTimer as TurnTimerBar } from './components/TurnTimer';
import { GameTable } from './components/GameTable';
import { SetupOverlay } from './components/SetupOverlay';
import { GameOverOverlay } from './components/GameOverOverlay';
import { BlowupEffect } from './components/BlowupEffect';
import { GameEventMessage } from './components/GameEventMessage';
import { HomeScreen } from './components/HomeScreen';
import { PauseOverlay } from './components/PauseOverlay';
import { OnlineMenu } from './components/OnlineMenu';
import { WaitingRoom } from './components/WaitingRoom';
import { PostGameOverlay } from './components/PostGameOverlay';

type AppScreen = 'home' | 'game' | 'online-menu' | 'waiting-room' | 'online-game';

export function PalaceGame() {
  const { config, setConfig } = usePersistedConfig();
  const controller = useGameController(config);
  const { selectedIds, toggle, clear } = useCardSelection();
  const [showBlowup, setShowBlowup] = useState(false);
  const [appScreen, setAppScreen] = useState<AppScreen>('home');
  const [leaderboard, setLeaderboard] = useState<Record<number, number>>({});
  const prevWinnerRef = useRef<number | null>(null);

  // Online hooks
  const socket = useSocket();
  const lobby = useLobby({ send: socket.send, onMessage: socket.onMessage });
  const { displayName, setDisplayName, isLoaded: nameLoaded } = useDisplayName();
  const mpController = useMultiplayerController({ send: socket.send, onMessage: socket.onMessage });
  const [turnTimer, setTurnTimer] = useState<{ remaining: number; total: number } | null>(null);
  const [eventMessage, setEventMessage] = useState<string | null>(null);

  const { gameState, isProcessing, playableCardIds, playableZone, isHumanTurn, canPickUp, canHumanJumpIn, jumpInCardIds } = controller;

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

  // Navigate to waiting room when lobby is created/joined
  useEffect(() => {
    if (lobby.lobby && appScreen === 'online-menu') {
      setAppScreen('waiting-room');
    }
  }, [lobby.lobby, appScreen]);

  // Listen for game start
  useEffect(() => {
    const unsub = socket.onMessage('GAME_STARTED', () => {
      if (appScreen === 'waiting-room') {
        setAppScreen('online-game');
      }
    });
    return unsub;
  }, [socket.onMessage, appScreen]);

  // Clear card selection on any turn change (removes stale jump-in highlights)
  const activeCurrentPlayerIndex = appScreen === 'online-game'
    ? mpController.gameState.currentPlayerIndex
    : gameState.currentPlayerIndex;
  useEffect(() => {
    clear();
  }, [activeCurrentPlayerIndex, clear]);

  // Listen for turn timer updates
  useEffect(() => {
    const unsub = socket.onMessage('TURN_TIMER', (msg) => {
      if (msg.type === 'TURN_TIMER') {
        setTurnTimer({ remaining: msg.remainingMs, total: msg.totalMs });
      }
    });
    return unsub;
  }, [socket.onMessage]);

  // Build seat name resolver for event messages
  const getSeatName = useCallback((playerIndex: number, isOnline: boolean) => {
    if (isOnline) {
      return mpController.seatNames[playerIndex] ?? `Player ${playerIndex}`;
    }
    return playerIndex === 0 ? 'You' : `CPU ${playerIndex}`;
  }, [mpController.seatNames]);

  // Surface game events as messages (singleplayer)
  useEffect(() => {
    if (appScreen !== 'game') return;
    const events = controller.lastEvents;
    if (events.length === 0) return;
    for (const e of events) {
      if (e.type === 'JUMP_IN') {
        setEventMessage(`${getSeatName(e.playerIndex, false)} jumped in!`);
      } else if (e.type === 'BLOWUP') {
        setEventMessage('Blow up!');
        setShowBlowup(true);
      }
    }
  }, [controller.lastEvents, appScreen, getSeatName]);

  // Surface game events as messages (multiplayer)
  useEffect(() => {
    if (appScreen !== 'online-game') return;
    const events = mpController.lastEvents;
    if (events.length === 0) return;
    for (const e of events) {
      if (e.type === 'JUMP_IN') {
        setEventMessage(`${getSeatName(e.playerIndex, true)} jumped in!`);
      } else if (e.type === 'BLOWUP') {
        setEventMessage('Blow up!');
        setShowBlowup(true);
      }
    }
  }, [mpController.lastEvents, appScreen, getSeatName]);

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

  const handleRevealToHand = useCallback((slotIndex: number) => {
    controller.revealToHand(slotIndex);
  }, [controller]);

  const handleJumpIn = useCallback(() => {
    if (!canJumpIn) return;
    controller.jumpIn([...selectedIds]);
    clear();
  }, [canJumpIn, controller, selectedIds, clear]);

  const handleDoubleTapCard = useCallback((cardId: string) => {
    const humanPlayer = gameState.players[0]!;
    const tappedCard = humanPlayer.hand.find(c => c.id === cardId);
    if (!tappedCard) return;

    // Jump-in: select all matching jump-in cards and jump in
    if (canHumanJumpIn && !isHumanTurn) {
      const matchingIds = humanPlayer.hand
        .filter(c => c.rank === tappedCard.rank && jumpInCardIds.has(c.id))
        .map(c => c.id);
      if (matchingIds.length > 0) {
        controller.jumpIn(matchingIds);
        clear();
        return;
      }
    }

    // Normal play: select all matching playable cards and play them
    if (isHumanTurn && playableCardIds.has(cardId)) {
      const matchingIds = humanPlayer.hand
        .filter(c => c.rank === tappedCard.rank && playableCardIds.has(c.id))
        .map(c => c.id);
      if (matchingIds.length > 0) {
        controller.playCards(matchingIds);
        clear();
      }
    }
  }, [canHumanJumpIn, isHumanTurn, gameState.players, jumpInCardIds, playableCardIds, controller, clear]);

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

  // ── Online handlers ──

  const handlePlayOnline = useCallback(() => {
    socket.connect();
    setAppScreen('online-menu');
  }, [socket]);

  const handleOnlineBack = useCallback(() => {
    socket.disconnect();
    setAppScreen('home');
  }, [socket]);

  const handleDisplayNameChange = useCallback((name: string) => {
    setDisplayName(name);
    socket.send({ type: 'SET_DISPLAY_NAME', displayName: name });
  }, [setDisplayName, socket]);

  const handleCreateLobby = useCallback((lobbyConfig: LobbyConfig) => {
    // Ensure server knows display name
    if (displayName) {
      socket.send({ type: 'SET_DISPLAY_NAME', displayName });
    }
    lobby.createLobby(lobbyConfig);
  }, [displayName, socket, lobby]);

  const handleJoinLobby = useCallback((code: string, password?: string) => {
    if (displayName) {
      socket.send({ type: 'SET_DISPLAY_NAME', displayName });
    }
    lobby.joinLobby(code, password);
  }, [displayName, socket, lobby]);

  const handleLeaveLobby = useCallback(() => {
    lobby.leaveLobby();
    setAppScreen('online-menu');
  }, [lobby]);

  const handleSetReady = useCallback((ready: boolean) => {
    lobby.setReady(ready);
  }, [lobby]);

  const handleLeaveOnlineGame = useCallback(() => {
    lobby.leaveLobby();
    socket.disconnect();
    setAppScreen('home');
  }, [lobby, socket]);

  const handleSwapSeats = useCallback((seatA: number, seatB: number) => {
    socket.send({ type: 'SWAP_SEATS', seatA, seatB });
  }, [socket]);

  const isHost = useMemo(() => {
    if (!lobby.lobby) return false;
    return lobby.lobby.participants.some(p => p.playerId === socket.playerId && p.isHost);
  }, [lobby.lobby, socket.playerId]);

  // ── Render ──

  if (appScreen === 'home') {
    return (
      <HomeScreen
        config={config}
        onConfigChange={setConfig}
        onNewGame={handleStartGame}
        onPlayOnline={handlePlayOnline}
      />
    );
  }

  if (appScreen === 'online-menu') {
    return (
      <SafeAreaView style={styles.safe}>
        <OnlineMenu
          displayName={displayName}
          onDisplayNameChange={handleDisplayNameChange}
          lobbyList={lobby.lobbyList}
          error={lobby.error}
          onCreateLobby={handleCreateLobby}
          onJoinLobby={handleJoinLobby}
          onRefreshLobbies={lobby.refreshList}
          onBack={handleOnlineBack}
        />
      </SafeAreaView>
    );
  }

  if (appScreen === 'waiting-room' && lobby.lobby) {
    return (
      <SafeAreaView style={styles.safe}>
        <WaitingRoom
          lobby={lobby.lobby}
          myPlayerId={socket.playerId}
          isHost={isHost}
          onReady={handleSetReady}
          onLeave={handleLeaveLobby}
          onSwapSeats={handleSwapSeats}
        />
      </SafeAreaView>
    );
  }

  if (appScreen === 'online-game') {
    const mp = mpController;
    const mpState = mp.gameState;
    const mpFinished = mpState.gamePhase === GamePhase.Finished;

    const mpCanPlay = (() => {
      if (selectedIds.size === 0) return false;
      for (const id of selectedIds) {
        if (!mp.playableCardIds.has(id)) return false;
      }
      return true;
    })();

    const mpCanJumpIn = (() => {
      if (selectedIds.size === 0) return false;
      for (const id of selectedIds) {
        if (!mp.jumpInCardIds.has(id)) return false;
      }
      return true;
    })();

    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          {/* Turn timer */}
          {turnTimer && !mpFinished && (
            <TurnTimerBar remainingMs={turnTimer.remaining} totalMs={turnTimer.total} />
          )}

          <GameTable
            game={mpState}
            isProcessing={mp.isProcessing}
            selectedIds={selectedIds}
            playableIds={mp.playableCardIds}
            canPlay={mpCanPlay}
            canPickUp={mp.canPickUp}
            isHumanTurn={mp.isHumanTurn}
            canHumanJumpIn={mp.canHumanJumpIn}
            jumpInCardIds={mp.jumpInCardIds}
            canJumpIn={mpCanJumpIn}
            canRevealFaceDown={mpState.players[0]!.phase === PlayerPhase.FaceDown && mpState.players[0]!.hand.length === 0 && mpState.players[0]!.faceDown.length > 0}
            seatNames={mp.seatNames}
            onCardPress={(cardId) => toggle(cardId, mp.playableZone)}
            onDoubleTapCard={(cardId) => {
              const human = mpState.players[0]!;
              const tapped = human.hand.find((c) => c.id === cardId);
              if (!tapped) return;
              if (mp.canHumanJumpIn && !mp.isHumanTurn) {
                const ids = human.hand.filter((c) => c.rank === tapped.rank && mp.jumpInCardIds.has(c.id)).map((c) => c.id);
                if (ids.length > 0) { mp.jumpIn(ids); clear(); return; }
              }
              if (mp.isHumanTurn && mp.playableCardIds.has(cardId)) {
                const ids = human.hand.filter((c) => c.rank === tapped.rank && mp.playableCardIds.has(c.id)).map((c) => c.id);
                if (ids.length > 0) { mp.playCards(ids); clear(); }
              }
            }}
            onPlay={() => { if (mpCanPlay) { mp.playCards([...selectedIds]); clear(); } }}
            onPickUp={() => { mp.pickUpPile(); clear(); }}
            onRevealToHand={(slotIndex) => mp.revealToHand(slotIndex)}
            onJumpIn={() => { if (mpCanJumpIn) { mp.jumpIn([...selectedIds]); clear(); } }}
          />

          {/* Setup overlay for multiplayer */}
          {mpState.gamePhase === GamePhase.Setup && !mp.hasChosenFaceUp && (
            <SetupOverlay
              hand={mpState.players[0]!.hand}
              onConfirm={(cardIds) => mp.chooseFaceUp(cardIds)}
            />
          )}

          {/* Waiting for other players to choose */}
          {mpState.gamePhase === GamePhase.Setup && mp.hasChosenFaceUp && (
            <View style={styles.waitingOverlay}>
              <Text style={styles.waitingText}>Waiting for others to choose...</Text>
            </View>
          )}

          {/* Game over */}
          {mpFinished && mpState.winnerId !== null && (
            <PostGameOverlay
              winnerId={mpState.winnerId}
              leaderboard={mp.leaderboard}
              playerCount={mpState.players.length}
              seatNames={mp.seatNames}
              rematchReady={mp.rematchReady}
              isHost={isHost}
              yourSeatIndex={mp.yourSeatIndex}
              onRequestRematch={mp.requestRematch}
              onLeave={handleLeaveOnlineGame}
              onSwapSeats={handleSwapSeats}
            />
          )}

          {/* Event message */}
          <GameEventMessage message={eventMessage} onDismiss={() => setEventMessage(null)} />

          {/* Blowup effect */}
          <BlowupEffect visible={showBlowup} onComplete={() => setShowBlowup(false)} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Singleplayer game screen ──

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
          canRevealFaceDown={gameState.players[0]!.phase === PlayerPhase.FaceDown && gameState.players[0]!.hand.length === 0 && gameState.players[0]!.faceDown.length > 0}
          onCardPress={handleCardPress}
          onDoubleTapCard={handleDoubleTapCard}
          onPlay={handlePlay}
          onPickUp={handlePickUp}
          onRevealToHand={handleRevealToHand}
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

        {/* Event message */}
        <GameEventMessage message={eventMessage} onDismiss={() => setEventMessage(null)} />

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
  waitingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlayBg,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  waitingText: {
    color: colors.textSecondary,
    fontSize: 18,
    fontWeight: '600',
    fontStyle: 'italic',
  },
});
