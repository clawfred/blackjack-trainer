import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card as CardType, isRedSuit } from '../../types';
import { COLORS, CARD_DIMENSIONS } from '../../utils/constants';

interface CardFaceProps {
  card: CardType;
}

// Unicode suit symbols
const SUIT_SYMBOLS: Record<string, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

export function CardFace({ card }: CardFaceProps) {
  const isRed = isRedSuit(card.suit);
  const suitColor = isRed ? COLORS.card.hearts : COLORS.card.spades;
  const suitSymbol = SUIT_SYMBOLS[card.suit];

  return (
    <View style={styles.container}>
      {/* Top left corner */}
      <View style={styles.corner}>
        <Text style={[styles.rank, { color: suitColor }]}>{card.rank}</Text>
        <Text style={[styles.suit, { color: suitColor }]}>{suitSymbol}</Text>
      </View>

      {/* Center pip */}
      <View style={styles.center}>
        <Text style={[styles.centerSuit, { color: suitColor }]}>{suitSymbol}</Text>
      </View>

      {/* Bottom right corner (rotated) */}
      <View style={[styles.corner, styles.bottomCorner]}>
        <Text style={[styles.rank, { color: suitColor }]}>{card.rank}</Text>
        <Text style={[styles.suit, { color: suitColor }]}>{suitSymbol}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_DIMENSIONS.width,
    height: CARD_DIMENSIONS.height,
    backgroundColor: COLORS.card.face,
    borderRadius: CARD_DIMENSIONS.borderRadius,
    borderWidth: CARD_DIMENSIONS.borderWidth,
    borderColor: CARD_DIMENSIONS.borderColor,
    padding: 4,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    top: 4,
    left: 4,
    alignItems: 'center',
  },
  bottomCorner: {
    top: 'auto',
    left: 'auto',
    bottom: 4,
    right: 4,
    transform: [{ rotate: '180deg' }],
  },
  rank: {
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 16,
  },
  suit: {
    fontSize: 12,
    lineHeight: 14,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerSuit: {
    fontSize: 32,
    lineHeight: 36,
  },
});
