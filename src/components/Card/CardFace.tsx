import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card as CardType, isRedSuit } from '../../types';
import { colors, cardDimensions, typography } from '../../theme';

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
  const suitColor = isRed ? colors.suit.red : colors.suit.black;
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
    width: cardDimensions.width,
    height: cardDimensions.height,
    backgroundColor: colors.card.face,
    borderRadius: cardDimensions.borderRadius,
    borderWidth: cardDimensions.borderWidth,
    borderColor: colors.card.border,
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
    top: undefined,
    left: undefined,
    bottom: 4,
    right: 4,
    transform: [{ rotate: '180deg' }],
  },
  rank: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    lineHeight: 16,
  },
  suit: {
    fontSize: typography.fontSize.sm,
    lineHeight: 14,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerSuit: {
    fontSize: typography.fontSize['3xl'],
    lineHeight: 36,
  },
});
