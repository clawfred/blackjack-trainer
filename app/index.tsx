import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { Card, CardStack } from '../src/components/Card';
import { createCard, SUITS, RANKS, Card as CardType } from '../src/types';
import { COLORS, CARD_DIMENSIONS } from '../src/utils/constants';

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
        <Pressable style={[styles.button, styles.dealButton]} onPress={dealHand}>
          <Text style={styles.buttonText}>Deal Hand</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.hitButton]} onPress={hitPlayer}>
          <Text style={styles.buttonText}>Hit</Text>
        </Pressable>
      </View>

      <View style={styles.buttonRow}>
        <Pressable style={[styles.button, styles.singleButton]} onPress={dealSingle}>
          <Text style={styles.buttonText}>Deal Single</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.resetButton]} onPress={reset}>
          <Text style={styles.buttonText}>Reset</Text>
        </Pressable>
      </View>

      {/* Info text */}
      <Text style={styles.info}>
        {playerCards.length > 0 || dealerCards.length > 0
          ? `Player: ${playerCards.length} cards | Dealer: ${dealerCards.length} cards`
          : 'Press "Deal Hand" to start'}
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  gameArea: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  handArea: {
    alignItems: 'center',
    minHeight: CARD_DIMENSIONS.height + 40,
  },
  singleCardArea: {
    alignItems: 'center',
    minHeight: CARD_DIMENSIONS.height + 40,
  },
  label: {
    fontSize: 14,
    color: COLORS.text.muted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardsContainer: {
    minWidth: CARD_DIMENSIONS.width * 3,
    minHeight: CARD_DIMENSIONS.height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 140,
    alignItems: 'center',
  },
  dealButton: {
    backgroundColor: COLORS.actions.double,
  },
  hitButton: {
    backgroundColor: COLORS.actions.hit,
  },
  singleButton: {
    backgroundColor: COLORS.accents.primary,
  },
  resetButton: {
    backgroundColor: COLORS.feedback.error,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  info: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
  },
});
