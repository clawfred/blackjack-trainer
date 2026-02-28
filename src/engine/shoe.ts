/**
 * Shoe Management Module
 * Handles deck creation, shuffling, dealing, and cut card logic.
 */

import { Card, Rank, Suit, SUITS, RANKS, createCard } from '../types';

export interface Shoe {
  /** Remaining cards in the shoe (dealt from index 0) */
  cards: Card[];
  /** Cards already dealt (for counting reference) */
  dealtCards: Card[];
  /** Index where cut card is placed */
  cutCardPosition: number;
  /** True when cut card has been reached */
  needsShuffle: boolean;
  /** Number of decks in this shoe */
  numDecks: number;
}

/**
 * Create a single 52-card deck
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(createCard(rank, suit));
    }
  }
  return deck;
}

/**
 * Create a multi-deck shoe
 * @param numDecks - Number of decks (1, 2, 4, 6, or 8)
 */
export function createShoe(numDecks: 1 | 2 | 4 | 6 | 8): Shoe {
  const cards: Card[] = [];
  for (let i = 0; i < numDecks; i++) {
    cards.push(...createDeck());
  }
  return {
    cards,
    dealtCards: [],
    cutCardPosition: Math.floor(cards.length * 0.75), // Default 75% penetration
    needsShuffle: false,
    numDecks,
  };
}

/**
 * Fisher-Yates shuffle implementation
 * Pure function - returns a new shoe with shuffled cards
 */
export function shuffleShoe(shoe: Shoe): Shoe {
  const cards = [...shoe.cards, ...shoe.dealtCards]; // Combine all cards back
  
  // Fisher-Yates shuffle
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  
  return {
    ...shoe,
    cards,
    dealtCards: [],
    needsShuffle: false,
  };
}

/**
 * Shuffle shoe with a custom random function (for testing)
 */
export function shuffleShoeWithRng(
  shoe: Shoe,
  randomFn: () => number
): Shoe {
  const cards = [...shoe.cards, ...shoe.dealtCards];
  
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(randomFn() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  
  return {
    ...shoe,
    cards,
    dealtCards: [],
    needsShuffle: false,
  };
}

/**
 * Deal a card from the shoe
 * Returns [dealtCard, newShoe] tuple
 */
export function dealCard(shoe: Shoe): [Card, Shoe] {
  if (shoe.cards.length === 0) {
    throw new Error('Cannot deal from empty shoe');
  }
  
  const [card, ...remainingCards] = shoe.cards;
  const dealtCards = [...shoe.dealtCards, card];
  const cardsDealt = dealtCards.length;
  
  return [
    card,
    {
      ...shoe,
      cards: remainingCards,
      dealtCards,
      needsShuffle: cardsDealt >= shoe.cutCardPosition,
    },
  ];
}

/**
 * Place cut card at a specific penetration level
 * @param penetration - Value between 0.3 and 0.95 (e.g., 0.75 = 75% penetration)
 */
export function placeCutCard(shoe: Shoe, penetration: number): Shoe {
  if (penetration < 0.3 || penetration > 0.95) {
    throw new Error('Penetration must be between 0.3 and 0.95');
  }
  
  const totalCards = shoe.cards.length + shoe.dealtCards.length;
  const cutCardPosition = Math.floor(totalCards * penetration);
  
  return {
    ...shoe,
    cutCardPosition,
  };
}

/**
 * Check if shoe needs to be shuffled (cut card reached)
 */
export function needsShuffle(shoe: Shoe): boolean {
  return shoe.needsShuffle;
}

/**
 * Burn a card from the top of the shoe (typically done after shuffle)
 * Returns the new shoe (burned card goes to dealtCards)
 */
export function burnCard(shoe: Shoe): Shoe {
  if (shoe.cards.length === 0) {
    throw new Error('Cannot burn from empty shoe');
  }
  
  const [card, ...remainingCards] = shoe.cards;
  return {
    ...shoe,
    cards: remainingCards,
    dealtCards: [...shoe.dealtCards, card],
  };
}

/**
 * Get the number of cards remaining in the shoe
 */
export function cardsRemaining(shoe: Shoe): number {
  return shoe.cards.length;
}

/**
 * Get the number of cards dealt from the shoe
 */
export function cardsDealt(shoe: Shoe): number {
  return shoe.dealtCards.length;
}

/**
 * Get the running count (Hi-Lo) from dealt cards
 */
export function getRunningCount(shoe: Shoe): number {
  return shoe.dealtCards.reduce((count, card) => count + card.countValue, 0);
}

/**
 * Get the true count (running count / decks remaining)
 */
export function getTrueCount(shoe: Shoe): number {
  const runningCount = getRunningCount(shoe);
  const decksRemaining = shoe.cards.length / 52;
  
  if (decksRemaining < 0.5) {
    // Less than half a deck, use 0.5 to avoid division issues
    return runningCount / 0.5;
  }
  
  return runningCount / decksRemaining;
}

/**
 * Reset a shoe for a new shuffle (combine all cards)
 */
export function resetShoe(shoe: Shoe): Shoe {
  return {
    ...shoe,
    cards: [...shoe.cards, ...shoe.dealtCards],
    dealtCards: [],
    needsShuffle: false,
  };
}

/**
 * Initialize a shoe ready for play (create, shuffle, burn)
 */
export function initializeShoe(
  numDecks: 1 | 2 | 4 | 6 | 8,
  penetration: number = 0.75
): Shoe {
  let shoe = createShoe(numDecks);
  shoe = placeCutCard(shoe, penetration);
  shoe = shuffleShoe(shoe);
  shoe = burnCard(shoe);
  return shoe;
}
