import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, Rank, Suit } from '../../types';
import { colors } from '../theme/colors';
import { CardView } from './CardView';

export interface TutorialStep {
  title: string;
  body: string;
  renderIllustration?: () => React.ReactElement;
}

function card(rank: Rank, suit: Suit | null, id: string): Card {
  return { id, rank, suit };
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: 'The Goal',
    body: 'Be the first player to get rid of all your cards. You have three zones: cards in your hand, three face-up cards on the table, and three face-down cards underneath.',
    renderIllustration: () => (
      <View style={styles.row}>
        <View style={styles.group}>
          <Text style={styles.label}>Face-Up</Text>
          <View style={styles.row}>
            <CardView card={card(Rank.Ace, Suit.Spades, 't1-1')} faceDown={false} size="small" disabled />
            <CardView card={card(Rank.Ten, Suit.Hearts, 't1-2')} faceDown={false} size="small" disabled />
            <CardView card={card(Rank.Two, Suit.Clubs, 't1-3')} faceDown={false} size="small" disabled />
          </View>
        </View>
        <View style={styles.group}>
          <Text style={styles.label}>Face-Down</Text>
          <View style={styles.row}>
            <CardView card={null} faceDown size="small" disabled />
            <CardView card={null} faceDown size="small" disabled />
            <CardView card={null} faceDown size="small" disabled />
          </View>
        </View>
      </View>
    ),
  },
  {
    title: 'Setup',
    body: 'At the start, you choose 3 cards from your hand to place face-up. Pick your best special cards — 2s and 10s are great choices since they can be played on anything.',
    renderIllustration: () => (
      <View style={styles.row}>
        <CardView card={card(Rank.Two, Suit.Hearts, 't2-1')} faceDown={false} size="small" disabled selected />
        <CardView card={card(Rank.Ten, Suit.Diamonds, 't2-2')} faceDown={false} size="small" disabled selected />
        <CardView card={card(Rank.Ace, Suit.Spades, 't2-3')} faceDown={false} size="small" disabled selected />
        <CardView card={card(Rank.Five, Suit.Clubs, 't2-4')} faceDown={false} size="small" disabled />
        <CardView card={card(Rank.Nine, Suit.Hearts, 't2-5')} faceDown={false} size="small" disabled />
      </View>
    ),
  },
  {
    title: 'Playing Cards',
    body: 'On your turn, play a card equal to or higher in rank than the top of the pile. You can play multiple cards of the same rank together.',
    renderIllustration: () => (
      <View style={styles.row}>
        <View style={styles.group}>
          <Text style={styles.label}>Pile</Text>
          <CardView card={card(Rank.Six, Suit.Diamonds, 't3-1')} faceDown={false} size="small" disabled />
        </View>
        <Text style={styles.arrow}>{'\u2192'}</Text>
        <View style={styles.group}>
          <Text style={styles.labelGood}>Play</Text>
          <CardView card={card(Rank.Eight, Suit.Spades, 't3-2')} faceDown={false} size="small" disabled playable />
        </View>
      </View>
    ),
  },
  {
    title: 'Drawing & Picking Up',
    body: 'While the draw pile has cards, you always draw back up to 3 cards after playing. If you cannot play any card, you must pick up the entire pile into your hand.',
    renderIllustration: () => (
      <View style={styles.row}>
        <View style={styles.group}>
          <Text style={styles.label}>Draw Pile</Text>
          <CardView card={null} faceDown size="small" disabled />
        </View>
        <Text style={styles.arrow}>{'\u2192'}</Text>
        <View style={styles.group}>
          <Text style={styles.label}>Your Hand</Text>
          <View style={styles.row}>
            <CardView card={card(Rank.Four, Suit.Hearts, 't4-1')} faceDown={false} size="small" disabled />
            <CardView card={card(Rank.Jack, Suit.Clubs, 't4-2')} faceDown={false} size="small" disabled />
            <CardView card={card(Rank.King, Suit.Spades, 't4-3')} faceDown={false} size="small" disabled />
          </View>
        </View>
      </View>
    ),
  },
  {
    title: 'Special Cards',
    body: '2 and Joker are resets — play them on anything, and the next player can play any card. 10 is a blowup — it clears the entire pile!',
    renderIllustration: () => (
      <View style={styles.row}>
        <View style={styles.group}>
          <CardView card={card(Rank.Two, Suit.Spades, 't5-1')} faceDown={false} size="small" disabled />
          <Text style={styles.labelSmall}>Reset</Text>
        </View>
        <View style={styles.group}>
          <CardView card={card(Rank.Ten, Suit.Diamonds, 't5-2')} faceDown={false} size="small" disabled />
          <Text style={styles.labelSmall}>Blowup</Text>
        </View>
        <View style={styles.group}>
          <CardView card={card(Rank.Joker, null, 't5-3')} faceDown={false} size="small" disabled />
          <Text style={styles.labelSmall}>Reset</Text>
        </View>
      </View>
    ),
  },
  {
    title: 'Blowups',
    body: 'Playing a 10 clears the pile and you play again. A blowup also happens when 4 cards of the same rank end up on top of the pile — you get another turn either way!',
    renderIllustration: () => (
      <View style={styles.row}>
        <CardView card={card(Rank.Five, Suit.Hearts, 't6-1')} faceDown={false} size="small" disabled />
        <CardView card={card(Rank.Five, Suit.Diamonds, 't6-2')} faceDown={false} size="small" disabled />
        <CardView card={card(Rank.Five, Suit.Clubs, 't6-3')} faceDown={false} size="small" disabled />
        <CardView card={card(Rank.Five, Suit.Spades, 't6-4')} faceDown={false} size="small" disabled />
        <Text style={styles.boom}>BOOM!</Text>
      </View>
    ),
  },
  {
    title: 'Jump-In',
    body: 'When someone plays a card and you have the same rank in your hand, you can play it immediately to steal the turn — even when it\'s not your turn!',
    renderIllustration: () => (
      <View style={styles.row}>
        <View style={styles.group}>
          <Text style={styles.label}>Played</Text>
          <CardView card={card(Rank.Nine, Suit.Hearts, 't7-1')} faceDown={false} size="small" disabled />
        </View>
        <Text style={styles.arrow}>{'\u2190'}</Text>
        <View style={styles.group}>
          <Text style={styles.labelGood}>Jump In!</Text>
          <CardView card={card(Rank.Nine, Suit.Clubs, 't7-2')} faceDown={false} size="small" disabled playable />
        </View>
      </View>
    ),
  },
  {
    title: 'Card Phases',
    body: 'Play from your hand first (drawing up to 3). When your hand is empty, play your face-up cards. Finally, flip face-down cards blindly — if it can\'t be played, you pick up the pile!',
    renderIllustration: () => (
      <View style={styles.row}>
        <View style={styles.group}>
          <Text style={styles.phaseNumber}>1</Text>
          <CardView card={card(Rank.King, Suit.Hearts, 't8-1')} faceDown={false} size="small" disabled />
          <Text style={styles.labelSmall}>Hand</Text>
        </View>
        <Text style={styles.arrow}>{'\u2192'}</Text>
        <View style={styles.group}>
          <Text style={styles.phaseNumber}>2</Text>
          <CardView card={card(Rank.Ace, Suit.Diamonds, 't8-2')} faceDown={false} size="small" disabled />
          <Text style={styles.labelSmall}>Face-Up</Text>
        </View>
        <Text style={styles.arrow}>{'\u2192'}</Text>
        <View style={styles.group}>
          <Text style={styles.phaseNumber}>3</Text>
          <CardView card={null} faceDown size="small" disabled />
          <Text style={styles.labelSmall}>Face-Down</Text>
        </View>
      </View>
    ),
  },
];

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  group: {
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  labelGood: {
    fontSize: 11,
    color: colors.turnGold,
    fontWeight: '700',
  },
  labelSmall: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  arrow: {
    fontSize: 20,
    color: colors.textSecondary,
    marginHorizontal: 4,
  },
  boom: {
    fontSize: 16,
    color: colors.turnGold,
    fontWeight: '800',
    marginLeft: 8,
  },
  phaseNumber: {
    fontSize: 14,
    color: colors.turnGold,
    fontWeight: '800',
  },
});
