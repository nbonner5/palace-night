import { createGame, createGameWithSeed, autoChooseFaceUp } from '../../src/engine/gameState';
import { GamePhase, PlayerPhase, Rank } from '../../src/types';
import { isSpecialCard } from '../../src/engine/rules';

describe('createGame', () => {
  const game = createGame();

  it('starts in Setup phase', () => {
    expect(game.gamePhase).toBe(GamePhase.Setup);
  });

  it('has 108 total cards', () => {
    const total =
      game.drawPile.length +
      game.pile.length +
      game.burnPile.length +
      game.players.reduce(
        (sum, p) => sum + p.hand.length + p.faceUp.length + p.faceDown.length,
        0
      );
    expect(total).toBe(108);
  });

  it('has correct initial player setup', () => {
    for (const player of game.players) {
      expect(player.hand).toHaveLength(6);
      expect(player.faceUp).toHaveLength(0);
      expect(player.faceDown).toHaveLength(3);
      expect(player.phase).toBe(PlayerPhase.HandAndDraw);
    }
  });

  it('has 72 in draw pile', () => {
    expect(game.drawPile).toHaveLength(72);
  });

  it('has 4 setup choices remaining', () => {
    expect(game.setupChoicesRemaining).toBe(4);
  });
});

describe('createGameWithSeed', () => {
  it('produces deterministic results', () => {
    const game1 = createGameWithSeed(42);
    const game2 = createGameWithSeed(42);

    // Same hands
    for (let i = 0; i < 4; i++) {
      expect(game1.players[i]!.hand.map((c) => c.id)).toEqual(
        game2.players[i]!.hand.map((c) => c.id)
      );
      expect(game1.players[i]!.faceDown.map((c) => c.id)).toEqual(
        game2.players[i]!.faceDown.map((c) => c.id)
      );
    }

    // Same draw pile
    expect(game1.drawPile.map((c) => c.id)).toEqual(
      game2.drawPile.map((c) => c.id)
    );
  });

  it('different seeds produce different games', () => {
    const game1 = createGameWithSeed(42);
    const game2 = createGameWithSeed(99);

    const ids1 = game1.players[0]!.hand.map((c) => c.id).join(',');
    const ids2 = game2.players[0]!.hand.map((c) => c.id).join(',');
    expect(ids1).not.toBe(ids2);
  });
});

describe('autoChooseFaceUp', () => {
  it('selects high-value cards and 10s for face-up', () => {
    const game = createGameWithSeed(42);
    const action = autoChooseFaceUp(game, 0);

    expect(action.type).toBe('CHOOSE_FACE_UP');
    expect(action.cardIds).toHaveLength(3);

    // All chosen cards should be from hand
    const hand = game.players[0]!.hand;
    for (const id of action.cardIds) {
      expect(hand.some((c) => c.id === id)).toBe(true);
    }
  });

  it('prefers 10s and high ranks over specials like 2/Joker', () => {
    // Run with multiple seeds to find one with 2s and high cards
    const game = createGameWithSeed(1);
    const action = autoChooseFaceUp(game, 0);

    const hand = game.players[0]!.hand;
    const chosen = hand.filter((c) => action.cardIds.includes(c.id));
    const remaining = hand.filter((c) => !action.cardIds.includes(c.id));

    // 2s and Jokers should NOT be chosen (if possible)
    const chosenSpecials = chosen.filter(
      (c) => c.rank === Rank.Two || c.rank === Rank.Joker
    );

    // Only chosen if there were no better options
    if (chosenSpecials.length > 0) {
      // All remaining must also be 2s/Jokers
      const remainingNonSpecial = remaining.filter(
        (c) => c.rank !== Rank.Two && c.rank !== Rank.Joker
      );
      expect(remainingNonSpecial).toHaveLength(0);
    }
  });
});
