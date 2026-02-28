import { describe, it, expect } from 'vitest';
import {
  createHand,
  addCardToHand,
  evaluateHand,
  isBusted,
  isBlackjack,
  isPair,
  getHandType,
  canSplit,
  canDouble,
  canSurrender,
  canHit,
  canStand,
  standHand,
  doubleHand,
  surrenderHand,
  splitHand,
  handToString,
} from '../../src/engine/hand';
import { createCard, Card } from '../../src/types';
import { VEGAS_STRIP_RULES, EUROPEAN_RULES } from '../../src/engine/rules';

// Helper to create cards quickly
const card = (rank: string, suit: string = 'hearts'): Card => 
  createCard(rank as any, suit as any);

describe('createHand', () => {
  it('creates empty hand', () => {
    const hand = createHand();
    expect(hand.cards).toHaveLength(0);
    expect(hand.bet).toBe(0);
    expect(hand.isDoubled).toBe(false);
    expect(hand.isSplit).toBe(false);
    expect(hand.isSurrendered).toBe(false);
    expect(hand.isStood).toBe(false);
    expect(hand.isBusted).toBe(false);
  });

  it('creates hand with bet', () => {
    const hand = createHand(100);
    expect(hand.bet).toBe(100);
  });
});

describe('addCardToHand', () => {
  it('adds card to hand', () => {
    let hand = createHand();
    hand = addCardToHand(hand, card('A'));
    
    expect(hand.cards).toHaveLength(1);
    expect(hand.cards[0].rank).toBe('A');
  });

  it('preserves existing cards', () => {
    let hand = createHand();
    hand = addCardToHand(hand, card('A'));
    hand = addCardToHand(hand, card('K'));
    
    expect(hand.cards).toHaveLength(2);
    expect(hand.cards[0].rank).toBe('A');
    expect(hand.cards[1].rank).toBe('K');
  });

  it('sets busted flag when over 21', () => {
    let hand = createHand();
    hand = addCardToHand(hand, card('K'));
    hand = addCardToHand(hand, card('Q'));
    expect(hand.isBusted).toBe(false);
    
    hand = addCardToHand(hand, card('5'));
    expect(hand.isBusted).toBe(true);
  });
});

describe('evaluateHand', () => {
  it('calculates hard totals correctly', () => {
    let hand = createHand();
    hand = addCardToHand(hand, card('7'));
    hand = addCardToHand(hand, card('9'));
    
    const result = evaluateHand(hand);
    expect(result.value).toBe(16);
    expect(result.isSoft).toBe(false);
  });

  it('calculates soft totals correctly', () => {
    let hand = createHand();
    hand = addCardToHand(hand, card('A'));
    hand = addCardToHand(hand, card('6'));
    
    const result = evaluateHand(hand);
    expect(result.value).toBe(17);
    expect(result.isSoft).toBe(true);
  });

  it('converts ace when necessary to avoid bust', () => {
    let hand = createHand();
    hand = addCardToHand(hand, card('A'));
    hand = addCardToHand(hand, card('7'));
    hand = addCardToHand(hand, card('8'));
    
    const result = evaluateHand(hand);
    expect(result.value).toBe(16); // A=1, 7, 8 = 16
    expect(result.isSoft).toBe(false);
  });

  it('handles multiple aces correctly', () => {
    let hand = createHand();
    hand = addCardToHand(hand, card('A'));
    hand = addCardToHand(hand, card('A'));
    hand = addCardToHand(hand, card('9'));
    
    const result = evaluateHand(hand);
    expect(result.value).toBe(21); // A=11, A=1, 9 = 21
    expect(result.isSoft).toBe(true);
  });

  it('handles three aces', () => {
    let hand = createHand();
    hand = addCardToHand(hand, card('A'));
    hand = addCardToHand(hand, card('A'));
    hand = addCardToHand(hand, card('A'));
    
    const result = evaluateHand(hand);
    expect(result.value).toBe(13); // A=11, A=1, A=1 = 13
    expect(result.isSoft).toBe(true);
  });

  it('handles all aces converting', () => {
    let hand = createHand();
    hand = addCardToHand(hand, card('A'));
    hand = addCardToHand(hand, card('A'));
    hand = addCardToHand(hand, card('A'));
    hand = addCardToHand(hand, card('9'));
    
    const result = evaluateHand(hand);
    expect(result.value).toBe(12); // A=1, A=1, A=1, 9 = 12
    expect(result.isSoft).toBe(false);
  });

  it('calculates face cards as 10', () => {
    let hand = createHand();
    hand = addCardToHand(hand, card('J'));
    hand = addCardToHand(hand, card('Q'));
    
    const result = evaluateHand(hand);
    expect(result.value).toBe(20);
  });

  it('handles 21 non-soft', () => {
    let hand = createHand();
    hand = addCardToHand(hand, card('7'));
    hand = addCardToHand(hand, card('7'));
    hand = addCardToHand(hand, card('7'));
    
    const result = evaluateHand(hand);
    expect(result.value).toBe(21);
    expect(result.isSoft).toBe(false);
  });
});

