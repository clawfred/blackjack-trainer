// Card types per PRD Section 2.3
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  rank: Rank;
  suit: Suit;
  value: number;        // 1-11 for Ace, 2-10 for numerics, 10 for face cards
  countValue: number;   // Hi-Lo: +1 (2-6), 0 (7-9), -1 (10-A)
}

// Helper to get card value
export function getCardValue(rank: Rank): number {
  if (rank === 'A') return 11;
  if (['K', 'Q', 'J'].includes(rank)) return 10;
  return parseInt(rank, 10);
}

// Helper to get Hi-Lo count value
export function getCountValue(rank: Rank): number {
  const lowCards: Rank[] = ['2', '3', '4', '5', '6'];
  const highCards: Rank[] = ['10', 'J', 'Q', 'K', 'A'];
  
  if (lowCards.includes(rank)) return 1;
  if (highCards.includes(rank)) return -1;
  return 0;
}

// Create a card from rank and suit
export function createCard(rank: Rank, suit: Suit): Card {
  return {
    rank,
    suit,
    value: getCardValue(rank),
    countValue: getCountValue(rank),
  };
}

// Get all suits and ranks for iteration
export const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
export const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// Check if suit is red (hearts/diamonds)
export function isRedSuit(suit: Suit): boolean {
  return suit === 'hearts' || suit === 'diamonds';
}
