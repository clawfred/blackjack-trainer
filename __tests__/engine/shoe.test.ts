import { describe, it, expect } from 'vitest';
import {
  createDeck,
  createShoe,
  shuffleShoe,
  shuffleShoeWithRng,
  dealCard,
  placeCutCard,
  needsShuffle,
  burnCard,
  cardsRemaining,
  cardsDealt,
  getRunningCount,
  getTrueCount,
  resetShoe,
  initializeShoe,
} from '../../src/engine/shoe';
import { SUITS, RANKS } from '../../src/types';

describe('createDeck', () => {
  it('creates exactly 52 cards', () => {
    const deck = createDeck();
    expect(deck).toHaveLength(52);
  });

  it('contains all suits and ranks', () => {
    const deck = createDeck();
    
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        const found = deck.some(card => card.suit === suit && card.rank === rank);
        expect(found).toBe(true);
      }
    }
  });

  it('cards have correct values', () => {
    const deck = createDeck();
    
    // Check ace
    const ace = deck.find(c => c.rank === 'A');
    expect(ace?.value).toBe(11);
    expect(ace?.countValue).toBe(-1);
    
    // Check number cards
    const five = deck.find(c => c.rank === '5');
    expect(five?.value).toBe(5);
    expect(five?.countValue).toBe(1);
    
    const seven = deck.find(c => c.rank === '7');
    expect(seven?.value).toBe(7);
    expect(seven?.countValue).toBe(0);
    
    // Check face cards
    const king = deck.find(c => c.rank === 'K');
    expect(king?.value).toBe(10);
    expect(king?.countValue).toBe(-1);
  });
});

describe('createShoe', () => {
  it('creates 6-deck shoe with 312 cards', () => {
    const shoe = createShoe(6);
    expect(shoe.cards).toHaveLength(312);
    expect(shoe.numDecks).toBe(6);
  });

  it('creates 8-deck shoe with 416 cards', () => {
    const shoe = createShoe(8);
    expect(shoe.cards).toHaveLength(416);
  });

  it('creates single deck shoe with 52 cards', () => {
    const shoe = createShoe(1);
    expect(shoe.cards).toHaveLength(52);
  });

  it('initializes with correct defaults', () => {
    const shoe = createShoe(6);
    expect(shoe.dealtCards).toHaveLength(0);
    expect(shoe.needsShuffle).toBe(false);
    expect(shoe.cutCardPosition).toBe(234); // 312 * 0.75
  });
});

describe('shuffleShoe', () => {
  it('returns shoe with same number of cards', () => {
    const shoe = createShoe(6);
    const shuffled = shuffleShoe(shoe);
    expect(shuffled.cards).toHaveLength(312);
  });

  it('produces different order than original', () => {
    const shoe = createShoe(6);
    const shuffled = shuffleShoe(shoe);
    
    // Check that not all cards are in the same position
    let samePosition = 0;
    for (let i = 0; i < shoe.cards.length; i++) {
      if (shoe.cards[i].rank === shuffled.cards[i].rank &&
          shoe.cards[i].suit === shuffled.cards[i].suit) {
        samePosition++;
      }
    }
    
    // Statistically, should have very few cards in same position
    expect(samePosition).toBeLessThan(52); // Very conservative
  });

  it('resets needsShuffle flag', () => {
    let shoe = createShoe(1);
    // Deal all cards to trigger needsShuffle
    for (let i = 0; i < 40; i++) {
      [, shoe] = dealCard(shoe);
    }
    expect(shoe.needsShuffle).toBe(true);
    
    const shuffled = shuffleShoe(shoe);
    expect(shuffled.needsShuffle).toBe(false);
  });

  it('combines dealt cards back into deck', () => {
    let shoe = createShoe(1);
    
    // Deal 10 cards
    for (let i = 0; i < 10; i++) {
      [, shoe] = dealCard(shoe);
    }
    
    expect(shoe.cards).toHaveLength(42);
    expect(shoe.dealtCards).toHaveLength(10);
    
    const shuffled = shuffleShoe(shoe);
    expect(shuffled.cards).toHaveLength(52);
    expect(shuffled.dealtCards).toHaveLength(0);
  });
});

describe('shuffleShoeWithRng', () => {
  it('produces deterministic shuffle with fixed RNG', () => {
    const shoe = createShoe(1);
    
    // Create deterministic RNG
    let seed = 12345;
    const rng = () => {
      seed = (seed * 1103515245 + 12345) % (2 ** 31);
      return seed / (2 ** 31);
    };
    
    const shuffled1 = shuffleShoeWithRng(shoe, rng);
    
    // Reset RNG
    seed = 12345;
    const shuffled2 = shuffleShoeWithRng(shoe, rng);
    
    // Should produce same result
    expect(shuffled1.cards.map(c => c.rank + c.suit))
      .toEqual(shuffled2.cards.map(c => c.rank + c.suit));
  });
});

describe('dealCard', () => {
  it('removes and returns top card', () => {
    const shoe = createShoe(1);
    const topCard = shoe.cards[0];
    
    const [dealt, newShoe] = dealCard(shoe);
    
    expect(dealt.rank).toBe(topCard.rank);
    expect(dealt.suit).toBe(topCard.suit);
    expect(newShoe.cards).toHaveLength(51);
  });

  it('adds dealt card to dealtCards', () => {
    const shoe = createShoe(1);
    const [dealt, newShoe] = dealCard(shoe);
    
    expect(newShoe.dealtCards).toHaveLength(1);
    expect(newShoe.dealtCards[0]).toEqual(dealt);
  });

  it('throws on empty shoe', () => {
    let shoe = createShoe(1);
    
    // Deal all cards
    for (let i = 0; i < 52; i++) {
      [, shoe] = dealCard(shoe);
    }
    
    expect(() => dealCard(shoe)).toThrow('Cannot deal from empty shoe');
  });

  it('sets needsShuffle when cut card reached', () => {
    let shoe = createShoe(1);
    shoe = placeCutCard(shoe, 0.5); // Cut at 50%
    
    // Deal cards up to cut card
    for (let i = 0; i < 25; i++) {
      [, shoe] = dealCard(shoe);
    }
    
    expect(shoe.needsShuffle).toBe(false);
    
    // Deal one more (past cut card)
    [, shoe] = dealCard(shoe);
    expect(shoe.needsShuffle).toBe(true);
  });
});