describe('isBlackjack', () => {
  it('detects blackjack (A + 10)', () => {
    let hand = createHand();
    hand = addCardToHand(hand, card('A'));
    hand = addCardToHand(hand, card('K'));
    
    expect(isBlackjack(hand)).toBe(true);
  });

  it('detects blackjack (10 + A)', () => {
    let hand = createHand();
    hand = addCardToHand(hand, card('10'));
    hand = addCardToHand(hand, card('A'));
    
    expect(isBlackjack(hand)).toBe(true);
  });

  it('returns false for 21 with 3+ cards', () => {
    let hand = createHand();
    hand = addCardToHand(hand, card('7'));
    hand = addCardToHand(hand, card('7'));
    hand = addCardToHand(hand, card('7'));
    
    expect(isBlackjack(hand)).toBe(false);
  });

  it('returns false for split hands making 21', () => {
    let hand = createHand();
    hand = { ...hand, isSplit: true };
    hand = addCardToHand(hand, card('A'));
    hand = addCardToHand(hand, card('K'));
    
    expect(isBlackjack(hand)).toBe(false);
  });

  it('returns false for non-21 hands', () => {
    let hand = createHand();
    hand = addCardToHand(hand, card('A'));
    hand = addCardToHand(hand, card('5'));
    
    expect(isBlackjack(hand)).toBe(false);
  });
});

describe('isBusted', () => {
  it('returns true when value > 21', () => {
    let hand = createHand();
    hand = addCardToHand(hand, card('K'));
    hand = addCardToHand(hand, card('Q'));
    hand = addCardToHand(hand, card('5'));
    
    expect(isBusted(hand)).toBe(true);
  });

  it('returns false when value <= 21', () => {
    let hand = createHand();
    hand = addCardToHand(hand, card('K'));
    hand = addCardToHand(hand, card('Q'));
    
    expect(isBusted(hand)).toBe(false);
  });

  it('returns false when ace saves from bust', () => {
    let hand = createHand();
    hand = addCardToHand(hand, card('A'));
    hand = addCardToHand(hand, card('K'));
    hand = addCardToHand(hand, card('5'));
    
    expect(isBusted(hand)).toBe(false); // A=1, K=10, 5 = 16
  });
});

describe('isPair', () => {
  it('identifies pair of same rank', () => {
    let hand = createHand();
    hand = addCardToHand(hand, card('8', 'hearts'));
    hand = addCardToHand(hand, card('8', 'spades'));
    
    expect(isPair(hand)).toBe(true);
  });

  it('returns false for 10 + K (different ranks)', () => {
    let hand = createHand();
    hand = addCardToHand(hand, card('10'));
    hand = addCardToHand(hand, card('K'));
    
    expect(isPair(hand)).toBe(false);
  });

  it('returns false for 3+ cards', () => {
    let hand = createHand();
    hand = addCardToHand(hand, card('8'));
    hand = addCardToHand(hand, card('8'));
    hand = addCardToHand(hand, card('2'));
    
    expect(isPair(hand)).toBe(false);
  });

  it('identifies ace pair', () => {
    let hand = createHand();
    hand = addCardToHand(hand, card('A', 'hearts'));
    hand = addCardToHand(hand, card('A', 'spades'));
    
    expect(isPair(hand)).toBe(true);
  });
});

