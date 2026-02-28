import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card as CardComponent } from './Card';
import { Card as CardType } from '../../types';
import { cardDimensions, animation } from '../../theme';

interface CardStackProps {
  cards: CardType[];
  faceUp?: boolean | boolean[]; // Single value or per-card
  dealFrom?: { x: number; y: number }; // Deal animation starting point
  basePosition?: { x: number; y: number }; // Base position for the stack
  staggerDeals?: boolean; // Whether to stagger card deal animations
  cardOffset?: { x: number; y: number }; // Offset between stacked cards
  onAllDealt?: () => void;
}

export function CardStack({
  cards,
  faceUp = true,
  dealFrom,
  basePosition = { x: 0, y: 0 },
  staggerDeals = true,
  cardOffset = { x: 16, y: 2 },
  onAllDealt,
}: CardStackProps) {
  const dealtCount = React.useRef(0);

  const handleCardDealt = () => {
    dealtCount.current += 1;
    if (dealtCount.current === cards.length && onAllDealt) {
      onAllDealt();
    }
  };

  // Reset count when cards change
  React.useEffect(() => {
    dealtCount.current = 0;
  }, [cards.length]);

  return (
    <View style={styles.container}>
      {cards.map((card, index) => {
        // Determine if this specific card is face up
        const isCardFaceUp = Array.isArray(faceUp) ? faceUp[index] : faceUp;

        // Calculate position offset for stacking
        const targetX = basePosition.x + index * cardOffset.x;
        const targetY = basePosition.y + index * cardOffset.y;

        // Calculate delay for staggered dealing (150ms between cards)
        const delay = staggerDeals ? index * animation.stagger.card : 0;

        return (
          <View
            key={`${card.rank}-${card.suit}-${index}`}
            style={[styles.cardPosition, { zIndex: index }]}
          >
            <CardComponent
              card={card}
              faceUp={isCardFaceUp}
              dealFrom={dealFrom}
              dealTo={{ x: targetX, y: targetY }}
              delay={delay}
              onDealComplete={handleCardDealt}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: cardDimensions.width,
    height: cardDimensions.height,
  },
  cardPosition: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
