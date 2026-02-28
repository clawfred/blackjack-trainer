/**
 * Hand Component
 * Renders a blackjack hand using CardStack with proper positioning and animations.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CardStack } from '../Card';
import { Card } from '../../types';
import { cardDimensions } from '../../theme';

interface HandProps {
  cards: Card[];
  /** Array of face-up states for each card, or single boolean for all */
  faceUp?: boolean | boolean[];
  /** Animate cards dealing in */
  animate?: boolean;
  /** Starting position for deal animation (relative to screen) */
  dealFrom?: { x: number; y: number };
  /** Label for the hand (e.g., "Player", "Dealer") */
  label?: string;
  /** Horizontal offset between cards (default: 20) */
  cardOffset?: number;
  /** Callback when all cards are dealt */
  onAllDealt?: () => void;
  /** Whether this is the active hand (for highlighting) */
  isActive?: boolean;
}

export function Hand({
  cards,
  faceUp = true,
  animate = true,
  dealFrom,
  cardOffset = 20,
  onAllDealt,
  isActive = false,
}: HandProps) {
  // Calculate the total width needed for the hand
  const handWidth = cardDimensions.width + (cards.length - 1) * cardOffset;

  return (
    <View style={[styles.container, isActive && styles.activeHand]}>
      <View style={[styles.cardsWrapper, { width: handWidth }]}>
        <CardStack
          cards={cards}
          faceUp={faceUp}
          dealFrom={animate ? dealFrom : undefined}
          staggerDeals={animate}
          cardOffset={{ x: cardOffset, y: 0 }}
          onAllDealt={onAllDealt}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: cardDimensions.height + 16,
    padding: 8,
  },
  activeHand: {
    // Subtle highlight for active hand during splits
    borderRadius: 12,
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
  },
  cardsWrapper: {
    height: cardDimensions.height,
    position: 'relative',
  },
});

export default Hand;
