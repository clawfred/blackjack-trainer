import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { Card, CardStack } from '../src/components/Card';
import { Button } from '../src/components/ui';
import { createCard, SUITS, RANKS, Card as CardType } from '../src/types';
import { colors, typography, spacing, cardDimensions } from '../src/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Position for dealing from (top-right, off-screen)
const DEAL_FROM = {
  x: SCREEN_WIDTH + 50,
  y: -100,
};

// Generate a random card
function getRandomCard(): CardType {
  const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
  const rank = RANKS[Math.floor(Math.random() * RANKS.length)];
  return createCard(rank, suit);
}

export default function DemoScreen() {
  const [playerCards, setPlayerCards] = useState<CardType[]>([]);
  const [dealerCards, setDealerCards] = useState<CardType[]>([]);
  const [singleCard, setSingleCard] = useState<CardType | null>(null);
  const [singleCardFaceUp, setSingleCardFaceUp] = useState(true);
  const [dealKey, setDealKey] = useState(0); // Force re-render for new deals

  // Deal a new hand (2 cards each)
  const dealHand = useCallback(() => {
    setPlayerCards([getRandomCard(), getRandomCard()]);
    setDealerCards([getRandomCard(), getRandomCard()]);
    setDealKey((k) => k + 1);
  }, []);

  // Deal a single card
  const dealSingle = useCallback(() => {
    setSingleCard(getRandomCard());
    setSingleCardFaceUp(true);
    setDealKey((k) => k + 1);
  }, []);

  // Flip the single card
  const flipSingleCard = useCallback(() => {
    setSingleCardFaceUp((f) => !f);
  }, []);

  // Reset everything
  const reset = useCallback(() => {
    setPlayerCards([]);
    setDealerCards([]);
    setSingleCard(null);
    setDealKey((k) => k + 1);
  }, []);

  // Add a card to player's hand
  const hitPlayer = useCallback(() => {
    setPlayerCards((cards) => [...cards, getRandomCard()]);
    setDealKey((k) => k + 1);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Blackjack Trainer</Text>
      <Text style={styles.subtitle}>Card Demo Screen</Text>

      {/* Game area */}
      <View style={styles.gameArea}>
        {/* Dealer area */}
        <View style={styles.handArea}>
          <Text style={styles.label}>Dealer</Text>
          <View style={styles.cardsContainer}>
            {dealerCards.length > 0 && (
              <CardStack
                key={`dealer-${dealKey}`}
                cards={dealerCards}
                faceUp={[true, false]} // First card face up, second face down
                dealFrom={DEAL_FROM}
                basePosition={{ x: 0, y: 0 }}
                staggerDeals
                cardOffset={{ x: 20, y: 0 }}
              />
            )}
          </View>
        </View>

        {/* Single card demo */}
        {singleCard && (
          <View style={styles.singleCardArea}>
            <Text style={styles.label}>Single Card (tap to flip)</Text>
            <Pressable onPress={flipSingleCard}>
              <Card
                key={`single-${dealKey}`}
                card={singleCard}
                faceUp={singleCardFaceUp}
                dealFrom={DEAL_FROM}
                dealTo={{ x: 0, y: 0 }}
              />
            </Pressable>
          </View>
        )}

        {/* Player area */}
        <View style={styles.handArea}>
          <Text style={styles.label}>Player</Text>
          <View style={styles.cardsContainer}>
            {playerCards.length > 0 && (
              <CardStack
                key={`player-${dealKey}`}
                cards={playerCards}
                faceUp
                dealFrom={DEAL_FROM}
                basePosition={{ x: 0, y: 0 }}
                staggerDeals
                cardOffset={{ x: 20, y: 0 }}
              />
            )}
          </View>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.buttonRow}>
        <Button
          title="Deal Hand"
          variant="primary"
          onPress={dealHand}
        />
        <Button
          title="Hit"
          variant="success"
          onPress={hitPlayer}
        />
      </View>

      <View style={styles.buttonRow}>
        <Button
          title="Deal Single"
          variant="secondary"
          onPress={dealSingle}
        />
        <Button
          title="Reset"
          variant="danger"
          onPress={reset}
        />
      </View>

      {/* Play Game Button */}
      <View style={styles.buttonRow}>
        <Button
          title="🎰 Play Blackjack"
          variant="primary"
          size="lg"
          onPress={() => router.push('/game')}
          style={styles.playButton}
        />
      </View>

      {/* Info text */}
      <Text style={styles.info}>
        {playerCards.length > 0 || dealerCards.length > 0
          ? `Player: ${playerCards.length} cards | Dealer: ${dealerCards.length} cards`
          : 'Press "Play Blackjack" to start a game'}
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  gameArea: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  handArea: {
    alignItems: 'center',
    minHeight: cardDimensions.height + 40,
  },
  singleCardArea: {
    alignItems: 'center',
    minHeight: cardDimensions.height + 40,
  },
  label: {
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardsContainer: {
    minWidth: cardDimensions.width * 3,
    minHeight: cardDimensions.height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  info: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  playButton: {
    minWidth: 200,
  },
});