describe('getHandType', () => {
  it('returns pair for pairs', () => {
    let hand = createHand();
    hand = addCardToHand(hand, card('8'));
    hand = addCardToHand(hand, card('8'));
    
    expect(getHandType(hand)).toBe('pair');
  });

  it('returns soft for soft hands', () => {
    let hand = createHand();
    hand = addCardToHand(hand, card('A'));
    hand = addCardToHand(hand, card('6'));
    
    expect(getHandType(hand)).toBe('soft');
  });

  it('returns hard for hard hands', () => {
    let hand = createHand();
    hand = addCardToHand(hand, card('10'));
    hand = addCardToHand(hand, card('6'));
    
    expect(getHandType(hand)).toBe('hard');
  });

  it('returns soft for soft 21', () => {
    let hand = createHand();
    hand = addCardToHand(hand, card('A'));
    hand = addCardToHand(hand, card('A'));
    hand = addCardToHand(hand, card('9'));
    
    expect(getHandType(hand)).toBe('soft');
  });
});

describe('canSplit', () => {
  it('allows split on pair with available splits', () => {
    let hand = createHand(100);
    hand = addCardToHand(hand, card('8'));
    hand = addCardToHand(hand, card('8'));
    
    expect(canSplit(hand, VEGAS_STRIP_RULES, 0)).toBe(true);
  });

  it('disallows split on non-pair', () => {
    let hand = createHand(100);
    hand = addCardToHand(hand, card('8'));
    hand = addCardToHand(hand, card('9'));
    
    expect(canSplit(hand, VEGAS_STRIP_RULES, 0)).toBe(false);
  });

  it('disallows split when at limit', () => {
    let hand = createHand(100);
    hand = addCardToHand(hand, card('8'));
    hand = addCardToHand(hand, card('8'));
    
    expect(canSplit(hand, VEGAS_STRIP_RULES, 3)).toBe(false);
  });

  it('disallows resplit aces by default', () => {
    let hand = createHand(100);
    hand = { ...hand, isSplitAce: true };
    hand = addCardToHand(hand, card('A'));
    hand = addCardToHand(hand, card('A'));
    
    expect(canSplit(hand, VEGAS_STRIP_RULES, 1)).toBe(false);
  });
});

describe('canDouble', () => {
  it('allows double on 2 cards', () => {
    let hand = createHand(100);
    hand = addCardToHand(hand, card('5'));
    hand = addCardToHand(hand, card('6'));
    
    expect(canDouble(hand, VEGAS_STRIP_RULES)).toBe(true);
  });

  it('disallows double on 3+ cards', () => {
    let hand = createHand(100);
    hand = addCardToHand(hand, card('3'));
    hand = addCardToHand(hand, card('3'));
    hand = addCardToHand(hand, card('5'));
    
    expect(canDouble(hand, VEGAS_STRIP_RULES)).toBe(false);
  });

  it('allows DAS when rules permit', () => {
    let hand = createHand(100);
    hand = { ...hand, isSplit: true };
    hand = addCardToHand(hand, card('5'));
    hand = addCardToHand(hand, card('6'));
    
    expect(canDouble(hand, VEGAS_STRIP_RULES)).toBe(true);
  });

  it('disallows DAS when rules prohibit', () => {
    let hand = createHand(100);
    hand = { ...hand, isSplit: true };
    hand = addCardToHand(hand, card('5'));
    hand = addCardToHand(hand, card('6'));
    
    expect(canDouble(hand, EUROPEAN_RULES)).toBe(false);
  });

  it('respects 9-11 restriction', () => {
    const rules = { ...VEGAS_STRIP_RULES, doubleDownOn: '9-11' as const };
    
    let hand8 = createHand(100);
    hand8 = addCardToHand(hand8, card('4'));
    hand8 = addCardToHand(hand8, card('4'));
    expect(canDouble(hand8, rules)).toBe(false); // 8
    
    let hand11 = createHand(100);
    hand11 = addCardToHand(hand11, card('6'));
    hand11 = addCardToHand(hand11, card('5'));
    expect(canDouble(hand11, rules)).toBe(true); // 11
  });
});

describe('canSurrender', () => {
  it('allows surrender with late surrender rules', () => {
    let hand = createHand(100);
    hand = addCardToHand(hand, card('10'));
    hand = addCardToHand(hand, card('6'));
    
    expect(canSurrender(hand, VEGAS_STRIP_RULES)).toBe(true);
  });

  it('disallows surrender with no surrender rules', () => {
    let hand = createHand(100);
    hand = addCardToHand(hand, card('10'));
    hand = addCardToHand(hand, card('6'));
    
    expect(canSurrender(hand, EUROPEAN_RULES)).toBe(false);
  });

  it('disallows surrender after hitting', () => {
    let hand = createHand(100);
    hand = addCardToHand(hand, card('5'));
    hand = addCardToHand(hand, card('5'));
    hand = addCardToHand(hand, card('2'));
    
    expect(canSurrender(hand, VEGAS_STRIP_RULES)).toBe(false);
  });
});