describe('placeCutCard', () => {
  it('sets cut card at correct position', () => {
    const shoe = createShoe(6);
    const updated = placeCutCard(shoe, 0.8);
    
    expect(updated.cutCardPosition).toBe(Math.floor(312 * 0.8));
  });

  it('throws on invalid penetration', () => {
    const shoe = createShoe(6);
    
    expect(() => placeCutCard(shoe, 0.2)).toThrow();
    expect(() => placeCutCard(shoe, 0.99)).toThrow();
  });

  it('accepts valid penetration range', () => {
    const shoe = createShoe(6);
    
    expect(() => placeCutCard(shoe, 0.3)).not.toThrow();
    expect(() => placeCutCard(shoe, 0.95)).not.toThrow();
    expect(() => placeCutCard(shoe, 0.75)).not.toThrow();
  });
});

describe('needsShuffle', () => {
  it('returns false for fresh shoe', () => {
    const shoe = createShoe(6);
    expect(needsShuffle(shoe)).toBe(false);
  });

  it('returns true after cut card reached', () => {
    let shoe = createShoe(1);
    shoe = placeCutCard(shoe, 0.5);
    
    // Deal past cut card
    for (let i = 0; i < 27; i++) {
      [, shoe] = dealCard(shoe);
    }
    
    expect(needsShuffle(shoe)).toBe(true);
  });
});

describe('burnCard', () => {
  it('removes top card without returning it', () => {
    const shoe = createShoe(1);
    const burned = burnCard(shoe);
    
    expect(burned.cards).toHaveLength(51);
    expect(burned.dealtCards).toHaveLength(1);
  });

  it('throws on empty shoe', () => {
    let shoe = createShoe(1);
    for (let i = 0; i < 52; i++) {
      [, shoe] = dealCard(shoe);
    }
    
    expect(() => burnCard(shoe)).toThrow();
  });
});

describe('cardsRemaining', () => {
  it('returns correct count', () => {
    let shoe = createShoe(1);
    expect(cardsRemaining(shoe)).toBe(52);
    
    for (let i = 0; i < 10; i++) {
      [, shoe] = dealCard(shoe);
    }
    
    expect(cardsRemaining(shoe)).toBe(42);
  });
});

describe('cardsDealt', () => {
  it('returns correct count', () => {
    let shoe = createShoe(1);
    expect(cardsDealt(shoe)).toBe(0);
    
    for (let i = 0; i < 10; i++) {
      [, shoe] = dealCard(shoe);
    }
    
    expect(cardsDealt(shoe)).toBe(10);
  });
});

describe('getRunningCount', () => {
  it('returns 0 for fresh shoe', () => {
    const shoe = createShoe(6);
    expect(getRunningCount(shoe)).toBe(0);
  });

  it('calculates count correctly', () => {
    let shoe = createShoe(1);
    shoe = shuffleShoeWithRng(shoe, () => 0.5); // Consistent shuffle
    
    // Deal some cards and manually calculate
    let expectedCount = 0;
    for (let i = 0; i < 10; i++) {
      let card;
      [card, shoe] = dealCard(shoe);
      expectedCount += card.countValue;
    }
    
    expect(getRunningCount(shoe)).toBe(expectedCount);
  });
});

describe('getTrueCount', () => {
  it('divides by decks remaining', () => {
    let shoe = createShoe(6);
    
    // Deal half the cards
    for (let i = 0; i < 156; i++) {
      [, shoe] = dealCard(shoe);
    }
    
    const runningCount = getRunningCount(shoe);
    const trueCount = getTrueCount(shoe);
    
    // 3 decks remaining
    expect(trueCount).toBeCloseTo(runningCount / 3, 1);
  });

  it('handles low deck counts', () => {
    let shoe = createShoe(1);
    
    // Deal almost all cards (leave less than half deck)
    for (let i = 0; i < 45; i++) {
      [, shoe] = dealCard(shoe);
    }
    
    // Should not throw / return NaN
    const trueCount = getTrueCount(shoe);
    expect(Number.isFinite(trueCount)).toBe(true);
  });
});

describe('resetShoe', () => {
  it('combines all cards back', () => {
    let shoe = createShoe(1);
    
    for (let i = 0; i < 20; i++) {
      [, shoe] = dealCard(shoe);
    }
    
    const reset = resetShoe(shoe);
    expect(reset.cards).toHaveLength(52);
    expect(reset.dealtCards).toHaveLength(0);
    expect(reset.needsShuffle).toBe(false);
  });
});

describe('initializeShoe', () => {
  it('creates shuffled shoe with burn card', () => {
    const shoe = initializeShoe(6, 0.75);
    
    expect(shoe.numDecks).toBe(6);
    expect(shoe.cards.length).toBe(311); // 312 - 1 burn card
    expect(shoe.dealtCards).toHaveLength(1); // Burn card
    expect(shoe.cutCardPosition).toBe(Math.floor(312 * 0.75));
    expect(shoe.needsShuffle).toBe(false);
  });
});
