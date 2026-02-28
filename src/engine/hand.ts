/**
 * Hand Evaluation Module
 * Handles hand creation, card addition, and evaluation (soft/hard totals, blackjack, bust).
 */

import { Card } from '../types';
import { RulesConfig } from './rules';

export interface Hand {
  /** Cards in the hand */
  cards: Card[];
  /** Current bet amount for this hand */
  bet: number;
  /** Whether this hand has been doubled */
  isDoubled: boolean;
  /** Whether this hand was created from a split */
  isSplit: boolean;
  /** Whether this hand was created from splitting aces */
  isSplitAce: boolean;
  /** Whether player surrendered this hand */
  isSurrendered: boolean;
  /** Whether player has stood on this hand */
  isStood: boolean;
  /** Whether this hand is busted */
  isBusted: boolean;
}

export interface HandEvaluation {
  /** Total value of the hand (best non-bust value if possible) */
  value: number;
  /** True if the total includes an ace counted as 11 */
  isSoft: boolean;
}

/**
 * Create a new empty hand
 */
export function createHand(bet: number = 0): Hand {
  return {
    cards: [],
    bet,
    isDoubled: false,
    isSplit: false,
    isSplitAce: false,
    isSurrendered: false,
    isStood: false,
    isBusted: false,
  };
}

/**
 * Add a card to a hand (immutable - returns new hand)
 */
export function addCardToHand(hand: Hand, card: Card): Hand {
  const newCards = [...hand.cards, card];
  const { value } = evaluateHand({ ...hand, cards: newCards });
  
  return {
    ...hand,
    cards: newCards,
    isBusted: value > 21,
  };
}

/**
 * Evaluate a hand's value and softness
 */
export function evaluateHand(hand: Hand): HandEvaluation {
  let value = 0;
  let aces = 0;

  // Sum all cards, counting aces as 11 initially
  for (const card of hand.cards) {
    if (card.rank === 'A') {
      aces++;
      value += 11;
    } else {
      value += card.value;
    }
  }

  // Convert aces from 11 to 1 as needed to avoid bust
  let softAces = aces;
  while (value > 21 && softAces > 0) {
    value -= 10;
    softAces--;
  }

  return {
    value,
    isSoft: softAces > 0 && value <= 21,
  };
}

/**
 * Check if hand is busted (value > 21)
 */
export function isBusted(hand: Hand): boolean {
  return evaluateHand(hand).value > 21;
}

/**
 * Check if hand is a natural blackjack (2 cards totaling 21)
 * Note: Split hands that make 21 are NOT blackjacks
 */
export function isBlackjack(hand: Hand): boolean {
  if (hand.cards.length !== 2) return false;
  if (hand.isSplit) return false; // 21 from split is not blackjack
  
  const { value } = evaluateHand(hand);
  return value === 21;
}

/**
 * Check if hand is a pair (two cards of same rank)
 * Note: 10 and K are NOT a pair (must be same rank)
 */
export function isPair(hand: Hand): boolean {
  if (hand.cards.length !== 2) return false;
  return hand.cards[0].rank === hand.cards[1].rank;
}

/**
 * Get the hand type for strategy lookup
 */
export type HandType = 'hard' | 'soft' | 'pair';

export function getHandType(hand: Hand): HandType {
  // Check pair first (for strategy purposes)
  if (isPair(hand)) {
    return 'pair';
  }
  
  const { isSoft } = evaluateHand(hand);
  return isSoft ? 'soft' : 'hard';
}

/**
 * Check if hand can be split based on rules
 */
export function canSplit(hand: Hand, rules: RulesConfig, splitCount: number = 0): boolean {
  // Must be exactly 2 cards
  if (hand.cards.length !== 2) return false;
  
  // Must be a pair
  if (!isPair(hand)) return false;
  
  // Check split limit
  if (splitCount >= rules.resplitLimit) return false;
  
  // Check ace-specific rules
  if (hand.cards[0].rank === 'A') {
    // If this is already a split ace hand, check resplit aces rule
    if (hand.isSplitAce && !rules.resplitAces) return false;
  }
  
  return true;
}

/**
 * Check if hand can be doubled based on rules
 */