describe('canHit', () => {
  it('allows hit on active hand', () => {
    let hand = createHand(100);
    hand = addCardToHand(hand, card('5'));
    hand = addCardToHand(hand, card('6'));
    
    expect(canHit(hand, VEGAS_STRIP_RULES)).toBe(true);
  });

  it('disallows hit on stood hand', () => {
    let hand = createHand(100);
    hand = addCardToHand(hand, card('5'));
    hand = addCardToHand(hand, card('6'));
    hand = standHand(hand);
    
    expect(canHit(hand, VEGAS_STRIP_RULES)).toBe(false);
  });

  it('disallows hit on busted hand', () => {
    let hand = createHand(100);
    hand = addCardToHand(hand, card('K'));
    hand = addCardToHand(hand, card('Q'));
    hand = addCardToHand(hand, card('5'));
    
    expect(canHit(hand, VEGAS_STRIP_RULES)).toBe(false);
  });

  it('disallows hit on split aces after one card', () => {
    let hand = createHand(100);
    hand = { ...hand, isSplitAce: true };
    hand = addCardToHand(hand, card('A'));
    hand = addCardToHand(hand, card('5'));
    
    expect(canHit(hand, VEGAS_STRIP_RULES)).toBe(false);
  });
});

describe('standHand', () => {
  it('marks hand as stood', () => {
    let hand = createHand(100);
    hand = addCardToHand(hand, card('K'));
    hand = addCardToHand(hand, card('7'));
    hand = standHand(hand);
    
    expect(hand.isStood).toBe(true);
  });
});

describe('doubleHand', () => {
  it('doubles the bet', () => {
    let hand = createHand(100);
    hand = addCardToHand(hand, card('5'));
    hand = addCardToHand(hand, card('6'));
    hand = doubleHand(hand);
    
    expect(hand.bet).toBe(200);
    expect(hand.isDoubled).toBe(true);
  });
});

describe('surrenderHand', () => {
  it('marks hand as surrendered', () => {
    let hand = createHand(100);
    hand = addCardToHand(hand, card('10'));
    hand = addCardToHand(hand, card('6'));
    hand = surrenderHand(hand);
    
    expect(hand.isSurrendered).toBe(true);
  });
});

describe('splitHand', () => {
  it('creates two hands from pair', () => {
    let hand = createHand(100);
    hand = addCardToHand(hand, card('8', 'hearts'));
    hand = addCardToHand(hand, card('8', 'spades'));
    
    const [h1, h2] = splitHand(hand);
    
    expect(h1.cards).toHaveLength(1);
    expect(h2.cards).toHaveLength(1);
    expect(h1.cards[0].rank).toBe('8');
    expect(h2.cards[0].rank).toBe('8');
    expect(h1.bet).toBe(100);
    expect(h2.bet).toBe(100);
    expect(h1.isSplit).toBe(true);
    expect(h2.isSplit).toBe(true);
  });

  it('marks ace splits', () => {
    let hand = createHand(100);
    hand = addCardToHand(hand, card('A', 'hearts'));
    hand = addCardToHand(hand, card('A', 'spades'));
    
    const [h1, h2] = splitHand(hand);
    
    expect(h1.isSplitAce).toBe(true);
    expect(h2.isSplitAce).toBe(true);
  });

  it('throws on non-pair', () => {
    let hand = createHand(100);
    hand = addCardToHand(hand, card('8'));
    hand = addCardToHand(hand, card('9'));
    
    expect(() => splitHand(hand)).toThrow();
  });
});

describe('handToString', () => {
  it('formats hand correctly', () => {
    let hand = createHand();
    hand = addCardToHand(hand, card('A', 'hearts'));
    hand = addCardToHand(hand, card('6', 'spades'));
    
    const str = handToString(hand);
    expect(str).toContain('Ah');
    expect(str).toContain('6s');
    expect(str).toContain('17');
    expect(str).toContain('soft');
  });
});