export function canDouble(hand: Hand, rules: RulesConfig): boolean {
  // Must be exactly 2 cards (initial hand)
  if (hand.cards.length !== 2) return false;
  
  // Cannot double a doubled hand
  if (hand.isDoubled) return false;
  
  // Cannot double a surrendered hand
  if (hand.isSurrendered) return false;
  
  // Check if split hand - may not allow double after split
  if (hand.isSplit && !rules.doubleAfterSplit) return false;
  
  // Cannot double split aces (they only get one card anyway)
  if (hand.isSplitAce) return false;
  
  // Check doubling restrictions based on hand value
  const { value } = evaluateHand(hand);
  
  switch (rules.doubleDownOn) {
    case 'any':
      return true;
    case '9-11':
      return value >= 9 && value <= 11;
    case '10-11':
      return value >= 10 && value <= 11;
    default:
      return true;
  }
}

/**
 * Check if hand can surrender based on rules
 */
export function canSurrender(hand: Hand, rules: RulesConfig): boolean {
  // Must be initial 2 cards (not after hitting)
  if (hand.cards.length !== 2) return false;
  
  // Cannot surrender already actioned hands
  if (hand.isDoubled || hand.isSplit || hand.isStood || hand.isSurrendered) return false;
  
  // Check surrender rule
  return rules.surrender !== 'none';
}

/**
 * Check if hand can hit
 */
export function canHit(hand: Hand, rules: RulesConfig): boolean {
  // Cannot hit if already stood, busted, or surrendered
  if (hand.isStood || hand.isBusted || hand.isSurrendered) return false;
  
  // Cannot hit if doubled (already took one card)
  if (hand.isDoubled) return false;
  
  // Check split aces rule
  if (hand.isSplitAce && !rules.hitSplitAces) {
    // Split aces only get one card, so after 2 cards they cannot hit
    return hand.cards.length < 2;
  }
  
  return true;
}

/**
 * Check if hand can stand
 */
export function canStand(hand: Hand): boolean {
  // Cannot stand if already stood, busted, or surrendered
  return !hand.isStood && !hand.isBusted && !hand.isSurrendered;
}

/**
 * Mark hand as stood
 */
export function standHand(hand: Hand): Hand {
  return {
    ...hand,
    isStood: true,
  };
}

/**
 * Double a hand (double bet)
 */
export function doubleHand(hand: Hand): Hand {
  return {
    ...hand,
    bet: hand.bet * 2,
    isDoubled: true,
  };
}

/**
 * Mark hand as surrendered
 */
export function surrenderHand(hand: Hand): Hand {
  return {
    ...hand,
    isSurrendered: true,
  };
}

/**
 * Create two hands from splitting a pair
 * Returns tuple of [hand1, hand2]
 */
export function splitHand(hand: Hand): [Hand, Hand] {
  if (hand.cards.length !== 2 || !isPair(hand)) {
    throw new Error('Cannot split: hand is not a pair');
  }
  
  const isAceSplit = hand.cards[0].rank === 'A';
  
  const hand1: Hand = {
    cards: [hand.cards[0]],
    bet: hand.bet,
    isDoubled: false,
    isSplit: true,
    isSplitAce: isAceSplit,
    isSurrendered: false,
    isStood: false,
    isBusted: false,
  };
  
  const hand2: Hand = {
    cards: [hand.cards[1]],
    bet: hand.bet,
    isDoubled: false,
    isSplit: true,
    isSplitAce: isAceSplit,
    isSurrendered: false,
    isStood: false,
    isBusted: false,
  };
  
  return [hand1, hand2];
}

/**
 * Get display string for hand (for debugging/logging)
 */
export function handToString(hand: Hand): string {
  const cards = hand.cards.map(c => `${c.rank}${c.suit[0]}`).join(' ');
  const { value, isSoft } = evaluateHand(hand);
  const softStr = isSoft ? ' (soft)' : '';
  return `[${cards}] = ${value}${softStr}`;
}

/**
 * Compare dealer's up card value for strategy decisions
 */
export function getDealerUpCardValue(card: Card): number {
  if (card.rank === 'A') return 11;
  return card.value;
}
